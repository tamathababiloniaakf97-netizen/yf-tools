# Lightweight Journal Formatting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared, safe, lightweight formatting editor and renderer to the four journal and methodology pages without changing persistence.

**Architecture:** Keep content as plain strings. A pure formatting module owns marker transforms and parsing, a controlled editor owns textarea selection behavior, and a renderer converts only the supported whitelist into React elements without HTML injection. Existing pages replace only their long-form inputs and readers.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 6, Vitest, Testing Library.

---

### Task 1: Pure lightweight-markup behavior

**Files:**
- Create: `src/lib/lightweight-formatting.ts`
- Test: `src/lib/lightweight-formatting.test.ts`

- [ ] Write failing tests for inline bold/emphasis tokenization, headings, unordered lists, quotes, one-return line breaks, blank-line paragraphs, malformed markers, literal HTML, and marker removal for excerpts.
- [ ] Run `npx vitest run src/lib/lightweight-formatting.test.ts --maxWorkers=1`; expect failure because the module is absent.
- [ ] Implement typed block and inline token parsers plus pure selection transforms for `**bold**`, `==emphasis==`, `## heading`, `- list`, and `> quote`. Treat every newline as a visible break and blank lines as paragraph boundaries. Never parse HTML.
- [ ] Run the same test command; expect all tests to pass.
- [ ] Commit the pure module and tests.

### Task 2: Shared controlled editor and safe reader

**Files:**
- Create: `src/components/LightweightTextEditor.tsx`
- Create: `src/components/LightweightTextEditor.test.tsx`
- Create: `src/components/LightweightFormattedText.tsx`
- Create: `src/components/LightweightFormattedText.test.tsx`
- Modify: `src/app/globals.css`

- [ ] Write failing component tests proving each toolbar button changes the controlled string, selected text is wrapped, line prefixes toggle, focus is restored, visible newlines render, fixed emphasis uses a semantic CSS class, and `<script>` is rendered as text rather than executed.
- [ ] Run `npx vitest run src/components/LightweightTextEditor.test.tsx src/components/LightweightFormattedText.test.tsx --maxWorkers=1`; expect failure because the components are absent.
- [ ] Implement `LightweightTextEditor` with five compact buttons, Ant Design `Input.TextArea`, `value`, `onChange`, placeholder, and autosize props. Use the pure transforms and restore selection in `requestAnimationFrame`.
- [ ] Implement `LightweightFormattedText` by mapping parsed blocks and inline tokens to React nodes only; do not use `dangerouslySetInnerHTML`.
- [ ] Add scoped styles for the toolbar, editor, paragraphs, line breaks, heading, list, quote, and one fixed emphasis color.
- [ ] Run the component tests; expect all tests to pass.
- [ ] Commit the shared components, styles, and tests.

### Task 3: Investment journal and investment methodology integration

**Files:**
- Modify: `src/app/investment/reviews/page.tsx`
- Modify: `src/app/investment/reviews/page.test.tsx`
- Modify: `src/app/investment/methodology/page.tsx`
- Modify: `src/app/investment/methodology/page.test.tsx`

- [ ] Extend the page tests to require the formatting toolbar in create/edit forms and formatted content in each reading pane.
- [ ] Run both page test files; expect the new assertions to fail.
- [ ] Replace only `content` textareas with `LightweightTextEditor`, and replace only full-body readers with `LightweightFormattedText`. Strip supported markers in list excerpts while leaving search and saved values unchanged.
- [ ] Run both page test files; expect all tests to pass.
- [ ] Commit the two investment-page integrations and tests.

### Task 4: Cognition journal and cognition methodology integration

**Files:**
- Modify: `src/app/cognition/journals/page.tsx`
- Modify: `src/app/cognition/journals/page.test.tsx`
- Modify: `src/app/cognition/methods/page.tsx`
- Modify: `src/app/cognition/methods/page.test.tsx`

- [ ] Extend tests to require the formatting editor for cognition journal content and all five long-form cognition-method fields, plus safe formatted reading output.
- [ ] Run both cognition page tests; expect the new assertions to fail.
- [ ] Replace the selected inputs and readers with the shared components. Keep titles, categories, status, tags, save payloads, API calls, and validation unchanged. Strip supported markers only from compact list excerpts.
- [ ] Run both cognition page tests; expect all tests to pass.
- [ ] Commit the cognition-page integrations and tests.

### Task 5: Full verification

**Files:**
- Modify only files needed to correct failures caused by Tasks 1–4.

- [ ] Run the focused formatting and four page test files together; expect all tests to pass.
- [ ] Run `npm run typecheck`; expect exit code 0.
- [ ] Run `npm run lint`; expect exit code 0.
- [ ] Run `npm test`; expect exit code 0.
- [ ] Run `npm run build`; expect exit code 0.
- [ ] Run `git diff --check`; expect no whitespace errors.
- [ ] Commit any verification fixes, then review the final diff for accidental database, API, or unrelated page changes.
