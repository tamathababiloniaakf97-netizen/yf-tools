import type { Contact } from '@/types/life-os';
import type { DueReminder } from '@/lib/reminders/due-reminders';
import { buildBirthdayReminders } from './birthdays';
import { traditionalHolidaysForYear } from './holidays';

function shanghaiDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00+08:00`);
  value.setUTCDate(value.getUTCDate() + days);
  return shanghaiDate(value);
}

export function buildRelationshipReminders(contacts: Contact[], now = new Date()): DueReminder[] {
  const today = shanghaiDate(now);
  return contacts.filter((contact) => contact.review_status === 'approved' && contact.next_contact_at && contact.next_contact_at <= today).map((contact) => ({
    id: `contact:${contact.id}:${today}`, subject_type: 'contact' as const, subject_id: contact.id,
    title: contact.next_action || `联系 ${contact.name}`,
    kind: contact.next_contact_at! < today ? 'relationship_overdue' as const : 'relationship_today' as const,
    due_date: contact.next_contact_at, href: `/relationships?contact=${contact.id}`,
  })).sort((a, b) => a.kind === b.kind ? a.title.localeCompare(b.title) : a.kind === 'relationship_overdue' ? -1 : 1);
}

export function buildHolidayContactReminders(contacts: Contact[], now = new Date()): DueReminder[] {
  const today = shanghaiDate(now);
  const holidays = traditionalHolidaysForYear(Number(today.slice(0, 4)));

  return holidays.flatMap((holiday) => {
    const windowStart = addDays(holiday.date, -3);
    if (today < windowStart || today > holiday.date) return [];

    return contacts.flatMap((contact) => {
      if (contact.review_status !== 'approved' || !contact.holiday_contact_reminder_enabled) return [];
      if (contact.last_contact_at && contact.last_contact_at >= windowStart) return [];
      return [{
        id: `holiday:${contact.id}:${holiday.key}:${holiday.date}`,
        subject_type: 'contact' as const,
        subject_id: contact.id,
        title: `${holiday.name}将至，考虑联系${contact.name}`,
        kind: 'relationship_holiday' as const,
        due_date: holiday.date,
        href: `/relationships?contact=${contact.id}`,
      }];
    });
  });
}

export function buildAllRelationshipReminders(contacts: Contact[], now = new Date()): DueReminder[] {
  return [
    ...buildRelationshipReminders(contacts, now),
    ...buildBirthdayReminders(contacts, now),
    ...buildHolidayContactReminders(contacts, now),
  ];
}
