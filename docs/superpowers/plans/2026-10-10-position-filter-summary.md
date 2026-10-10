# Position Filter Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lightweight holding filters and an automatically recalculated summary for the visible positions.

**Architecture:** Keep filter state inside the existing client-side `PositionTable`, because the filters are presentation-only and the full calculated position set is already available as props. Put filtering and aggregation in a focused pure helper module, then render controls and a compact summary bar from the same visible-position array. Pass full-account net assets from `CostPage` only for the “占账户” denominator.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 6, Vitest, Testing Library

---

### Task 1: Add pure filtering and summary calculations

**Files:**
- Create: `src/app/cost/components/position-table-summary.ts`
- Create: `src/app/cost/components/position-table-summary.test.ts`

- [ ] **Step 1: Write failing tests for filter composition and weighted summary**

Create `src/app/cost/components/position-table-summary.test.ts` with fixtures covering style, asset type, Chinese name, case-insensitive ticker code, weighted return, account allocation, non-positive cost, non-positive account assets, and an empty result:

```ts
import { describe, expect, it } from 'vitest';
import type { Position } from '@/types';
import { filterPositions, summarizePositions } from './position-table-summary';

const positions: Position[] = [
  {
    ticker: { id: 'meta', user_id: 'u1', name: 'Meta', code: 'META', type: 'stock_us', currency: 'USD', current_price: 120, price_updated_at: null, style: 'offensive', created_at: '' },
    totalShares: 10, costPerShare: 100, totalCost: 1000, currentPrice: 120,
    marketValue: 1200, optionPnl: 40, pnl: 200, pnlPercent: 20, allocPercent: 12, isNegativeCost: false,
  },
  {
    ticker: { id: 'unh', user_id: 'u1', name: '联合健康', code: 'UNH', type: 'stock_us', currency: 'USD', current_price: 90, price_updated_at: null, style: 'defensive', created_at: '' },
    totalShares: 20, costPerShare: 100, totalCost: 2000, currentPrice: 90,
    marketValue: 1800, optionPnl: 10, pnl: -200, pnlPercent: -10, allocPercent: 18, isNegativeCost: false,
  },
  {
    ticker: { id: 'btc', user_id: 'u1', name: '比特币', code: 'BTC-USD', type: 'crypto', currency: 'USD', current_price: 1500, price_updated_at: null, style: 'offensive', created_at: '' },
    totalShares: 1, costPerShare: -100, totalCost: -100, currentPrice: 1500,
    marketValue: 1500, optionPnl: 0, pnl: 1600, pnlPercent: 0, allocPercent: 15, isNegativeCost: true,
  },
];

describe('position table filtering', () => {
  it('keeps every position when all filters are empty', () => {
    expect(filterPositions(positions, { style: null, type: null, query: '' })).toEqual(positions);
  });

  it('combines style, type, and case-insensitive name/code search', () => {
    expect(filterPositions(positions, { style: 'offensive', type: 'stock_us', query: 'meta' }).map(item => item.ticker.id)).toEqual(['meta']);
    expect(filterPositions(positions, { style: null, type: null, query: '联合' }).map(item => item.ticker.id)).toEqual(['unh']);
    expect(filterPositions(positions, { style: null, type: 'crypto', query: 'btc' }).map(item => item.ticker.id)).toEqual(['btc']);
  });
});

describe('position table summary', () => {
  it('uses aggregate cost instead of averaging row percentages', () => {
    expect(summarizePositions(positions.slice(0, 2), positions.length, 10000)).toEqual({
      visibleCount: 2, totalCount: 3, marketValue: 3000, pnl: 0, returnPercent: 0, accountPercent: 30,
    });
  });

  it('returns null for ratios with non-positive denominators', () => {
    expect(summarizePositions([positions[2]], positions.length, 0)).toEqual({
      visibleCount: 1, totalCount: 3, marketValue: 1500, pnl: 1600, returnPercent: null, accountPercent: null,
    });
  });

  it('returns zero values for an empty result', () => {
    expect(summarizePositions([], positions.length, 10000)).toEqual({
      visibleCount: 0, totalCount: 3, marketValue: 0, pnl: 0, returnPercent: null, accountPercent: 0,
    });
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npx vitest run src/app/cost/components/position-table-summary.test.ts
```

Expected: FAIL because `./position-table-summary` does not exist.

