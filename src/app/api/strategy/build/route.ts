import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { buildStrategy } from '@/lib/ai';

// POST /api/strategy/build — 调用 AI 生成策略
export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  try {
    const body = await request.json();
    const { holdings, intent, ivEnv, userInput } = body;

    if (!intent || !userInput || userInput.trim().length < 50) {
      return NextResponse.json({ error: '策略思考内容不足，请至少输入50字' }, { status: 400 });
    }

    const result = await buildStrategy({
      holdings: holdings || [],
      intent,
      ivEnv,
      userInput,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI服务暂时不可用';
    console.error('build strategy error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
