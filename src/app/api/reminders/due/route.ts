import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { buildDueReminders } from '@/lib/reminders/due-reminders';
import { buildAllRelationshipReminders } from '@/lib/relationships/reminders';
import { buildInvestmentTaskReminders } from '@/lib/investment/task-reminders';
import type { Contact, InvestmentTask, Plan } from '@/types/life-os';

export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const [plansResult, contactsResult, tasksResult] = await Promise.all([
    supabase.from('plans').select('*').eq('user_id', user.id),
    supabase.from('contacts').select('*').eq('user_id', user.id).eq('review_status', 'approved'),
    supabase.from('investment_tasks').select('*').eq('user_id', user.id).eq('review_status', 'approved'),
  ]);
  const error = plansResult.error ?? contactsResult.error ?? tasksResult.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json([
    ...buildDueReminders((plansResult.data ?? []) as Plan[]),
    ...buildAllRelationshipReminders((contactsResult.data ?? []) as Contact[]),
    ...buildInvestmentTaskReminders((tasksResult.data ?? []) as InvestmentTask[]),
  ]);
}
