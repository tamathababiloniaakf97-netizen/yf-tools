import { beforeEach, expect, it, vi } from 'vitest';
const { client, query } = vi.hoisted(() => {
  const query = { delete: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
  return { query, client: { auth: { getUser: vi.fn() }, from: vi.fn(() => query) } };
});
vi.mock('@/lib/supabase/server', () => ({ createServerSideClient: async () => client }));
import * as route from './route';
const remove = () => (route as unknown as { DELETE: typeof route.GET }).DELETE(new Request('http://localhost/api', { method: 'DELETE' }), { params: Promise.resolve({ id: 'p1', snapshotId: 's1' }) });
beforeEach(() => {
  vi.clearAllMocks();
  client.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
  query.delete.mockReturnValue(query); query.eq.mockReturnValue(query); query.select.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({ data: { id: 's1' }, error: null });
});
it('only deletes the authenticated user snapshot in the requested profile', async () => {
  expect((await remove()).status).toBe(200);
  expect(query.eq.mock.calls).toEqual([['id', 's1'], ['research_profile_id', 'p1'], ['user_id', 'u1']]);
});
it('rejects unauthenticated deletion', async () => {
  client.auth.getUser.mockResolvedValue({ data: { user: null } });
  expect((await remove()).status).toBe(401);
  expect(client.from).not.toHaveBeenCalled();
});
it('reports database reference protection as a conflict', async () => {
  query.maybeSingle.mockResolvedValue({ data: null, error: { code: '23503' } });
  const response = await remove();
  expect(response.status).toBe(409);
  expect((await response.json()).error).toContain('投资决策引用');
});
it('returns not found when no owned snapshot was deleted', async () => {
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  expect((await remove()).status).toBe(404);
});
