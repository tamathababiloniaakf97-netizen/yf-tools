import type { Contact } from '@/types/life-os';
import type { DueReminder } from '@/lib/reminders/due-reminders';

function shanghaiDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function buildRelationshipReminders(contacts: Contact[], now = new Date()): DueReminder[] {
  const today = shanghaiDate(now);
  return contacts.filter((contact) => contact.review_status === 'approved' && contact.next_contact_at && contact.next_contact_at <= today).map((contact) => ({
    id: `contact:${contact.id}:${today}`, subject_type: 'contact' as const, subject_id: contact.id,
    title: contact.next_action || `联系 ${contact.name}`,
    kind: contact.next_contact_at! < today ? 'relationship_overdue' as const : 'relationship_today' as const,
    due_date: contact.next_contact_at, href: '/relationships',
  })).sort((a, b) => a.kind === b.kind ? a.title.localeCompare(b.title) : a.kind === 'relationship_overdue' ? -1 : 1);
}
