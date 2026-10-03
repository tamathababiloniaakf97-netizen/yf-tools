import { beforeEach, describe, expect, it, vi } from 'vitest';

let user: { id: string } | null = { id: 'u1' };
const from = vi.fn();
const rpc = vi.fn();
vi.mock('@/lib/supabase/server', () => ({ createServerSideClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) }, from, rpc }) }));

import { GET, POST } from './route';

const context = { params: Promise.resolve({ id: 'goal-1' }) };
const goal = { id: 'goal-1', user_id: 'u1', goal_type: 'project' };
const input = { occurred_at: '2026-10-02', progress_note: 'MVP 已完成', current_milestone: '资料完善', next_action: '上传资料', next_action_due_at: '2026-10-10' };

describe('/api/goals/[id]/progress', () => {
  beforeEach(() => { user = { id: 'u1' }; from.mockReset(); rpc.mockReset(); });

  it('returns progress history newest first for the owned goal', async () => {
    const order = vi.fn(async () => ({ data: [{ id: 'p1', progress_note: '完成 MVP' }], error: null }));
    const eqUser = vi.fn(() => ({ order }));
    const eqGoal = vi.fn(() => ({ eq: eqUser }));
    from.mockReturnValue({ select: () => ({ eq: eqGoal }) });
    const response = await GET(new Request('http://localhost'), context);
    expect(response.status).toBe(200);
    expect(eqGoal).toHaveBeenCalledWith('goal_id', 'goal-1');
    expect(eqUser).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('validates against the goal type and saves progress atomically', async () => {
    from.mockReturnValue({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: goal, error: null }) }) }) }) });
    rpc.mockResolvedValue({ data: 'progress-1', error: null });
    const response = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify(input) }), context);
    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledWith('save_goal_progress', { p_goal_id: 'goal-1', p_update: expect.objectContaining({ progress_note: 'MVP 已完成', current_milestone: '资料完善', next_action_due_at: '2026-10-10' }) });
  });

  it('rejects a project update without a milestone', async () => {
    from.mockReturnValue({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: goal, error: null }) }) }) }) });
    const response = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ ...input, current_milestone: '' }) }), context);
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});
