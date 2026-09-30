import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({})) as { trade_date?: string };
  if (!body.trade_date || !isoDate.test(body.trade_date)) {
    return NextResponse.json({ error: '成交日期无效' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('convert_pending_order', {
    p_order_id: id,
    p_trade_date: body.trade_date,
  });
  if (error) {
    const status = error.message.includes('不存在') ? 404 : error.message.includes('超过') ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ success: true, transaction_id: data });
}
