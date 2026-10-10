import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const numericFields = ['total_assets', 'cash_balance', 'market_value', 'external_flow', 'nav', 'shares', 'benchmark_price', 'benchmark_nav'] as const;

export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { data, error } = await supabase
    .from('nav_history')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map((row) => {
    const normalized = { ...row } as Record<string, unknown>;
    for (const field of numericFields) normalized[field] = row[field] == null ? null : Number(row[field]);
    return normalized;
  }));
}
