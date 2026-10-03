import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validateWatchlistInput } from '@/lib/investment/records';
import type { WatchlistInput, WatchlistItem } from '@/types/life-os';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const { data: existing } = await supabase.from('watchlist_items').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: '观察事项不存在' }, { status: 404 });
  const changes = await request.json() as Partial<WatchlistInput>;
  const current = existing as WatchlistItem;
  const validation = validateWatchlistInput({
    ticker_id: changes.ticker_id === undefined ? current.ticker_id : changes.ticker_id,
    asset_name: changes.asset_name === undefined ? current.asset_name : changes.asset_name,
    reason: changes.reason === undefined ? current.reason : changes.reason,
    entry_condition: changes.entry_condition === undefined ? current.entry_condition : changes.entry_condition,
    status: changes.status === undefined ? current.status : changes.status,
    next_check_at: changes.next_check_at === undefined ? current.next_check_at : changes.next_check_at,
    notes: changes.notes === undefined ? current.notes : changes.notes,
    source_type: current.source_type,
    source_ref: current.source_ref,
    review_status: current.review_status,
  });
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { data, error } = await supabase.from('watchlist_items').update({ ...validation.value, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '观察事项不存在' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const { error } = await supabase.from('watchlist_items').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
