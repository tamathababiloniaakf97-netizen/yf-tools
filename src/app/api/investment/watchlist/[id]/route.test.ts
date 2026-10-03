import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  filters: [] as Array<[string, unknown]>,
  updated: null as Record<string, unknown> | null,
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: state.user } })) },
    from: vi.fn(() => {
      const chain = {
        select: vi.fn(() => chain),
        update: vi.fn((value: Record<string, unknown>) => { state.updated = value; return chain; }),
        eq: vi.fn((key: string, value: unknown) => { state.filters.push([key, value]); return chain; }),
        maybeSingle: vi.fn(async () => state.updated
          ? { data: { id: 'watch-1', ...state.updated }, error: null }
          : { data: { id: 'watch-1', user_id: 'user-1', ticker_id: null, asset_name: '腾讯', reason: '', entry_condition: '', status: 'watching', next_check_at: null, notes: '', source_type: 'manual', source_ref: null, review_status: 'approved' }, error: null }),
      };
      return chain;
    }),
  })),
}));

import { PATCH } from './route';

describe('PATCH /api/investment/watchlist/[id]', () => {
  beforeEach(() => {
    state.user = { id: 'user-1' };
    state.filters = [];
    state.updated = null;
  });

  it('updates only the authenticated user record and refreshes its activity time', async () => {
    const response = await PATCH(new Request('http://localhost/api/investment/watchlist/watch-1', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ next_check_at: '2026-10-08' }),
    }), { params: Promise.resolve({ id: 'watch-1' }) });

    expect(response.status).toBe(200);
    expect(state.filters).toContainEqual(['id', 'watch-1']);
    expect(state.filters).toContainEqual(['user_id', 'user-1']);
    expect(state.updated).toMatchObject({ asset_name: '腾讯', next_check_at: '2026-10-08' });
    expect(state.updated?.updated_at).toEqual(expect.any(String));
  });
});
