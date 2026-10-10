import { describe, expect, it } from 'vitest';
import { entryFlow, formatFlowAmount } from './amount-presentation';

describe('household finance amount presentation', () => {
  it('classifies every ledger kind by cash direction', () => {
    expect(entryFlow('business_income')).toBe('inflow');
    expect(entryFlow('asset_sale')).toBe('inflow');
    expect(entryFlow('loan_drawdown')).toBe('inflow');
    expect(entryFlow('business_expense')).toBe('outflow');
    expect(entryFlow('business_refund')).toBe('outflow');
    expect(entryFlow('credit_card_payment')).toBe('outflow');
    expect(entryFlow('internal_transfer')).toBe('neutral');
  });

  it('uses an explicit sign while keeping the stored amount positive', () => {
    expect(formatFlowAmount(234000, 'inflow')).toBe('+¥234,000.00');
    expect(formatFlowAmount(2300, 'outflow')).toBe('−¥2,300.00');
    expect(formatFlowAmount(0, 'neutral')).toBe('¥0.00');
    expect(formatFlowAmount(25, 'inflow', 'USD')).toBe('+$25.00');
  });
});