- [ ] **Step 3: Implement the pure helper**

Create `src/app/cost/components/position-table-summary.ts`:

```ts
import type { Position, TickerStyle, TickerType } from '@/types';

export interface PositionFilters {
  style: TickerStyle | null;
  type: TickerType | null;
  query: string;
}

export interface PositionFilterSummary {
  visibleCount: number;
  totalCount: number;
  marketValue: number;
  pnl: number;
  returnPercent: number | null;
  accountPercent: number | null;
}

export function filterPositions(positions: Position[], filters: PositionFilters): Position[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return positions.filter(position => {
    if (filters.style && position.ticker.style !== filters.style) return false;
    if (filters.type && position.ticker.type !== filters.type) return false;
    if (!query) return true;
    return position.ticker.name.toLocaleLowerCase().includes(query)
      || position.ticker.code.toLocaleLowerCase().includes(query);
  });
}

export function summarizePositions(
  visiblePositions: Position[],
  totalCount: number,
  totalAssets: number,
): PositionFilterSummary {
  const marketValue = visiblePositions.reduce((sum, position) => sum + position.marketValue, 0);
  const totalCost = visiblePositions.reduce((sum, position) => sum + position.totalCost, 0);
  const pnl = visiblePositions.reduce((sum, position) => sum + position.pnl, 0);
  return {
    visibleCount: visiblePositions.length,
    totalCount,
    marketValue,
    pnl,
    returnPercent: totalCost > 0 ? pnl / totalCost * 100 : null,
    accountPercent: totalAssets > 0 ? marketValue / totalAssets * 100 : null,
  };
}
```

- [ ] **Step 4: Run the helper test and verify it passes**

Run:

```bash
npx vitest run src/app/cost/components/position-table-summary.test.ts
```

Expected: PASS with 4 tests.

- [ ] **Step 5: Commit the calculation unit**

```bash
git add src/app/cost/components/position-table-summary.ts src/app/cost/components/position-table-summary.test.ts
git commit -m "feat: calculate filtered position summary"
```

### Task 2: Render filters and the compact summary bar

**Files:**
- Modify: `src/app/cost/components/PositionTable.tsx`
- Modify: `src/app/cost/components/PositionTable.test.tsx`

- [ ] **Step 1: Extend the component test fixtures and add failing interaction tests**

In `src/app/cost/components/PositionTable.test.tsx`, add a defensive US-stock position and an offensive crypto position:

```tsx
const defensivePosition: Position = {
  ticker: { id: 'unh', user_id: 'u1', name: '联合健康', code: 'UNH', type: 'stock_us', currency: 'USD', current_price: 90, price_updated_at: null, style: 'defensive', created_at: '' },
  totalShares: 20, costPerShare: 90, totalCost: 1800, currentPrice: 90,
  marketValue: 1800, optionPnl: 0, pnl: 0, pnlPercent: 0, allocPercent: 18, isNegativeCost: false,
};

const cryptoPosition: Position = {
  ticker: { id: 'btc', user_id: 'u1', name: '比特币', code: 'BTC-USD', type: 'crypto', currency: 'USD', current_price: 1500, price_updated_at: null, style: 'offensive', created_at: '' },
  totalShares: 1, costPerShare: 1400, totalCost: 1400, currentPrice: 1500,
  marketValue: 1500, optionPnl: 0, pnl: 100, pnlPercent: 7.14, allocPercent: 15, isNegativeCost: false,
};
```

Pass `totalAssets={10000}` in every render, and add these tests:

```tsx
it('filters positions by style, type, and ticker search', async () => {
  renderPositionTable([position, defensivePosition, cryptoPosition]);

  fireEvent.mouseDown(screen.getByLabelText('属性筛选'));
  fireEvent.click(await screen.findByText('进攻'));
  expect(screen.getByText('英伟达')).toBeInTheDocument();
  expect(screen.getByText('比特币')).toBeInTheDocument();
  expect(screen.queryByText('联合健康')).not.toBeInTheDocument();

  fireEvent.mouseDown(screen.getByLabelText('类型筛选'));
  fireEvent.click(await screen.findByText('美股'));
  expect(screen.getByText('英伟达')).toBeInTheDocument();
  expect(screen.queryByText('比特币')).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('搜索标的'), { target: { value: 'nvda' } });
  expect(screen.getByText('英伟达')).toBeInTheDocument();
});

it('recalculates the visible summary with weighted return and account share', () => {
  renderPositionTable([position, defensivePosition]);
  expect(screen.getByText('2 / 2')).toBeInTheDocument();
  expect(screen.getByText('$3,450.00')).toBeInTheDocument();
  expect(screen.getByText('+$150.00')).toBeInTheDocument();
  expect(screen.getByText('+4.55%')).toBeInTheDocument();
  expect(screen.getByText('34.5%')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('搜索标的'), { target: { value: '不存在' } });
  expect(screen.getByText('0 / 2')).toBeInTheDocument();
  expect(screen.getAllByText('$0.00').length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText('—')).toBeInTheDocument();
});
```

