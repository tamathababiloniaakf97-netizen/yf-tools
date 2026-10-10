import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { normalizeCycleProfilePatch } from '@/lib/investment/cycles';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const validation=normalizeCycleProfilePatch(await request.json() as Record<string,unknown>);
  if(!validation.ok)return NextResponse.json({error:validation.errors.join('；')},{status:400});
  if('name' in validation.value&&!validation.value.name)return NextResponse.json({error:'名称不能为空'},{status:400});
  const changes: Record<string, unknown> = { ...validation.value, updated_at: new Date().toISOString() };
  if ('ticker_id' in validation.value) {
    const tickerId = validation.value.ticker_id as string|null;
    if (tickerId) {
      const owned = await supabase.from('tickers').select('id').eq('id', tickerId).eq('user_id', user.id).maybeSingle();
      if (owned.error) return NextResponse.json({ error: owned.error.message }, { status: 500 });
      if (!owned.data) return NextResponse.json({ error: '关联标的不存在' }, { status: 400 });
    }
  }
  const result = await supabase.from('market_cycle_profiles').update(changes).eq('id', id).eq('user_id', user.id).select('*,ticker:tickers!market_cycle_profiles_ticker_id_fkey(id,name,code,currency)').single();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json(result.data);
}
