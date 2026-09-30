import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { updatePendingOrder, type PendingOrderRepository } from '@/lib/pending-orders-service';
import type { PendingOrder, PendingOrderInput } from '@/types';

function repositoryFor(supabase: Awaited<ReturnType<typeof createServerSideClient>>): PendingOrderRepository {
  return {
    async ownsTicker(userId, tickerId) {
      const { data } = await supabase.from('tickers').select('id').eq('id', tickerId).eq('user_id', userId).maybeSingle();
      return !!data;
    },
    async insert() { throw new Error('不支持'); },
    async findOwned(userId, orderId) {
      const { data, error } = await supabase.from('pending_orders').select('*').eq('id', orderId).eq('user_id', userId).maybeSingle();
      if (error) throw new Error(error.message);
      return data as PendingOrder | null;
    },
    async update(userId, orderId, row) {
      const { data, error } = await supabase.from('pending_orders').update(row).eq('id', orderId).eq('user_id', userId).select('*, tickers(name, code, currency)').single();
      if (error) throw new Error(error.message);
      return data;
    },
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await params;

  try {
    const body = await request.json() as Partial<PendingOrderInput>;
    const data = await updatePendingOrder(user.id, id, body, repositoryFor(supabase));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新挂单失败';
    return NextResponse.json({ error: message }, { status: message.includes('不存在') ? 404 : 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await params;

  const { data, error } = await supabase.from('pending_orders').delete().eq('id', id).eq('user_id', user.id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '挂单不存在或无权操作' }, { status: 404 });
  return NextResponse.json({ success: true });
}
