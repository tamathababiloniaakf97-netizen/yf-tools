import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { deleteTickerSafely } from '@/lib/tickers/delete-ticker';

// PATCH /api/tickers/[id] — 更新标的字段（如 current_price）
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // 验证归属
  const { data: ticker } = await supabase
    .from('tickers')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!ticker || ticker.user_id !== user.id) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }

  const { error } = await supabase
    .from('tickers')
    .update(body)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/tickers/[id] — 删除标的
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { id } = await params;

  // 验证归属
  const { data: ticker } = await supabase
    .from('tickers')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!ticker || ticker.user_id !== user.id) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }

  const result = await deleteTickerSafely(
    id,
    async (tickerId) => {
      const { count, error } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('ticker_id', tickerId)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    async (tickerId) => {
      const { error } = await supabase
        .from('tickers')
        .delete()
        .eq('id', tickerId)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
    },
  );

  if (result.status === 'has_transactions') {
    return NextResponse.json(
      { error: `该标的已有 ${result.transactionCount} 条交易记录，不能删除` },
      { status: 409 },
    );
  }
  if (result.status === 'failed') {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
