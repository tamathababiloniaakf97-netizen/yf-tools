import type { InvestmentTask } from '@/types/life-os';
import type { DueReminder } from '@/lib/reminders/due-reminders';

function shanghaiDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function buildInvestmentTaskReminders(tasks: InvestmentTask[], now = new Date()): DueReminder[] {
  const today = shanghaiDate(now);
  return tasks.filter((task) => task.review_status === 'approved' && ['pending', 'waiting'].includes(task.status) && task.reminder_date && task.reminder_date <= today).map((task) => ({
    id: `investment-task:${task.id}:${today}`,
    subject_type: 'investment_task' as const,
    subject_id: task.id,
    title: task.asset_name ? `${task.asset_name}：${task.title}` : task.title,
    kind: task.reminder_date! < today ? 'investment_task_overdue' as const : 'investment_task_today' as const,
    due_date: task.reminder_date,
    href: `/investment/tasks?task=${task.id}`,
  })).sort((a, b) => a.kind === b.kind ? a.title.localeCompare(b.title) : a.kind === 'investment_task_overdue' ? -1 : 1);
}
