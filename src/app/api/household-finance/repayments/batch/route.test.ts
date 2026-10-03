import { beforeEach, describe, expect, it, vi } from 'vitest';

let user: { id: string } | null = { id: 'u1' };
const rpc = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) }, rpc }),
}));

import { POST } from './route';

const loan = { repayment_type: 'mortgage_repayment', entry_date: '2026-09-30', liability_id: 'mortgage-1', principal: 5000, interest: 1000, currency: 'CNY' };
const card = { repayment_type: 'credit_card_payment', entry_date: '2026-09-30', liability_id: 'card-1', amount: 2000, currency: 'CNY' };
const request = (rows: unknown) => new Request('http://localhost', { method: 'POST', body: JSON.stringify({ rows }) });

describe('/api/household-finance/repayments/batch', () => {
  beforeEach(() => { user = { id: 'u1' }; rpc.mockReset(); });

  it('rejects unauthenticated requests', async () => {
    user = null;
    expect((await POST(request([loan]))).status).toBe(401);
  });

  it('reports the invalid row number', async () => {
    const response = await POST(request([loan, { ...card, amount: 0 }]));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: '第 2 行：信用卡还款金额必须大于 0' });
  });

  it('sends mortgage, credit-loan and card rows through one atomic RPC', async () => {
    rpc.mockResolvedValue({ data: ['g1', 'g2'], error: null });
    const response = await POST(request([loan, card]));
    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith('record_household_repayments_batch', { p_rows: [
      expect.objectContaining({ repayment_type: 'mortgage_repayment', principal_cny: 5000, interest_cny: 1000 }),
      expect.objectContaining({ repayment_type: 'credit_card_payment', amount_cny: 2000 }),
    ] });
  });
});
