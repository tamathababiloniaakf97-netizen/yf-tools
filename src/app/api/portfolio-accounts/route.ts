import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validatePortfolioAccounts } from '@/lib/portfolio-account-locations';

export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { data, error } = await supabase
    .from('portfolio_account_locations')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ accounts: data ?? [] });
}

export async function PUT(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求格式无效' }, { status: 400 });
  }
  const accounts = body && typeof body === 'object' ? (body as { accounts?: unknown }).accounts : undefined;
  const validation = validatePortfolioAccounts(accounts);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const { error } = await supabase.rpc('save_portfolio_account_locations', { p_accounts: validation.value });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
