# Methodology Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add immediate keyword search and category filtering to the investment methodology card list without changing the database or API.

**Architecture:** Put all matching behavior in a pure investment-domain helper that preserves input order. Keep the page responsible only for filter state and rendering, and isolate the filter controls in a small component so their interaction can be tested without mocking the methodology API.

**Tech Stack:** TypeScript, React 19, Next.js 16 App Router, Ant Design 6, Vitest, Testing Library.

---

### Task 1: Implement methodology filtering as a pure function

**Files:**
- Create: `src/lib/investment/methodology-search.ts`
- Create: `src/lib/investment/methodology-search.test.ts`

- [ ] **Step 1: Write the failing search tests**

Create three records in existing updated-time order and assert title, content, case-insensitive English, trimmed keywords, category combinations, unknown-category fallback, empty results, and stable ordering:

```ts
expect(filterMethodologyItems(items, { keyword: '  CASH FLOW ', category: 'all' }).map((item) => item.id)).toEqual(['m1']);
expect(filterMethodologyItems(items, { keyword: '增加仓位', category: 'position' }).map((item) => item.id)).toEqual(['m2']);
expect(filterMethodologyItems(items, { keyword: '', category: 'valuation' }).map((item) => item.id)).toEqual(['m1']);
expect(filterMethodologyItems(items, { keyword: '不存在', category: 'all' })).toEqual([]);
expect(filterMethodologyItems(items, { keyword: '', category: 'unknown' })).toEqual(items);
expect(items.map((item) => item.id)).toEqual(['m1', 'm2', 'm3']);
```

- [ ] **Step 2: Run the test and verify the red state**

Run: `npx vitest run src/lib/investment/methodology-search.test.ts --maxWorkers=1`

Expected: FAIL because `methodology-search.ts` does not exist.

- [ ] **Step 3: Implement the minimal search contract**

Export:

```ts
export type MethodologyCategoryFilter = MethodologyCategory | 'all';
export interface MethodologySearchInput { keyword: string; category: string }
export function methodologySearchText(item: MethodologyItem): string;
export function filterMethodologyItems(items: MethodologyItem[], input: MethodologySearchInput): MethodologyItem[];
```

`methodologySearchText` concatenates `title` and `content`. Normalize both the search text and keyword with `trim().toLocaleLowerCase('zh-CN')`. Apply category only when it is one of the five known categories; otherwise use `all`. Use `filter` so the original array and order remain unchanged.

- [ ] **Step 4: Run the test and verify green**

Run: `npx vitest run src/lib/investment/methodology-search.test.ts --maxWorkers=1`

Expected: PASS.

### Task 2: Build and test the filter controls

**Files:**
- Create: `src/app/investment/methodology/components/MethodologyFilters.tsx`
- Create: `src/app/investment/methodology/components/MethodologyFilters.test.tsx`

- [ ] **Step 1: Write the failing interaction test**

Render the controlled component and assert that typing and selecting a category call the two callbacks:

```tsx
render(<MethodologyFilters keyword="" category="all" onKeywordChange={onKeywordChange} onCategoryChange={onCategoryChange} />);
fireEvent.change(screen.getByPlaceholderText('搜索标题或规则内容'), { target: { value: '现金流' } });
expect(onKeywordChange).toHaveBeenCalledWith('现金流');
fireEvent.click(screen.getByText('估值'));
expect(onCategoryChange).toHaveBeenCalledWith('valuation');
```

- [ ] **Step 2: Run the test and verify the red state**

Run: `npx vitest run src/app/investment/methodology/components/MethodologyFilters.test.tsx --maxWorkers=1`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the filter component**

Use Ant Design `Input` with `SearchOutlined` and a `Segmented` control containing exactly `all`, `selection`, `valuation`, `position`, `discipline`, and `review`. The component remains controlled and contains no methodology data or fetch logic.

- [ ] **Step 4: Run the interaction test and verify green**

Run: `npx vitest run src/app/investment/methodology/components/MethodologyFilters.test.tsx --maxWorkers=1`

Expected: PASS.

### Task 3: Integrate search into the methodology page

**Files:**
- Modify: `src/app/investment/methodology/page.tsx`
- Create: `src/app/investment/methodology/page.test.tsx`

- [ ] **Step 1: Write the failing page behavior test**

Mock `/api/investment/methodology` with three records. Assert the page initially shows all three, typing a title/content keyword narrows the cards, selecting a category combines with the keyword, an unmatched filter shows `没有匹配的方法`, and clicking `清除筛选` restores all cards. Add a separate empty API response assertion for the existing `暂无方法` guidance.

- [ ] **Step 2: Run the page test and verify the red state**

Run: `npx vitest run src/app/investment/methodology/page.test.tsx --maxWorkers=1`

Expected: FAIL because the page has no filter controls or filtered empty state.

- [ ] **Step 3: Integrate filtering**

Add `keyword` and `category` state, calculate `filteredItems` with `useMemo`, render `MethodologyFilters` above the list only when the API loaded at least one record, and pass `filteredItems` to the card list. When `items.length > 0 && filteredItems.length === 0`, render an Ant Design `Empty` with description `没有匹配的方法` and a `清除筛选` button that resets keyword to `''` and category to `'all'`. Do not change `load`, `save`, `remove`, the API, modal fields, or card content.

- [ ] **Step 4: Run all focused tests**

Run:

```bash
npx vitest run src/lib/investment/methodology-search.test.ts src/app/investment/methodology/components/MethodologyFilters.test.tsx src/app/investment/methodology/page.test.tsx --maxWorkers=1
```

Expected: PASS.

- [ ] **Step 5: Verify build and focused lint**

Run:

```bash
npx eslint src/lib/investment/methodology-search.ts src/lib/investment/methodology-search.test.ts src/app/investment/methodology/components/MethodologyFilters.tsx src/app/investment/methodology/components/MethodologyFilters.test.tsx src/app/investment/methodology/page.tsx src/app/investment/methodology/page.test.tsx
npm run build
```

Expected: ESLint returns no errors and the Next.js production build succeeds.

- [ ] **Step 6: Commit the feature**

```bash
git add -- docs/superpowers/plans/2026-10-01-methodology-search.md src/lib/investment/methodology-search.ts src/lib/investment/methodology-search.test.ts src/app/investment/methodology/components/MethodologyFilters.tsx src/app/investment/methodology/components/MethodologyFilters.test.tsx src/app/investment/methodology/page.tsx src/app/investment/methodology/page.test.tsx
git commit -m "feat: search investment methodology"
```
