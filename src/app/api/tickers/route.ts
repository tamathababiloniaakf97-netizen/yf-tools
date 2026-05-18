import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';

// GET /api/tickers — 获取当前用户的所有标的
export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { data, error } = await supabase
    .from('tickers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/tickers — 创建新标的
export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await request.json();
  const { name, code, type, currency, style } = body;

  if (!name || !code || !type || !currency) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('tickers')
    .insert({ user_id: user.id, name, code, type, currency, style })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
