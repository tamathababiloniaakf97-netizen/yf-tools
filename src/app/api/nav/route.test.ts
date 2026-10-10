import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  rows: [{ id: 'n1', user_id: 'user-1', date: '2026-10-10', total_assets: '10000.25', cash_balance: '5000', market_value: '5000.25', external_flow: '0', nav: '1.0025', shares: '9975', valuation_status: 'complete', price_errors: [], benchmark_price: '600', benchmark_nav: '1', created_at: '', updated_at: '' }],
  eq: vi.fn(), order: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createServerSideClient: vi.fn(async () => ({
  auth: { getUser: vi.fn(async () => ({ data: { user: state.user } })) },
  from: vi.fn(() => ({ select: vi.fn(() => ({
    eq: state.eq.mockImplementation(() => ({ order: state.order.mockResolvedValue({ data: state.rows, error: null }) })),
  })) })),
})) }));

import { GET } from './route';

describe('portfolio NAV history route', () => {
  beforeEach(() => { state.user = { id: 'user-1' }; state.eq.mockClear(); state.order.mockClear(); });

  it('requires authentication', async () => {
    state.user = null;
    expect((await GET()).status).toBe(401);
  });

  it('returns only the user history in ascending order with numeric values', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(state.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(state.order).toHaveBeenCalledWith('date', { ascending: true });
    await expect(response.json()).resolves.toMatchObject([{ total_assets: 10000.25, nav: 1.0025, benchmark_nav: 1 }]);
  });
});
