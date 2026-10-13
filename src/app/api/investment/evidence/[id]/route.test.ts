import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  filters: [] as Array<[string, unknown]>,
  updated: null as Record<string, unknown> | null,
  operation: '' as 'update' | 'delete' | '',
  result: { data: { id: 'evidence-1' }, error: null } as { data: Record<string, unknown> | null; error: { message: string } | null },
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: state.user } })) },
    from: vi.fn(() => {
      const chain = {
        update: vi.fn((value: Record<string, unknown>) => { state.operation = 'update'; state.updated = value; return chain; }),
        delete: vi.fn(() => { state.operation = 'delete'; return chain; }),
        eq: vi.fn((key: string, value: unknown) => { state.filters.push([key, value]); return chain; }),
        select: vi.fn(() => chain),
        maybeSingle: vi.fn(async () => state.result),
      };
      return chain;
    }),
  })),
}));

import { DELETE, PATCH } from './route';

const context = { params: Promise.resolve({ id: 'evidence-1' }) };
const validInput = { asset_name: '腾讯', content: '续约率稳定', impact: 'support' as const, source_type: 'manual' as const };

describe('/api/investment/evidence/[id]', () => {
  beforeEach(() => {
    state.user = { id: 'user-1' };
    state.filters = [];
    state.updated = null;
    state.operation = '';
    state.result = { data: { id: 'evidence-1' }, error: null };
  });

  it('PATCH updates only evidence owned by the current user', async () => {
    const response = await PATCH(new Request('http://localhost/api/investment/evidence/evidence-1', { method: 'PATCH', body: JSON.stringify(validInput) }), context);

    expect(response.status).toBe(200);
    expect(state.filters).toEqual(expect.arrayContaining([['id', 'evidence-1'], ['user_id', 'user-1']]));
    expect(state.updated).toMatchObject({ content: '续约率稳定' });
  });

  it('returns 404 when the evidence cannot be found', async () => {
    state.result = { data: null, error: null };
    const response = await PATCH(new Request('http://localhost/api/investment/evidence/evidence-1', { method: 'PATCH', body: JSON.stringify(validInput) }), context);

    expect(response.status).toBe(404);
  });

  it('DELETE removes only evidence owned by the current user', async () => {
    const response = await DELETE(new Request('http://localhost/api/investment/evidence/evidence-1', { method: 'DELETE' }), context);

    expect(response.status).toBe(200);
    expect(state.operation).toBe('delete');
    expect(state.filters).toEqual(expect.arrayContaining([['id', 'evidence-1'], ['user_id', 'user-1']]));
  });
});
