import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { toUSD } from '@/lib/exchange';

// PATCH /api/transactions/[id] — 编辑交易记录
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { id } = await params;
  const { data: tx } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (!tx || tx.user_id !== user.id) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }

  const body = await request.json();
  const update: Record<string, unknown> = {};

  // 通用字段
  if (body.note !== undefined) update.note = body.note;
  if (body.trade_date !== undefined) update.trade_date = body.trade_date;

  const isStock = tx.type === 'buy' || tx.type === 'sell';
  const isDividend = tx.type === 'dividend';
  const isCash = tx.type === 'deposit' || tx.type === 'withdraw';
  const isOption = tx.type === 'option_income';

  if (isStock) {
    const quantity = body.quantity !== undefined ? body.quantity : tx.quantity;
    const price = body.price !== undefined ? body.price : tx.price;
    if (body.quantity !== undefined) update.quantity = body.quantity;
    if (body.price !== undefined) update.price = body.price;
    if (body.quantity !== undefined || body.price !== undefined) {
      const newAmountOrig = quantity * price;
      update.amount_orig = newAmountOrig;
      update.amount_usd = toUSD(newAmountOrig, tx.currency);
    }
  } else if (isDividend) {
    if (body.amount_orig !== undefined) {
      update.amount_orig = body.amount_orig;
      update.amount_usd = toUSD(body.amount_orig, tx.currency);
    }
  } else if (isCash) {
    if (body.amount_orig !== undefined) {
      update.amount_orig = body.amount_orig;
      update.amount_usd = body.amount_orig; // 出入金以 USD 计
    }
  } else if (isOption) {
    const oldDetail = (tx.option_detail as Record<string, unknown>) || {};
    if (body.option_quantity !== undefined || body.option_price !== undefined) {
      const newQty = body.option_quantity !== undefined ? body.option_quantity : oldDetail.quantity;
      const newPrice = body.option_price !== undefined ? body.option_price : oldDetail.price;
      const dir = oldDetail.direction || 'sell';
      const newDetail = { ...oldDetail, quantity: newQty, price: newPrice };
      update.option_detail = newDetail;
      update.amount_usd = dir === 'sell' ? newPrice * newQty : -(newPrice * newQty);
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: '无可更新字段' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/transactions/[id] — 删除交易记录
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { id } = await params;

  const { data: tx } = await supabase
    .from('transactions')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!tx || tx.user_id !== user.id) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }

  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
