import type { Contact, Goal, InvestmentTask } from '@/types/life-os';
import type { EntryReviewReminder } from '@/lib/household-finance/entry-review-reminder';

export type DashboardActionSource = 'investment' | 'goal' | 'relationship' | 'finance';
export type DashboardActionUrgency = 'overdue' | 'today' | 'upcoming' | 'undated';

export interface DashboardAction {
  id: string;
  source: DashboardActionSource;
  title: string;
  context: string;
  dueDate: string | null;
  href: string;
  urgency: DashboardActionUrgency;
  statusLabel?: string;
}

interface DashboardActionInput {
  tasks: InvestmentTask[];
  goals: Goal[];
  contacts: Contact[];
  financeReminder?: EntryReviewReminder | null;
}

function shanghaiDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function urgency(dueDate: string | null, today: string): DashboardActionUrgency {
  if (!dueDate) return 'undated';
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  return 'upcoming';
}

export function buildDashboardActions(input: DashboardActionInput, now = new Date()): DashboardAction[] {
  const today = shanghaiDate(now);
  const actions: DashboardAction[] = [];

  for (const task of input.tasks) {
    if (!['pending', 'waiting'].includes(task.status) || task.review_status !== 'approved' || !task.title.trim()) continue;
    actions.push({ id: `investment:${task.id}`, source: 'investment', title: task.title.trim(), context: task.asset_name.trim(), dueDate: task.reminder_date, href: `/investment/tasks?task=${encodeURIComponent(task.id)}`, urgency: urgency(task.reminder_date, today) });
  }
  for (const goal of input.goals) {
    if (goal.status !== 'active' || goal.review_status !== 'approved' || !goal.next_action.trim()) continue;
    actions.push({ id: `goal:${goal.id}`, source: 'goal', title: goal.next_action.trim(), context: goal.title.trim(), dueDate: goal.next_action_due_at, href: '/goals', urgency: urgency(goal.next_action_due_at, today) });
  }
  for (const contact of input.contacts) {
    if (contact.review_status !== 'approved' || !contact.next_action.trim()) continue;
    actions.push({ id: `relationship:${contact.id}`, source: 'relationship', title: contact.next_action.trim(), context: contact.name.trim(), dueDate: contact.next_contact_at, href: '/relationships', urgency: urgency(contact.next_contact_at, today) });
  }
  if (input.financeReminder) {
    const reminder = input.financeReminder;
    actions.push({
      id: `finance-entry-review:${reminder.periodKey}`,
      source: 'finance',
      title: `检查并补齐 ${reminder.month} 月财务录入`,
      context: `已完成 ${reminder.completedCount}/${reminder.totalCount}；未完成：${reminder.missingLabels.join('、')}`,
      dueDate: reminder.dueDate,
      href: `/finance?tab=entry&period=${reminder.periodKey}`,
      urgency: reminder.overdue ? 'overdue' : 'upcoming',
      statusLabel: reminder.overdue ? undefined : reminder.statusLabel,
    });
  }

  const priority: Record<DashboardActionUrgency, number> = { overdue: 0, today: 1, upcoming: 2, undated: 3 };
  return actions.sort((a, b) => priority[a.urgency] - priority[b.urgency]
    || (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31')
    || a.id.localeCompare(b.id));
}
