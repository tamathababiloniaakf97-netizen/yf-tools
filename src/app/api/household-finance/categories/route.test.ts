import { beforeEach, describe, expect, it, vi } from 'vitest';

let user: { id:string } | null = { id:'u1' };
const from = vi.fn();
vi.mock('@/lib/supabase/server', () => ({ createServerSideClient: async () => ({ auth:{ getUser:async()=>({data:{user}}) }, from }) }));

import { PATCH, POST } from './route';
const request = (method:string, body:unknown) => new Request('http://localhost', { method, body:JSON.stringify(body) });

describe('/api/household-finance/categories', () => {
  beforeEach(() => { user={id:'u1'}; from.mockReset(); });

  it('trims and creates a category for one item type', async () => {
    const single=vi.fn(async()=>({data:{id:'c1',name:'房产'},error:null}));
    const select=vi.fn(()=>({single}));
    const insert=vi.fn(()=>({select}));
    from.mockReturnValue({insert});
    const response=await POST(request('POST',{item_type:'asset',name:'  房产  '}));
    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledWith({user_id:'u1',item_type:'asset',name:'房产',is_active:true});
  });

  it('renames a category and synchronizes legacy item text', async () => {
    const categoryUpdate=vi.fn(()=>({eq:()=>({eq:()=>({select:()=>({maybeSingle:async()=>({data:{id:'c1',item_type:'asset',name:'不动产'},error:null})})})})}));
    const itemUpdate=vi.fn(()=>({eq:()=>({eq:async()=>({error:null})})}));
    from.mockImplementation((table:string)=>table==='household_item_categories'?{update:categoryUpdate}:{update:itemUpdate});
    const response=await PATCH(request('PATCH',{id:'c1',name:' 不动产 '}));
    expect(response.status).toBe(200);
    expect(itemUpdate).toHaveBeenCalledWith({category:'不动产'});
  });
});
