import type { Plan } from '@/types/life-os';

export type DueReminderKind = 'overdue' | 'due_today' | 'scheduled' | 'recurring' | 'relationship_overdue' | 'relationship_today' | 'birthday_upcoming' | 'birthday_today' | 'investment_task_overdue' | 'investment_task_today';

export interface DueReminder {
  id: string;
  subject_type: 'plan' | 'contact' | 'investment_task';
  subject_id: string;
  title: string;
  kind: DueReminderKind;
  due_date: string | null;
  href: string;
}

function shanghaiDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function weekday(date: string) {
  return new Date(`${date}T12:00:00+08:00`).getUTCDay();
}

export function buildDueReminders(plans: Plan[], now = new Date()): DueReminder[] {
  const today = shanghaiDate(now);
  const inactive = new Set<Plan['status']>(['paused', 'completed', 'cancelled']);
  const result: DueReminder[] = [];

  for (const plan of plans) {
    if (inactive.has(plan.status)) continue;
    let kind: DueReminderKind | null = null;
    if (plan.due_date && plan.due_date < today) kind = 'overdue';
    else if (plan.due_date === today) kind = 'due_today';
    else if (plan.reminder_at && new Date(plan.reminder_at).getTime() <= now.getTime()) kind = 'scheduled';
    else if (plan.recurrence_rule === 'weekly' && plan.start_date && weekday(plan.start_date) === weekday(today)) kind = 'recurring';
    if (kind) result.push({ id: `${plan.id}:${today}`, subject_type: 'plan', subject_id: plan.id, title: plan.title, kind, due_date: plan.due_date, href: '/plans' });
  }

  const priority: Record<DueReminderKind, number> = { overdue: 0, relationship_overdue: 0, investment_task_overdue: 0, due_today: 1, relationship_today: 1, birthday_today: 1, investment_task_today: 1, birthday_upcoming: 2, scheduled: 3, recurring: 4 };
  return result.sort((a, b) => priority[a.kind] - priority[b.kind]);
}
