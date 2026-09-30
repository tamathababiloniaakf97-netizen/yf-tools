import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { createPendingOrder, type PendingOrderRepository } from '@/lib/pending-orders-service';
import type { PendingOrder, PendingOrderInput } from '@/types';

function repositoryFor(supabase: Awaited<ReturnType<typeof createServerSideClient>>): PendingOrderRepository {
  return {
    async ownsTicker(userId, tickerId) {
      const { data } = await supabase.from('tickers').select('id').eq('id', tickerId).eq('user_id', userId).maybeSingle();
      return !!data;
    },
    async insert(row) {
      const { data, error } = await supabase.from('pending_orders').insert(row).select('*, tickers(name, code, currency)').single();
      if (error) throw new Error(error.message);
      return data;
    },
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

export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { data, error } = await supabase
    .from('pending_orders')
    .select('*, tickers(name, code, currency)')
    .eq('user_id', user.id)
    .order('order_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  try {
    const body = await request.json() as Partial<PendingOrderInput>;
    if (body.category === 'option' && body.option_action === 'open' && !body.position_id) {
      body.position_id = `opt_${crypto.randomUUID().replaceAll('-', '')}`;
    }
    const data = await createPendingOrder(user.id, body, repositoryFor(supabase));
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '创建挂单失败' }, { status: 400 });
  }
}
