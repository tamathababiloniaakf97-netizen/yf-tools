# Research and Decision Field Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add concise, persistent writing guidance to every visible company-research and investment-decision field without changing stored data or validation behavior.

**Architecture:** Create one presentation-only `FieldGuidance` component that renders accessible secondary text, then supply page-specific static guidance through the existing `Form.Item.extra` API. Keep field wording beside each editor's field configuration so the two business forms remain understandable without a generic form engine.

**Tech Stack:** Next.js 16 client components, React 19, Ant Design 6 `Form.Item`, TypeScript, Vitest, Testing Library.

---

### Task 1: Persistent field guidance primitive

**Files:**
- Create: `src/app/investment/components/FieldGuidance.tsx`
- Create: `src/app/investment/components/FieldGuidance.test.tsx`

- [ ] **Step 1: Write the failing component test**

```tsx
render(<FieldGuidance>Write the observable facts.</FieldGuidance>);
expect(screen.getByText('Write the observable facts.')).toHaveClass('investment-field-guidance');
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/app/investment/components/FieldGuidance.test.tsx`

Expected: FAIL because `FieldGuidance.tsx` does not exist.

- [ ] **Step 3: Add the minimal component**

```tsx
import type { ReactNode } from 'react';
import { Typography } from 'antd';

export default function FieldGuidance({ children }: { children: ReactNode }) {
  return <Typography.Text type="secondary" className="investment-field-guidance">{children}</Typography.Text>;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/app/investment/components/FieldGuidance.test.tsx`

Expected: one passing test.

### Task 2: Company research guidance

**Files:**
- Modify: `src/app/investment/research/components/ResearchEditor.tsx`
- Modify: `src/app/investment/research/components/ResearchEditor.test.tsx`
- Modify: `src/app/investment/research/components/ResearchChecklist.tsx`

- [ ] **Step 1: Extend the editor test before production code**

Assert representative persistent boundaries from every research section, including:

```tsx
expect(screen.getByText(/不必复述公司历史/)).toBeInTheDocument();
expect(screen.getByText(/不以个人魅力代替证据/)).toBeInTheDocument();
expect(screen.getByText(/这里不直接写买卖决定/)).toBeInTheDocument();
expect(screen.getByText(/不代表研究得分/)).toBeInTheDocument();
```

- [ ] **Step 2: Run the research test and verify RED**

Run: `npm test -- src/app/investment/research/components/ResearchEditor.test.tsx`

Expected: FAIL because the persistent guidance does not exist.

- [ ] **Step 3: Replace placeholder-only configuration with persistent guidance**

Add a `guidance` property to every `coreFields` entry using the exact text in section 4 of the approved design. Render it as:

```tsx
<Form.Item name={field.name} label={...} extra={<FieldGuidance>{field.guidance}</FieldGuidance>}>
  <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} />
</Form.Item>
```

Add the approved `extra` guidance to `management_culture`, `current_judgment`, `risks`, `unknowns`, and `investment_thesis`. Add the shared checklist explanation immediately inside the expanded checklist content before the six prompts. Remove long placeholder guidance once the same instruction is persistently visible.

- [ ] **Step 4: Run the research test and verify GREEN**

Run: `npm test -- src/app/investment/research/components/ResearchEditor.test.tsx`

Expected: all ResearchEditor tests pass.

### Task 3: Investment decision guidance

**Files:**
- Modify: `src/app/investment/decisions/components/DecisionEditor.tsx`
- Modify: `src/app/investment/decisions/components/DecisionEditor.test.tsx`

- [ ] **Step 1: Extend decision tests before production code**

Assert guidance from the main conceptual boundaries and control fields:

```tsx
expect(screen.getByText(/不要把自己的观点写在这里/)).toBeInTheDocument();
expect(screen.getByText(/不把“好公司”等同于“有安全边际”/)).toBeInTheDocument();
expect(screen.getByText(/不是补录或最后编辑日期/)).toBeInTheDocument();
expect(screen.getByText(/不要复制整份公司研究/)).toBeInTheDocument();
```

In the finalized-decision test, also assert that one guidance sentence remains visible while editing controls are disabled.

- [ ] **Step 2: Run the decision test and verify RED**

Run: `npm test -- src/app/investment/decisions/components/DecisionEditor.test.tsx`

Expected: FAIL because the persistent guidance does not exist.

- [ ] **Step 3: Add approved guidance to every visible decision field**

Import `FieldGuidance` and pass the exact section 5 wording through `Form.Item.extra` for `research_snapshot_id`, `market_expectation`, `personal_divergence`, `valuation_conclusion`, `valuation_assumptions`, `safety_margin`, `investment_plan`, `error_signals`, `error_response`, `do_not_list`, `decision_type`, `decision_date`, and `final_reason`. Remove placeholder text that duplicates the persistent guidance; keep only short interaction placeholders such as the snapshot selector prompt.

- [ ] **Step 4: Run the decision test and verify GREEN**

Run: `npm test -- src/app/investment/decisions/components/DecisionEditor.test.tsx`

Expected: all DecisionEditor tests pass.

### Task 4: Regression and visual verification

**Files:**
- Verify only; no planned production changes.

- [ ] **Step 1: Run focused editor tests together**

Run: `npm test -- src/app/investment/components/FieldGuidance.test.tsx src/app/investment/research/components/ResearchEditor.test.tsx src/app/investment/decisions/components/DecisionEditor.test.tsx`

Expected: all focused tests pass with no React errors.

- [ ] **Step 2: Run type and lint checks for changed files**

Run: `npm run typecheck`

Expected: exit code 0.

Run: `npx eslint src/app/investment/components/FieldGuidance.tsx src/app/investment/components/FieldGuidance.test.tsx src/app/investment/research/components/ResearchEditor.tsx src/app/investment/research/components/ResearchEditor.test.tsx src/app/investment/research/components/ResearchChecklist.tsx src/app/investment/decisions/components/DecisionEditor.tsx src/app/investment/decisions/components/DecisionEditor.test.tsx`

Expected: exit code 0.

- [ ] **Step 3: Run the complete test suite**

Run: `npm test`

Expected: all test files pass.

- [ ] **Step 4: Inspect the rendered pages at desktop and narrow widths**

Open company research and an investment decision in the running app. Confirm the approved guidance remains visible after entering text, wraps without clipping, is visually subordinate to labels and input, and remains visible on finalized decisions. Record any inability to inspect authenticated real data rather than claiming visual verification without evidence.
