export type DueReminderKind =
  | 'relationship_overdue'
  | 'relationship_today'
  | 'relationship_holiday'
  | 'birthday_upcoming'
  | 'birthday_today'
  | 'investment_task_overdue'
  | 'investment_task_today'
  | 'investment_task_price'
  | 'finance_entry_review'
  | 'goal_action_overdue'
  | 'goal_action_today';

export interface DueReminder {
  id: string;
  subject_type: 'contact' | 'investment_task' | 'household_finance' | 'goal';
  subject_id: string;
  title: string;
  description?: string;
  kind: DueReminderKind;
  due_date: string | null;
  href: string;
  ticker_id?: string | null;
  reference_price?: number | null;
  currency?: string | null;
}
