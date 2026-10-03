import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';

const tables = { account: 'household_accounts', asset: 'household_assets', liability: 'household_liabilities' } as const;
const snapshotTables = { account: 'household_account_snapshots', asset: 'household_asset_snapshots', liability: 'household_liability_snapshots' } as const;

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await request.json() as { item_type?: keyof typeof tables; name?: string; category?: string; owner?: string; note?: string; value_cny?: number; valuation_date?: string };
  if (!body.item_type || !tables[body.item_type]) return NextResponse.json({ error: '无效项目类型' }, { status: 400 });
  if (!body.name?.trim() || !body.category || !['self','spouse','joint'].includes(body.owner || '') || !Number.isFinite(body.value_cny) || (body.value_cny ?? -1) < 0 || !body.valuation_date) return NextResponse.json({ error: '请完整填写名称、类别、归属、金额和估值日期' }, { status: 400 });
  const { data: item, error } = await supabase.from(tables[body.item_type]).insert({ user_id: user.id, name: body.name.trim(), category: body.category, owner: body.owner, note: body.note?.trim() || '' }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const foreignKey = `${body.item_type}_id`;
  const { error: snapshotError } = await supabase.from(snapshotTables[body.item_type]).insert({ user_id: user.id, [foreignKey]: item.id, snapshot_date: body.valuation_date, value_cny: body.value_cny });
  if (snapshotError) {
    await supabase.from(tables[body.item_type]).delete().eq('id', item.id).eq('user_id', user.id);
    return NextResponse.json({ error: snapshotError.message }, { status: 500 });
  }
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await request.json() as { item_type?: keyof typeof tables; id?: string; name?: string; category?: string; owner?: string; note?: string };
  if (!body.item_type || !tables[body.item_type] || !body.id) return NextResponse.json({ error: '无效项目' }, { status: 400 });
  if (!body.name?.trim() || !body.category?.trim() || !['self','spouse','joint'].includes(body.owner || '')) return NextResponse.json({ error: '请完整填写名称、类别和归属' }, { status: 400 });
  const values = { name: body.name.trim(), category: body.category.trim(), owner: body.owner, note: body.note?.trim() || '' };
  const { data, error } = await supabase.from(tables[body.item_type]).update(values).eq('id', body.id).eq('user_id', user.id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '项目不存在或无权操作' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await request.json() as { item_type?: keyof typeof tables; id?: string };
  if (!body.item_type || !tables[body.item_type] || !body.id) return NextResponse.json({ error: '无效项目' }, { status: 400 });
  const { data, error } = await supabase.from(tables[body.item_type]).delete().eq('id', body.id).eq('user_id', user.id).select().maybeSingle();
  if (error?.code === '23503') return NextResponse.json({ error: '该负债已有还款流水，不能删除；可以编辑名称或将余额更新为 0' }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '项目不存在或无权操作' }, { status: 404 });
  return NextResponse.json({ success: true });
}
