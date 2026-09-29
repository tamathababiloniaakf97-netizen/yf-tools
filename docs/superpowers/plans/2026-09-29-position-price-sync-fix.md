# Position Price Sync Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make one-click price updates reliable in the current network and let users find market codes by selecting a verified search result instead of knowing the code beforehand.

**Architecture:** Isolate symbol conversion and response parsing in pure market-data modules, keep remote fetch orchestration on the server, and return an explicit success or failure result for every ticker. Add one authenticated search endpoint consumed by the existing ticker modal; a selected candidate becomes the persisted name, code, type, and currency.

**Tech Stack:** Next.js 16 route handlers, React 19, TypeScript, Ant Design, Supabase, Vitest, React Testing Library

---

### Task 1: Implement and test verified quote-source adapters

**Files:**
- Create: `src/lib/market-data/quotes.test.ts`
- Create: `src/lib/market-data/quotes.ts`

- [ ] Write failing tests for `usSPY`, `hk00700`, `sh600519`, `sz000001`, `BTC-USD`, Tencent `~` response parsing, Coinbase JSON parsing, unsupported types, and empty prices.
- [ ] Run `npx vitest run src/lib/market-data/quotes.test.ts --maxWorkers=1` and confirm RED because the module is absent.
- [ ] Implement pure symbol and parser functions plus `fetchMarketPrice(ticker, fetcher = fetch)` using `cache: 'no-store'` and a structured `{ ok, price, source, error }` result.
- [ ] Run the focused test and confirm GREEN.
- [ ] Commit only the two quote adapter files with `feat: add verified market quote adapters`.

### Task 2: Return honest per-ticker synchronization results

**Files:**
- Create: `src/lib/market-data/sync-results.test.ts`
- Create: `src/lib/market-data/sync-results.ts`
- Modify: `src/app/api/prices/sync/route.ts`
- Modify: `src/app/cost/page.tsx`

- [ ] Write failing tests proving that a fetched price counts as success only after database persistence succeeds, and that fetch, parse, unsupported-type, and database failures produce readable per-ticker errors.
- [ ] Run the focused tests and confirm RED.
- [ ] Implement a small synchronization helper with injected quote and persistence functions; update the route to use it and return ordered `results` containing `status`, `price`, `source`, and `error`.
- [ ] Remove all `revalidate: 300` behavior from price refresh.
- [ ] Update the page to apply only successful results, use the returned update date, and show `成功更新 X 个，失败 Y 个` with failed codes and reasons. All failures must show an error rather than success.
- [ ] Run synchronization and existing cost-engine tests and confirm GREEN.
- [ ] Commit relevant files with `fix: make price synchronization truthful`.

### Task 3: Search ticker candidates by name or code

**Files:**
- Create: `src/lib/market-data/ticker-search.test.ts`
- Create: `src/lib/market-data/ticker-search.ts`
- Create: `src/app/api/tickers/search/route.ts`

- [ ] Write failing tests for mapping EastMoney stock candidates to `stock_us`, `stock_hk`, and `stock_a`, filtering unsupported markets, Coinbase USD products, common Chinese crypto aliases, deduplication, and result limits.
- [ ] Run the focused test and confirm RED.
- [ ] Implement pure candidate normalization and server fetch functions. Stock search uses the verified EastMoney suggestion endpoint only; crypto search uses the verified Coinbase product catalog. Neither function selects a result automatically.
- [ ] Implement authenticated `GET /api/tickers/search?query=<text>&category=stock|crypto`, validate query length, and return normalized candidates.
- [ ] Run the focused test and confirm GREEN.
- [ ] Commit the search module and route with `feat: search ticker candidates`.

### Task 4: Replace code memorization with candidate selection

**Files:**
- Create: `src/app/cost/components/TickerModal.test.tsx`
- Modify: `src/app/cost/components/TickerModal.tsx`

- [ ] Write a failing component test that types a name, sees multiple candidates, selects one, and verifies submitted `name`, `code`, `type`, and `currency`. Add a separate assertion that the first result is never selected automatically.
- [ ] Run `npx vitest run src/app/cost/components/TickerModal.test.tsx --maxWorkers=1` and confirm RED.
- [ ] Add a debounced search field, stock/crypto category selector, explicit candidate list, selected-candidate summary, and a manual-entry fallback. Search selection fills and locks normalized fields; switching to manual entry restores the current fields and format help.
- [ ] Run the component test and confirm GREEN.
- [ ] Commit the modal and test with `feat: select tickers from verified search results`.

### Task 5: Final verification and live smoke test

**Files:**
- Modify only if verification exposes a defect in the files above.

- [ ] Run `npx vitest run src/lib/market-data src/app/cost/components/TickerModal.test.tsx --maxWorkers=1`.
- [ ] Run `npm run typecheck` and targeted ESLint for the changed files.
- [ ] Run the production build using the existing local environment.
- [ ] Call the live quote adapters for one US stock, one HK stock, one A-share, and BTC; verify positive prices and record only status/source, not fixed expected prices.
- [ ] In the logged-in local app, search a Chinese stock name, explicitly select a candidate, save it, run one-click price update, and verify the displayed price and update date persist after reload. Do not create permanent smoke-test data if no disposable ticker is available.
