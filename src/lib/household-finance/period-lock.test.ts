import { describe, expect, it } from 'vitest';
import { assertHouseholdPeriodEditable } from './period-lock';

describe('household period lock', () => {
  it('rejects closed months and permits reopened or absent months', () => {
    const closures = [
      { period_month: '2026-08-01', status: 'reopened' as const },
      { period_month: '2026-09-01', status: 'closed' as const },
    ];
    expect(assertHouseholdPeriodEditable('2026-08-12', closures)).toEqual({ ok: true });
    expect(assertHouseholdPeriodEditable('2026-07-12', closures)).toEqual({ ok: true });
    expect(assertHouseholdPeriodEditable('2026-09-12', closures)).toEqual({ ok: false, error: '该月份已结账，请先重新打开月份' });
  });
});
