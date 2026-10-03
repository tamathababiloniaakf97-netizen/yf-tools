import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const getUser = vi.fn();
const rpc = vi.fn();
const from = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: async () => ({ auth: { getUser }, rpc, from }),
}));

describe('life project collection route', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects unauthenticated access', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('initializes defaults before listing projects', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    rpc.mockResolvedValue({ error: null });
    const order = vi.fn().mockResolvedValue({ data: [{ id: 'p1' }], error: null });
    from.mockReturnValue({ select: () => ({ eq: () => ({ order }) }) });
    const response = await GET();
    expect(rpc).toHaveBeenCalledWith('initialize_life_reinforcement_projects');
    expect(await response.json()).toEqual([{ id: 'p1' }]);
  });

  it('rejects a project without a name', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const response = await POST(new Request('http://localhost/api/life/projects', {
      method: 'POST', body: JSON.stringify({ name: ' ' }),
    }));
    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });
});