Use a local render helper so every test supplies all required callbacks consistently:

```tsx
function renderPositionTable(positions: Position[]) {
  return render(
    <App>
      <PositionTable
        positions={positions}
        totalAssets={10000}
        loading={false}
        onViewTransactions={vi.fn()}
        onViewPendingOrders={vi.fn()}
        onPriceChange={vi.fn()}
        onSyncPrices={vi.fn()}
        onRefresh={vi.fn()}
        syncing={false}
        priceUpdatedAt={{}}
      />
    </App>,
  );
}
```

- [ ] **Step 2: Run the component test and verify it fails**

Run:

```bash
npx vitest run src/app/cost/components/PositionTable.test.tsx
```

Expected: FAIL because the filter controls, summary values, and `totalAssets` prop are not implemented.

- [ ] **Step 3: Add filter state and derive the visible data once**

Update `src/app/cost/components/PositionTable.tsx` to import `Input` and `useMemo`, import `TickerType`, add `totalAssets: number` to `Props`, and derive filtered positions and summary:

```tsx
import React, { useMemo, useState } from 'react';
import { Table, Tag, Button, Input, InputNumber, Select, App, Tooltip, Space, Typography } from 'antd';
import { filterPositions, summarizePositions } from './position-table-summary';
import type { Position, TickerStyle, TickerType } from '@/types';

interface Props {
  positions: Position[];
  totalAssets: number;
  // existing props remain unchanged
}

const [styleFilter, setStyleFilter] = useState<TickerStyle | null>(null);
const [typeFilter, setTypeFilter] = useState<TickerType | null>(null);
const [query, setQuery] = useState('');

const visiblePositions = useMemo(
  () => filterPositions(positions, { style: styleFilter, type: typeFilter, query }),
  [positions, styleFilter, typeFilter, query],
);
const filteredSummary = useMemo(
  () => summarizePositions(visiblePositions, positions.length, totalAssets),
  [visiblePositions, positions.length, totalAssets],
);
```

Keep the file as a Client Component, consistent with the Next.js 16 client-component guidance because it uses state and event handlers.

- [ ] **Step 4: Render the controls and summary bar**

Replace the current update-button-only row with a wrapping toolbar whose left side contains the three controls and whose right side retains the existing update button:

```tsx
<div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
  <Space wrap>
    <Select aria-label="属性筛选" value={styleFilter} onChange={setStyleFilter} style={{ width: 120 }} options={[{ value: null, label: '全部属性' }, ...styleSelectOptions]} />
    <Select aria-label="类型筛选" value={typeFilter} onChange={setTypeFilter} style={{ width: 120 }} options={[{ value: null, label: '全部类型' }, ...typeSelectOptions]} />
    <Input.Search aria-label="搜索标的" allowClear placeholder="搜索名称或代码" value={query} onChange={event => setQuery(event.target.value)} style={{ width: 220 }} />
  </Space>
  <Button icon={<CloudSyncOutlined />} onClick={onSyncPrices} loading={syncing} size="small">一键更新收盘价</Button>
</div>
<Space wrap size="large" style={{ width: '100%', marginBottom: 12, padding: '8px 12px', background: '#fafafa', borderRadius: 6 }}>
  <Typography.Text type="secondary">已显示 <Typography.Text strong>{filteredSummary.visibleCount} / {filteredSummary.totalCount}</Typography.Text></Typography.Text>
  <Typography.Text type="secondary">市值 <Typography.Text strong>${filteredSummary.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography.Text></Typography.Text>
  <Typography.Text type="secondary">浮盈亏 <Typography.Text strong type={filteredSummary.pnl >= 0 ? 'danger' : 'success'}>{formatSignedUsd(filteredSummary.pnl)}</Typography.Text></Typography.Text>
  <Typography.Text type="secondary">收益率 <Typography.Text strong type={(filteredSummary.returnPercent ?? 0) >= 0 ? 'danger' : 'success'}>{formatPercent(filteredSummary.returnPercent, true)}</Typography.Text></Typography.Text>
  <Typography.Text type="secondary">占账户 <Typography.Text strong>{formatPercent(filteredSummary.accountPercent, false)}</Typography.Text></Typography.Text>
</Space>
```

