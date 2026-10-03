import { describe, expect, it } from 'vitest';
import { buildMonthlyChecklist, completedManualChecks } from './monthly-checklist';

describe('monthly finance checklist', () => {
  it('combines manual confirmations with the real month-close status', () => {
    const checks = { business:true, household:true, repayments:false, capital:false, cash_balances:true, liability_balances:false, investment_ready:true };
    const list = buildMonthlyChecklist(checks, true);
    expect(completedManualChecks(checks)).toBe(4);
    expect(list.filter(item=>item.completed)).toHaveLength(5);
    expect(list.at(-1)).toMatchObject({ key:'month_closed', completed:true, manual:false });
  });

  it('never treats a manually supplied month_closed key as a completed close', () => {
    const list = buildMonthlyChecklist({ month_closed:true } as never, false);
    expect(list.at(-1)?.completed).toBe(false);
  });
});
