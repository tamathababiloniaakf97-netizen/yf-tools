import { beforeEach, describe, expect, it, vi } from 'vitest';

let user: { id: string } | null = { id: 'u1' };
const from = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) }, from }),
}));

import { GET, POST } from './route';

describe('/api/household-finance/entry-reviews', () => {
  beforeEach(() => {
    user = { id: 'u1' };
    from.mockReset();
  });

  it('rejects unauthenticated reads', async () => {
    user = null;
    expect((await GET()).status).toBe(401);
  });

  it('returns the configured start month and own reviews', async () => {
    from.mockImplementation((table: string) => ({select:()=>({eq:()=>table==='household_finance_settings'
      ? {maybeSingle:async()=>({data:{entry_review_started_month:'2026-10-01'},error:null})}
      : table==='household_period_closures'
        ? {eq:async()=>({data:[{period_month:'2026-10-01',status:'closed'}],error:null})}
        : Promise.resolve({data:[{period_month:'2026-10-01',reviewed_at:'2026-10-29T10:00:00Z'}],error:null})})}));

    expect(await (await GET()).json()).toEqual({
      enabled: true,
      startedMonth: '2026-10-01',
      reviews: [{ period_month: '2026-10-01', reviewed_at: '2026-10-29T10:00:00Z' }],
      closedMonths: ['2026-10-01'],
    });
  });

  it('rejects an invalid or pre-start month', async () => {
    from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { entry_review_started_month: '2026-10-01' }, error: null }) }) }) });

    expect((await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ period_month: 'October' }) }))).status).toBe(400);
    expect((await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ period_month: '2026-09-01' }) }))).status).toBe(400);
  });

  it('upserts the complete validated manual checklist for the authenticated user', async () => {
    const upsert = vi.fn(() => ({ select: () => ({ single: async () => ({ data: { period_month: '2026-10-01', reviewed_at: '2026-10-29T10:00:00Z', checks:{ business:true } }, error: null }) }) }));
    from.mockImplementation((table: string) => table === 'household_finance_settings'
      ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { entry_review_started_month: '2026-10-01' }, error: null }) }) }) }
      : { upsert });

    const response = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ period_month: '2026-10-01', checks:{ business:true }, user_id: 'attacker' }) }));

    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      { user_id: 'u1', period_month: '2026-10-01', checks:{ business:true }, reviewed_at:expect.any(String) },
      { onConflict: 'user_id,period_month' },
    );
  });

  it('rejects unknown or non-boolean checklist values', async () => {
    from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { entry_review_started_month: '2026-10-01' }, error: null }) }) }) });
    expect((await POST(new Request('http://localhost', { method:'POST', body:JSON.stringify({ period_month:'2026-10-01', checks:{ month_closed:true } }) }))).status).toBe(400);
    expect((await POST(new Request('http://localhost', { method:'POST', body:JSON.stringify({ period_month:'2026-10-01', checks:{ business:'yes' } }) }))).status).toBe(400);
  });
});