Define the asset-type options and formatting helpers near the existing option constants:

```tsx
const typeSelectOptions: Array<{ value: TickerType; label: string }> = [
  { value: 'stock_us', label: '美股' },
  { value: 'stock_hk', label: '港股' },
  { value: 'stock_a', label: 'A股' },
  { value: 'crypto', label: '加密' },
];

function formatSignedUsd(value: number): string {
  const amount = Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${value >= 0 ? '+' : '-'}$${amount}`;
}

function formatPercent(value: number | null, signed: boolean): string {
  if (value === null) return '—';
  return `${signed && value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}
```

Use `visiblePositions` rather than `positions` as the table `dataSource`:

```tsx
<Table
  dataSource={visiblePositions}
  columns={columns}
  rowKey={record => record.ticker.id}
  loading={loading}
  pagination={false}
  size="small"
  scroll={{ x: 1150 }}
/>
```

Preserve the table columns, row actions, price editing, and scrolling behavior unchanged.

- [ ] **Step 5: Run the component and helper tests**

Run:

```bash
npx vitest run src/app/cost/components/PositionTable.test.tsx src/app/cost/components/position-table-summary.test.ts
```

Expected: PASS for both files.

- [ ] **Step 6: Commit the interactive table UI**

```bash
git add src/app/cost/components/PositionTable.tsx src/app/cost/components/PositionTable.test.tsx
git commit -m "feat: filter holdings and show visible summary"
```

### Task 3: Connect the full-account denominator and verify the page

**Files:**
- Modify: `src/app/cost/page.tsx`
- Modify: `src/app/cost/page.test.tsx`

- [ ] **Step 1: Make the page mock expose the new prop and add a failing assertion**

Change the `PositionTable` mock in `src/app/cost/page.test.tsx` so it renders the received denominator:

```tsx
vi.mock('./components/PositionTable', () => ({
  default: ({ onSyncPrices, totalAssets }: { onSyncPrices: () => void; totalAssets: number }) => (
    <div>
      <span>持仓汇总分母：{totalAssets}</span>
      <button onClick={onSyncPrices}>测试更新价格</button>
    </div>
  ),
}));
```

In the existing account-distribution test, return opening cash of `10000` from `/api/positions`, then assert:

```tsx
expect(await screen.findByText('持仓汇总分母：10000')).toBeInTheDocument();
```

- [ ] **Step 2: Run the page test and verify it fails**

Run:

```bash
npx vitest run src/app/cost/page.test.tsx
```

Expected: FAIL because `CostPage` does not pass `totalAssets` to `PositionTable`.

- [ ] **Step 3: Pass the account net assets to the table**

Add the prop at the existing `PositionTable` call site in `src/app/cost/page.tsx`:

```tsx
<PositionTable
  positions={summary?.positions || []}
  totalAssets={summary?.totalAssets ?? 0}
  loading={loading}
  // existing props remain unchanged
/>
```

- [ ] **Step 4: Run focused tests, type checking, and lint**

Run:

```bash
npx vitest run src/app/cost/components/position-table-summary.test.ts src/app/cost/components/PositionTable.test.tsx src/app/cost/page.test.tsx
npx tsc --noEmit
npx eslint src/app/cost/components/position-table-summary.ts src/app/cost/components/position-table-summary.test.ts src/app/cost/components/PositionTable.tsx src/app/cost/components/PositionTable.test.tsx src/app/cost/page.tsx src/app/cost/page.test.tsx
```

Expected: all focused tests pass; TypeScript and ESLint exit with code 0.

- [ ] **Step 5: Run the full regression suite**

Run:

```bash
npm test
```

Expected: the full Vitest suite passes with no failures.

- [ ] **Step 6: Commit the page integration**

```bash
git add src/app/cost/page.tsx src/app/cost/page.test.tsx
git commit -m "feat: connect account share to position filters"
```
