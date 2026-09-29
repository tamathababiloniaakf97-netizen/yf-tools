import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';

type Context = { params: Promise<{ id: string; snapshotId: string }> };

export async function GET(_: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id, snapshotId } = await context.params;
  const { data, error } = await supabase.from('research_snapshots').select('*').eq('id', snapshotId).eq('research_profile_id', id).eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '研究快照不存在' }, { status: 404 });
  return NextResponse.json(data);
}
