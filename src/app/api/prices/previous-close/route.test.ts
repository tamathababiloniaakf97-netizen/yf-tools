import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ user: { id: 'user-1' } as { id: string } | null, ticker: { id: 'ticker-1', code: '700', type: 'stock_hk', currency: 'HKD' } as Record<string, unknown> | null }));
const fetchPreviousClose = vi.hoisted(() => vi.fn(async () => ({ ok: true, price: 420, source: '腾讯行情', observedOn: null })));

vi.mock('@/lib/market-data/quotes', () => ({ fetchPreviousClose }));
vi.mock('@/lib/supabase/server', () => ({ createServerSideClient: vi.fn(async () => ({
  auth: { getUser: vi.fn(async () => ({ data: { user: state.user } })) },
  from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: state.ticker, error: null })) })) })) })) })),
})) }));

import { GET } from './route';

describe('previous close route', () => {
  beforeEach(() => { state.user = { id: 'user-1' }; state.ticker = { id: 'ticker-1', code: '700', type: 'stock_hk', currency: 'HKD' }; fetchPreviousClose.mockClear(); });

  it('requires authentication', async () => {
    state.user = null;
    expect((await GET(new Request('http://localhost/api/prices/previous-close?ticker_id=ticker-1'))).status).toBe(401);
  });

  it('returns the owned ticker previous close with its currency', async () => {
    const response = await GET(new Request('http://localhost/api/prices/previous-close?ticker_id=ticker-1'));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ price: 420, currency: 'HKD', source: '腾讯行情' });
    expect(fetchPreviousClose).toHaveBeenCalledWith({ code: '700', type: 'stock_hk' });
  });
});
