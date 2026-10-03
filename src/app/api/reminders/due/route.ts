import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { buildAllRelationshipReminders } from '@/lib/relationships/reminders';
import { buildInvestmentTaskReminders } from '@/lib/investment/task-reminders';
import { buildEntryReviewReminder } from '@/lib/household-finance/entry-review-reminder';
import { buildGoalReminders } from '@/lib/goals/reminders';
import type { HouseholdEntryReview } from '@/types/household-finance';
import type { Contact, Goal, InvestmentTask } from '@/types/life-os';

export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const [contactsResult, tasksResult, goalsResult, financeSettingsResult, entryReviewsResult,closuresResult] = await Promise.all([
    supabase.from('contacts').select('*').eq('user_id', user.id).eq('review_status', 'approved'),
    supabase.from('investment_tasks').select('*').eq('user_id', user.id).eq('review_status', 'approved'),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('review_status', 'approved').eq('status', 'active'),
    supabase.from('household_finance_settings').select('entry_review_started_month').eq('user_id', user.id).maybeSingle(),
    supabase.from('household_entry_reviews').select('period_month,reviewed_at,checks').eq('user_id', user.id),
    supabase.from('household_period_closures').select('period_month,status').eq('user_id',user.id).eq('status','closed'),
  ]);
  const error = contactsResult.error ?? tasksResult.error ?? goalsResult.error ?? financeSettingsResult.error ?? entryReviewsResult.error ?? closuresResult.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const financeReminder = buildEntryReviewReminder(
    new Date(),
    financeSettingsResult.data?.entry_review_started_month,
    (entryReviewsResult.data ?? []) as HouseholdEntryReview[],
    (closuresResult.data??[]).map(item=>item.period_month),
  );
  return NextResponse.json([
    ...buildAllRelationshipReminders((contactsResult.data ?? []) as Contact[]),
    ...buildInvestmentTaskReminders((tasksResult.data ?? []) as InvestmentTask[]),
    ...buildGoalReminders((goalsResult.data ?? []) as Goal[]),
    ...(financeReminder ? [{
      id: `finance-entry-review:${financeReminder.periodKey}`,
      subject_type: 'household_finance' as const,
      subject_id: financeReminder.periodKey,
      title: `检查并补齐 ${financeReminder.month} 月财务录入`,
      description: `已完成 ${financeReminder.completedCount}/${financeReminder.totalCount}；未完成：${financeReminder.missingLabels.join('、')}`,
      kind: 'finance_entry_review' as const,
      due_date: financeReminder.dueDate,
      href: `/finance?tab=entry&period=${financeReminder.periodKey}`,
    }] : []),
  ]);
}
