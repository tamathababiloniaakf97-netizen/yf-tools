# Portfolio Performance Layout Design

## Goal

Move the existing historical-performance card directly below the five account-summary cards and above the holdings card, so account-level information is grouped before position-level details.

## Approved layout

The cost page order will be:

1. Account summary cards
2. Historical performance
3. Holdings
4. Pending orders
5. Transactions

## Scope

Only the render order in `src/app/cost/page.tsx` changes. The historical-performance card keeps its existing title, notice, styling, and margins. No calculation, API, database, component, or responsive-layout behavior changes.

## Verification

Run TypeScript checking and the production build, and inspect the diff to confirm it contains only the intended block move.
