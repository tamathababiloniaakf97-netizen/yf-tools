import { beforeEach, describe, expect, it, vi } from 'vitest';

let user: { id: string } | null = { id: 'u1' };
const from = vi.fn();
vi.mock('@/lib/supabase/server', () => ({ createServerSideClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) }, from }) }));

import { DELETE, PATCH } from './route';

const request = (method: string, body: unknown) => new Request('http://localhost', { method, body: JSON.stringify(body) });

describe('/api/household-finance/items mutations', () => {
  beforeEach(() => { user = { id: 'u1' }; from.mockReset(); });

  it('updates metadata with a category that belongs to the same item type', async () => {
    const categorySingle = vi.fn(async () => ({ data: { id:'cat-1', name:'房产', item_type:'asset', is_active:true }, error:null }));
    const maybeSingle = vi.fn(async () => ({ data: { id: 'a1' }, error: null }));
    const select = vi.fn(() => ({ maybeSingle }));
    const eqUser = vi.fn(() => ({ select }));
    const eqId = vi.fn(() => ({ eq: eqUser }));
    const update = vi.fn(() => ({ eq: eqId }));
    from.mockImplementation((table:string) => table === 'household_item_categories'
      ? { select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({ maybeSingle: categorySingle }) }) }) }) }
      : { update });
    const response = await PATCH(request('PATCH', { item_type:'asset', id:'a1', name:'住房', category_id:'cat-1', owner:'joint', note:'自住', value_cny:1 }));
    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ name:'住房', category_id:'cat-1', category:'房产', owner:'joint', note:'自住' });
  });

  it('rejects a category from a different item type', async () => {
    const maybeSingle = vi.fn(async () => ({ data:null, error:null }));
    from.mockReturnValue({ select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }) }) });
    const response = await PATCH(request('PATCH', { item_type:'asset', id:'a1', name:'住房', category_id:'liability-cat', owner:'joint' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error:'请选择有效的资产类别' });
  });

  it('returns a clear conflict when a liability has repayment history', async () => {
    const maybeSingle = vi.fn(async () => ({ data:null, error:{ code:'23503', message:'foreign key violation' } }));
    from.mockReturnValue({ delete: () => ({ eq: () => ({ eq: () => ({ select: () => ({ maybeSingle }) }) }) }) });
    const response = await DELETE(request('DELETE', { item_type:'liability', id:'l1' }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error:'该负债已有还款流水，不能删除；可以编辑名称或将余额更新为 0' });
  });
});
