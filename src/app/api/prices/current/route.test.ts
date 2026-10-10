import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ user: { id: 'user-1' } as { id: string } | null, ticker: { id: 'ticker-1', code: 'BTC', type: 'crypto', currency: 'USD' } as Record<string, unknown> | null }));
const fetchMarketPrice = vi.hoisted(() => vi.fn(async () => ({ ok: true, price: 82706.1, source: 'CoinLore', kind: 'realtime' })));

vi.mock('@/lib/market-data/quotes', () => ({ fetchMarketPrice }));
vi.mock('@/lib/supabase/server', () => ({ createServerSideClient: vi.fn(async () => ({
  auth: { getUser: vi.fn(async () => ({ data: { user: state.user } })) },
  from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: state.ticker, error: null })) })) })) })) })),
})) }));

import { GET } from './route';

describe('current price route', () => {
  beforeEach(() => { state.user = { id: 'user-1' }; state.ticker = { id: 'ticker-1', code: 'BTC', type: 'crypto', currency: 'USD' }; fetchMarketPrice.mockClear(); });

  it('requires authentication', async () => {
    state.user = null;
    expect((await GET(new Request('http://localhost/api/prices/current?ticker_id=ticker-1'))).status).toBe(401);
  });

  it('reuses the holdings quote fallback and returns its source', async () => {
    const response = await GET(new Request('http://localhost/api/prices/current?ticker_id=ticker-1'));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ price: 82706.1, currency: 'USD', source: 'CoinLore' });
    expect(fetchMarketPrice).toHaveBeenCalledWith({ code: 'BTC', type: 'crypto' });
  });
});
