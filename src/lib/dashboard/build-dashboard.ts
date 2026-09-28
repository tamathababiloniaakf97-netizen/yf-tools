import type { Contact, Plan } from '@/types/life-os';
import { buildRelationshipReminders } from '@/lib/relationships/reminders';

export interface DashboardData {
  weeklyFocus: Plan[];
  needsAttention: Plan[];
  inProgress: Plan[];
  completedThisWeek: Plan[];
  relationshipAttention: Contact[];
}

function startOfWeek(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  const mondayOffset = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() - mondayOffset);
  return value;
}

export function buildDashboard(plans: Plan[], contactsOrNow: Contact[] | Date = [], explicitNow?: Date): DashboardData {
  const contacts = contactsOrNow instanceof Date ? [] : contactsOrNow;
  const now = contactsOrNow instanceof Date ? contactsOrNow : (explicitNow ?? new Date());
  const today = now.toISOString().slice(0, 10);
  const weekStart = startOfWeek(now).getTime();
  const active = plans.filter((plan) => !['completed', 'cancelled'].includes(plan.status));

  return {
    weeklyFocus: active.filter((plan) => plan.is_weekly_focus).slice(0, 3),
    needsAttention: active.filter((plan) => plan.status === 'overdue' || (!!plan.due_date && plan.due_date < today)),
    inProgress: active.filter((plan) => plan.status === 'in_progress'),
    completedThisWeek: plans.filter((plan) => {
      if (plan.status !== 'completed' || !plan.completed_at) return false;
      const completedTime = new Date(plan.completed_at).getTime();
      return completedTime >= weekStart && completedTime <= now.getTime();
    }),
    relationshipAttention: (() => {
      const ids = new Set(buildRelationshipReminders(contacts, now).map((item) => item.subject_id));
      return contacts.filter((contact) => ids.has(contact.id));
    })(),
  };
}
