# Resilient Crypto Quotes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make BTC and ETH refresh successfully on the current network and repair numeric Shanghai fund quote routing.

**Architecture:** Keep quote-provider parsing in `quotes.ts`. Crypto requests try Coinbase spot first, then the locally verified CoinLore ticker endpoint, then Coinbase's latest completed hourly candle. Numeric six-digit security codes override an incorrect stored US-stock type and route through the A-share Tencent endpoint. Existing sync persistence remains unchanged.

**Tech Stack:** Next.js 16 route handlers, TypeScript, Vitest, public Coinbase/CoinLore/Tencent HTTP APIs.

---

### Task 1: Reproduce provider and symbol failures

**Files:**
- Modify: `src/lib/market-data/quotes.test.ts`
- Test: `src/lib/market-data/quotes.test.ts`

- [x] Add tests asserting that six-digit `513130` builds `sh513130` even when the stored type is `stock_us`, CoinLore parses BTC/ETH `price_usd`, the latest unfinished Coinbase candle is skipped, and crypto fetch falls through from Coinbase to CoinLore.
- [ ] Run `npm test -- src/lib/market-data/quotes.test.ts` and confirm failures are caused by missing fallback behavior.

### Task 2: Implement resilient crypto quote flow

**Files:**
- Modify: `src/lib/market-data/quotes.ts`
- Test: `src/lib/market-data/quotes.test.ts`

- [x] Add pure parsers for CoinLore ticker arrays and Coinbase candle arrays.
- [x] Add a BTC/ETH CoinLore ID map (`BTC: 90`, `ETH: 80`) and request helpers with independent eight-second timeouts.
- [x] For crypto, try Coinbase spot, CoinLore ticker, then the most recent completed Coinbase 1h close; combine provider failures when all attempts fail.
- [ ] Route six-digit codes starting in 5, 6, or 9 to Shanghai and other six-digit numeric codes to Shenzhen before consulting the stored ticker type.
- [ ] Run `npm test -- src/lib/market-data/quotes.test.ts` and confirm all quote tests pass.

### Task 3: Regression verification

**Files:**
- Verify: `src/app/api/prices/sync/route.ts`
- Verify: `src/lib/market-data/sync-results.test.ts`

- [ ] Run `npm test -- src/lib/market-data/quotes.test.ts src/lib/market-data/sync-results.test.ts`.
- [ ] Run `npm run build` and confirm the production build succeeds.
- [x] Call the authenticated refresh from the open workbench and confirm BTC/ETH no longer report Coinbase timeout and `513130` no longer reports an invalid Tencent price.
