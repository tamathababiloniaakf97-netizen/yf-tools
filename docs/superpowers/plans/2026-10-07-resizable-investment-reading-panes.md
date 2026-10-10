# Resizable Investment Reading Panes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add independently remembered, accessible draggable column widths to the investment journal and methodology reading pages.

**Architecture:** A focused client component owns the split width, pointer/keyboard interaction, boundary clamping, and localStorage persistence. Both pages pass their own storage key and default width into the same component; CSS keeps the existing mobile stacked layouts and hides the separator below the page breakpoint.

**Tech Stack:** Next.js 16 client components, React 19, TypeScript, CSS Grid, Pointer Events, localStorage, Vitest, Testing Library.

---

### Task 1: Shared resizable split pane

**Files:**
- Create: `src/components/ResizableSplitPane.tsx`
- Create: `src/components/ResizableSplitPane.test.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write the failing component tests**

Add tests that render `ResizableSplitPane` with `storageKey="journal-width"`, `defaultLeftWidth={420}`, `minLeftWidth={280}`, and `maxLeftWidth={600}`. Assert that the initial grid variable is `420px`; pointer movement clamps to `280px` and `600px`; pointer release writes only `journal-width`; a stored valid value is restored; malformed stored data falls back to `420px`; arrow keys change by 16px; `Home`, `End`, and double-click select minimum, maximum, and default values; and the separator exposes `role="separator"`, `aria-orientation="vertical"`, `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`.

- [ ] **Step 2: Run the tests and confirm RED**

Run: `npx vitest run src/components/ResizableSplitPane.test.tsx`

Expected: FAIL because `@/components/ResizableSplitPane` does not exist.

- [ ] **Step 3: Implement the minimal shared component**

Create this public interface:

```tsx
type ResizableSplitPaneProps = {
  children: [React.ReactNode, React.ReactNode];
  className?: string;
  storageKey: string;
  defaultLeftWidth: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
};
```

Render a root with `--split-left-width`, the left child, a focusable separator, and the right child. Read localStorage after mount inside `try/catch`; clamp every restored or interactive value. During `pointerdown`, remember the pointer id and starting coordinate; handle `pointermove` while active; persist on `pointerup` or `pointercancel`. Handle `ArrowLeft`, `ArrowRight`, `Home`, and `End`, persist keyboard results immediately, and reset to the default width on double-click.

Add shared CSS:

```css
.resizable-split-pane { grid-template-columns: minmax(0,var(--split-left-width)) 9px minmax(0,1fr); }
.resizable-split-divider { cursor: col-resize; position: relative; touch-action: none; outline: none; }
.resizable-split-divider::after { content:""; position:absolute; inset:0 4px; background:#e4e9ec; transition:background .15s; }
.resizable-split-divider:hover::after,
.resizable-split-divider:focus-visible::after,
.resizable-split-divider.is-dragging::after { background:#6c9e94; }
body.is-resizing-split { user-select:none; cursor:col-resize; }
```

- [ ] **Step 4: Run the component tests and confirm GREEN**

Run: `npx vitest run src/components/ResizableSplitPane.test.tsx`

Expected: all component tests PASS with no unhandled event errors.

### Task 2: Integrate both investment pages

**Files:**
- Modify: `src/app/investment/reviews/page.tsx`
- Modify: `src/app/investment/methodology/page.tsx`
- Modify: `src/app/investment/reviews/page.test.tsx`
- Modify: `src/app/investment/methodology/page.test.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write failing page integration tests**

For the journal page, assert one separator exists and the root uses storage key `life-os:investment-journal:left-width`. For methodology, assert the corresponding key is `life-os:investment-methodology:left-width`. Ensure each page still renders its list and selected detail.

- [ ] **Step 2: Run the page tests and confirm RED**

Run: `npx vitest run src/app/investment/reviews/page.test.tsx src/app/investment/methodology/page.test.tsx`

Expected: FAIL because neither page renders the shared separator.

- [ ] **Step 3: Replace fixed shells with the shared component**

Import `ResizableSplitPane`, replace the journal shell's opening `<div className="investment-journal-shell">` with:

```tsx
<ResizableSplitPane
  className="investment-journal-shell"
  storageKey="life-os:investment-journal:left-width"
  defaultLeftWidth={400}
>
```

Keep the existing `aside` and `main` children unchanged and replace that shell's closing `</div>` with `</ResizableSplitPane>`. Import the same component on the methodology page and replace its shell's opening `<div className="methodology-shell">` with:

```tsx
<ResizableSplitPane
  className="methodology-shell"
  storageKey="life-os:investment-methodology:left-width"
  defaultLeftWidth={340}
>
```

Keep its existing `aside` and `main` children unchanged and replace the shell's closing `</div>` with `</ResizableSplitPane>`.

Remove fixed `grid-template-columns` declarations from both desktop shells. At the existing `980px` journal and `900px` methodology breakpoints, set `grid-template-columns:1fr`, hide `.resizable-split-divider`, and keep the current vertical borders and heights.

- [ ] **Step 4: Run the integration tests and confirm GREEN**

Run: `npx vitest run src/components/ResizableSplitPane.test.tsx src/app/investment/reviews/page.test.tsx src/app/investment/methodology/page.test.tsx`

Expected: all related tests PASS.

### Task 3: Static and browser verification

**Files:**
- Verify: `src/components/ResizableSplitPane.tsx`
- Verify: `src/app/investment/reviews/page.tsx`
- Verify: `src/app/investment/methodology/page.tsx`
- Verify: `src/app/globals.css`

- [ ] **Step 1: Run static verification**

Run: `npx eslint src/components/ResizableSplitPane.tsx src/components/ResizableSplitPane.test.tsx src/app/investment/reviews/page.tsx src/app/investment/reviews/page.test.tsx src/app/investment/methodology/page.tsx src/app/investment/methodology/page.test.tsx`

Expected: exit code 0.

Run: `npx tsc --noEmit`

Expected: exit code 0, or report any pre-existing unrelated diagnostics separately.

- [ ] **Step 2: Verify journal behavior in the browser**

Open `/investment/reviews`, drag the divider, refresh, and confirm its width persists. Confirm the list and detail remain usable at both width limits and double-click restores 400px.

- [ ] **Step 3: Verify methodology behavior and independent persistence**

Open `/investment/methodology`, choose a visibly different width, refresh, and confirm it persists without changing the journal width. Confirm double-click restores 340px.

- [ ] **Step 4: Verify responsive behavior**

At a viewport below each existing breakpoint, confirm the separator is hidden and both pages use the existing stacked layout.

- [ ] **Step 5: Review the final diff**

Run: `git diff --check` and `git diff -- src/components/ResizableSplitPane.tsx src/components/ResizableSplitPane.test.tsx src/app/investment/reviews/page.tsx src/app/investment/reviews/page.test.tsx src/app/investment/methodology/page.tsx src/app/investment/methodology/page.test.tsx src/app/globals.css`.

Expected: no whitespace errors and no unrelated changes in the listed files.
