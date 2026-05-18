import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';

// GET /api/strategies — 获取当前用户的策略列表
export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { data, error } = await supabase
    .from('strategies')
    .select('id, title, status, risk_level, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/strategies — 保存新策略
export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await request.json();
  const { title, status, intent, iv_level, holdings, user_input, ai_response, edited_playbook, risk_level } = body;

  if (!title) {
    return NextResponse.json({ error: '缺少策略标题' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('strategies')
    .insert({
      user_id: user.id,
      title,
      status: status || '规划中',
      intent: intent || '加仓',
      iv_level: iv_level || null,
      holdings: holdings || [],
      user_input: user_input || '',
      ai_response: ai_response || null,
      edited_playbook: edited_playbook || null,
      risk_level: risk_level || null,
    })
    .select()
    .single();

  if (error) {
    console.error('strategies POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
