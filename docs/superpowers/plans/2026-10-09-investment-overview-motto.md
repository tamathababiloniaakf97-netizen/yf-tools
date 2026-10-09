# Investment Overview Motto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a responsive, static four-seal “道势法术” motto beside the investment overview title.

**Architecture:** Implement the motto as a small presentational React component colocated with the investment overview page, then compose it into the existing heading. Keep all interaction and data loading unchanged; responsive behavior belongs in the existing global stylesheet.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design, CSS, Vitest, Testing Library

---

### Task 1: Static motto component

**Files:**
- Create: `src/app/investment/components/InvestmentMotto.tsx`
- Create: `src/app/investment/components/InvestmentMotto.test.tsx`

- [ ] **Step 1: Write the failing component test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InvestmentMotto from './InvestmentMotto';

describe('InvestmentMotto', () => {
  it('renders four ordered, non-interactive seals', () => {
    const { container } = render(<InvestmentMotto />);
    expect(screen.getByLabelText('道势法术')).toHaveTextContent('道势法术');
    expect(container.querySelectorAll('.investment-motto-seal')).toHaveLength(4);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and verify the missing component causes failure**

Run: `npm test -- src/app/investment/components/InvestmentMotto.test.tsx`

Expected: FAIL because `./InvestmentMotto` does not exist.

- [ ] **Step 3: Add the minimal static component**

```tsx
const motto = ['道', '势', '法', '术'] as const;

export default function InvestmentMotto() {
  return (
    <span className="investment-motto" aria-label="道势法术">
      {motto.map((character) => <span className="investment-motto-seal" key={character} aria-hidden="true">{character}</span>)}
    </span>
  );
}
```

- [ ] **Step 4: Run the component test and verify it passes**

Run: `npm test -- src/app/investment/components/InvestmentMotto.test.tsx`

Expected: 1 test passes.

### Task 2: Heading composition and responsive styling

**Files:**
- Modify: `src/app/investment/page.tsx`
- Modify: `src/app/globals.css`
- Test: `src/app/investment/components/InvestmentMotto.test.tsx`

- [ ] **Step 1: Compose `InvestmentMotto` beside the title**

Import the component and replace the title wrapper with:

```tsx
<div>
  <div className="investment-overview-title-row">
    <Typography.Title level={2}>投资概览</Typography.Title>
    <InvestmentMotto />
  </div>
  <Typography.Text type="secondary">只汇总账户结果和需要注意的风险；交易明细仍在原持仓页面。</Typography.Text>
</div>
```

- [ ] **Step 2: Add restrained seal styling and narrow-screen wrapping**

Add to `src/app/globals.css`:

```css
.investment-overview-title-row { align-items: center; display: flex; flex-wrap: wrap; gap: 12px 18px; }
.investment-overview-title-row .ant-typography { margin: 0; }
.investment-motto { display: inline-flex; flex: 0 0 auto; gap: 7px; }
.investment-motto-seal { align-items: center; background: #fbfaf7; border: 1px solid #b8bec8; border-radius: 4px; color: #566171; display: inline-flex; font-family: KaiTi, STKaiti, SimSun, serif; font-size: 18px; height: 30px; justify-content: center; line-height: 1; width: 30px; }
@media (max-width: 560px) { .investment-overview-title-row { align-items: flex-start; flex-direction: column; gap: 8px; } }
```

- [ ] **Step 3: Run focused tests and lint**

Run: `npm test -- src/app/investment/components/InvestmentMotto.test.tsx src/app/investment/components/InvestmentAttentionCard.test.tsx src/app/investment/components/MarketCycleSummaryCard.test.tsx`

Expected: all focused tests pass.

Run: `npx eslint src/app/investment/page.tsx src/app/investment/components/InvestmentMotto.tsx src/app/investment/components/InvestmentMotto.test.tsx`

Expected: exit code 0 with no errors.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: Next.js build exits with code 0.

- [ ] **Step 5: Commit the implementation files**

```bash
git add src/app/investment/page.tsx src/app/investment/components/InvestmentMotto.tsx src/app/investment/components/InvestmentMotto.test.tsx src/app/globals.css
git commit -m "feat: add investment overview motto"
```
