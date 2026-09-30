import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';

const tables = { account: ['household_account_snapshots','account_id'], asset: ['household_asset_snapshots','asset_id'], liability: ['household_liability_snapshots','liability_id'] } as const;
export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await request.json() as { item_type?: keyof typeof tables; item_id?: string; snapshot_date?: string; value_cny?: number };
  if (!body.item_type || !tables[body.item_type] || !body.item_id || !body.snapshot_date || !Number.isFinite(body.value_cny) || (body.value_cny ?? -1) < 0) return NextResponse.json({ error: '快照数据不完整' }, { status: 400 });
  const [table, key] = tables[body.item_type];
  const { error } = await supabase.from(table).upsert({ user_id: user.id, [key]: body.item_id, snapshot_date: body.snapshot_date, value_cny: body.value_cny }, { onConflict: `${key},snapshot_date` });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
