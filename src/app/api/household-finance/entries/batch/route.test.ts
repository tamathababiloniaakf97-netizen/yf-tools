import { beforeEach, describe, expect, it, vi } from 'vitest';

let user: { id: string } | null = { id: 'u1' };
const from = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) }, from }),
}));

import { POST } from './route';

const validEntry = { entry_date: '2026-09-30', kind: 'business_income', amount_cny: 100, currency: 'CNY', note: '' };
const request = (entries: unknown) => new Request('http://localhost', { method: 'POST', body: JSON.stringify({ entries }) });

describe('/api/household-finance/entries/batch', () => {
  beforeEach(() => { user = { id: 'u1' }; from.mockReset(); });

  it('rejects unauthenticated writes', async () => {
    user = null;
    expect((await POST(request([validEntry]))).status).toBe(401);
  });

  it('rejects empty and oversized batches', async () => {
    expect((await POST(request([]))).status).toBe(400);
    expect((await POST(request(Array.from({ length: 51 }, () => validEntry)))).status).toBe(400);
  });

  it('identifies the invalid row number', async () => {
    const response = await POST(request([validEntry, { ...validEntry, amount_cny: 0 }]));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: '第 2 行：金额必须大于 0' });
  });

  it('rejects the whole batch when any month is closed', async () => {
    from.mockReturnValue({ select: () => ({ eq: async () => ({ data: [{ period_month: '2026-09-01', status: 'closed' }], error: null }) }) });
    const response = await POST(request([validEntry, { ...validEntry, entry_date: '2026-10-02' }]));
    expect(response.status).toBe(409);
  });

  it('inserts all validated rows in one authenticated statement', async () => {
    const insert = vi.fn(() => ({ select: async () => ({ data: [{ id: '1' }, { id: '2' }], error: null }) }));
    from.mockImplementation((table: string) => table === 'household_period_closures'
      ? { select: () => ({ eq: async () => ({ data: [], error: null }) }) }
      : { insert });
    const response = await POST(request([validEntry, { ...validEntry, entry_date: '2026-10-02', kind: 'household_expense' }]));
    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledOnce();
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ user_id: 'u1', entry_date: '2026-09-30' }),
      expect.objectContaining({ user_id: 'u1', entry_date: '2026-10-02' }),
    ]);
  });
});
