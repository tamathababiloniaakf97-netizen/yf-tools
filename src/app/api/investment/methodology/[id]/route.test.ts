import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  filters: [] as Array<[string, unknown]>,
  updated: null as Record<string, unknown> | null,
  result: { data: { id: 'method-1' }, error: null } as { data: Record<string, unknown> | null; error: { message: string } | null },
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: state.user } })) },
    from: vi.fn(() => {
      const chain = {
        update: vi.fn((value: Record<string, unknown>) => { state.updated = value; return chain; }),
        eq: vi.fn((key: string, value: unknown) => { state.filters.push([key, value]); return chain; }),
        select: vi.fn(() => chain),
        maybeSingle: vi.fn(async () => state.result),
      };
      return chain;
    }),
  })),
}));

import { PATCH } from './route';

const context = { params: Promise.resolve({ id: 'method-1' }) };
const validInput = { title: '现金流优先', category: 'valuation', content: '估值时检查自由现金流。', source_type: 'manual' };

describe('PATCH /api/investment/methodology/[id]', () => {
  beforeEach(() => {
    state.user = { id: 'user-1' };
    state.filters = [];
    state.updated = null;
    state.result = { data: { id: 'method-1' }, error: null };
  });

  it('只更新当前用户拥有的方法并刷新更新时间', async () => {
    const response = await PATCH(new Request('http://localhost/api/investment/methodology/method-1', { method: 'PATCH', body: JSON.stringify(validInput) }), context);

    expect(response.status).toBe(200);
    expect(state.filters).toContainEqual(['id', 'method-1']);
    expect(state.filters).toContainEqual(['user_id', 'user-1']);
    expect(state.updated).toMatchObject({ title: '现金流优先', category: 'valuation', content: '估值时检查自由现金流。', updated_at: expect.any(String) });
  });

  it('拒绝空标题', async () => {
    const response = await PATCH(new Request('http://localhost/api/investment/methodology/method-1', { method: 'PATCH', body: JSON.stringify({ ...validInput, title: ' ' }) }), context);

    expect(response.status).toBe(400);
    expect(state.updated).toBeNull();
  });

  it('记录不存在或不属于当前用户时返回 404', async () => {
    state.result = { data: null, error: null };
    const response = await PATCH(new Request('http://localhost/api/investment/methodology/method-1', { method: 'PATCH', body: JSON.stringify(validInput) }), context);

    expect(response.status).toBe(404);
  });
});
