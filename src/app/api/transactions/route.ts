import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { toUSD } from '@/lib/exchange';

// GET /api/transactions — 获取交易流水（支持筛选）
export async function GET(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const ticker_id = searchParams.get('ticker_id');
  const type = searchParams.get('type');
  const date_from = searchParams.get('date_from');
  const date_to = searchParams.get('date_to');

  let query = supabase
    .from('transactions')
    .select('*, tickers(name, code)')
    .eq('user_id', user.id)
    .order('trade_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (ticker_id) query = query.eq('ticker_id', ticker_id);
  if (type) query = query.eq('type', type);
  if (date_from) query = query.gte('trade_date', date_from);
  if (date_to) query = query.lte('trade_date', date_to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/transactions — 创建交易记录
export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await request.json();
  const { ticker_id, type, quantity, price, amount_orig, currency, option_detail, note, trade_date } = body;

  if (!type || !currency) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  }

  // 自动计算 USD 金额（如果没传）
  let amountUSD = body.amount_usd;
  if (amountUSD === undefined || amountUSD === null) {
    const orig = amount_orig ?? (quantity && price ? quantity * price : null);
    if (orig !== null) {
      amountUSD = toUSD(orig, currency);
    }
  }

  // 强制期权金额符号：BUY 必须为负数，SELL 必须为正数
  if (type === 'option_income' && option_detail) {
    const optDir = option_detail.direction;
    if (amountUSD !== undefined && amountUSD !== null) {
      amountUSD = optDir === 'sell' ? Math.abs(amountUSD) : -Math.abs(amountUSD);
    } else {
      // 从 option_detail 重新计算（不依赖外部传入）
      const qty = option_detail.quantity ?? 1;
      const p = option_detail.price ?? 0;
      amountUSD = optDir === 'sell' ? p * qty : -(p * qty);
    }
  }

  // 自动计算 amount_orig（如果没传但有 quantity 和 price）
  let amountOrig = amount_orig;
  if (amountOrig === undefined || amountOrig === null) {
    if (quantity !== undefined && price !== undefined && quantity !== null && price !== null) {
      amountOrig = quantity * price;
    }
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      ticker_id: ticker_id || null,
      type,
      quantity: quantity || null,
      price: price || null,
      amount_orig: amountOrig || null,
      amount_usd: amountUSD || null,
      currency,
      option_detail: option_detail || null,
      note: note || '',
      trade_date: trade_date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
