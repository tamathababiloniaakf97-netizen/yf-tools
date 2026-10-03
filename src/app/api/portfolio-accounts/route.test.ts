import { beforeEach, describe, expect, it, vi } from 'vitest';

let user: { id: string } | null = { id: 'u1' };
const from = vi.fn();
const rpc = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) }, from, rpc }),
}));

import { GET, PUT } from './route';

const account = {
  name: '我的账户', account_type: 'brokerage', login_url: '', login_account: 'user-1', password_hint: '常用密码提示', two_factor_hint: '', location_note: '', broker_reported_total_usd: null,
  cash_balances: [{ currency: 'USD', amount: 1000, usd_rate: 1 }], positions: [{ ticker_id: 'ticker-1', quantity: 0.1 }], sort_order: 0,
};

describe('/api/portfolio-accounts', () => {
  beforeEach(() => { user = { id: 'u1' }; from.mockReset(); rpc.mockReset(); });

  it('rejects unauthenticated access', async () => {
    user = null;
    expect((await GET()).status).toBe(401);
    expect((await PUT(new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ accounts: [] }) }))).status).toBe(401);
  });

  it('returns only the authenticated user account locations in display order', async () => {
    const order = vi.fn(async () => ({ data: [account], error: null }));
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    from.mockReturnValue({ select });

    const response = await GET();
    expect(response.status).toBe(200);
    expect(eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(await response.json()).toEqual({ accounts: [account] });
  });

  it('validates and atomically replaces the snapshot without trusting a supplied total', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    const response = await PUT(new Request('http://localhost', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accounts: [{ ...account, calculated_total_usd: 999999 }] }) }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('save_portfolio_account_locations', { p_accounts: [expect.not.objectContaining({ calculated_total_usd: expect.anything() })] });
  });

  it('rejects invalid cash rates before writing', async () => {
    const response = await PUT(new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ accounts: [{ ...account, cash_balances: [{ currency: 'HKD', amount: 10, usd_rate: 0 }] }] }) }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});
