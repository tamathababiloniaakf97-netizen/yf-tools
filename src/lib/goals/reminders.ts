import type { DueReminder } from '@/lib/reminders/types';
import type { Goal } from '@/types/life-os';

function shanghaiDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function buildGoalReminders(goals: Goal[], now = new Date()): DueReminder[] {
  const today = shanghaiDate(now);
  return goals
    .filter(goal => goal.status === 'active' && goal.review_status === 'approved' && goal.next_action.trim() && goal.next_action_due_at && goal.next_action_due_at <= today)
    .map(goal => ({
      id: `goal-action:${goal.id}:${today}`,
      subject_type: 'goal' as const,
      subject_id: goal.id,
      title: goal.next_action.trim(),
      kind: goal.next_action_due_at! < today ? 'goal_action_overdue' as const : 'goal_action_today' as const,
      due_date: goal.next_action_due_at,
      href: '/goals',
    }))
    .sort((a, b) => a.kind === b.kind ? a.title.localeCompare(b.title) : a.kind === 'goal_action_overdue' ? -1 : 1);
}
