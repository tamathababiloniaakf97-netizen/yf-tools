import type { Contact } from '@/types/life-os';
import type { DueReminder } from '@/lib/reminders/types';

const lunarMonths = ['', '正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '腊月'];
const lunarFormatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric',
});

function shanghaiDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function dateString(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00+08:00`);
  value.setUTCDate(value.getUTCDate() + days);
  return shanghaiDate(value);
}

function solarOccurrence(month: number, day: number, today: string) {
  let year = Number(today.slice(0, 4));
  for (let attempt = 0; attempt < 2; attempt += 1, year += 1) {
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const candidate = dateString(year, month, Math.min(day, lastDay));
    if (candidate >= today) return candidate;
  }
  return null;
}

function lunarOccurrence(month: number, day: number, leap: boolean, today: string) {
  const startYear = Number(today.slice(0, 4)) - 1;
  const endYear = startYear + 3;
  const byLunarYear = new Map<string, { ordinary?: string; leap?: string }>();

  for (let year = startYear; year <= endYear; year += 1) {
    const cursor = new Date(`${dateString(year, 1, 1)}T12:00:00+08:00`);
    const end = new Date(`${dateString(year, 12, 31)}T12:00:00+08:00`);
    while (cursor <= end) {
      const parts = lunarFormatter.formatToParts(cursor);
      const lunarYear = parts.find((part) => String(part.type) === 'relatedYear')?.value;
      const lunarMonth = parts.find((part) => part.type === 'month')?.value;
      const lunarDay = Number(parts.find((part) => part.type === 'day')?.value);
      if (lunarYear && lunarMonth && lunarDay === day && lunarMonth.replace('闰', '') === lunarMonths[month]) {
        const item = byLunarYear.get(lunarYear) ?? {};
        const candidate = shanghaiDate(cursor);
        if (lunarMonth.startsWith('闰')) item.leap = candidate;
        else item.ordinary = candidate;
        byLunarYear.set(lunarYear, item);
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  return [...byLunarYear.values()]
    .map((item) => leap ? (item.leap ?? item.ordinary) : item.ordinary)
    .filter((value): value is string => Boolean(value && value >= today))
    .sort()[0] ?? null;
}

export function nextBirthdayOccurrence(contact: Contact, now = new Date()) {
  if (!contact.birthday_calendar || contact.birthday_month == null || contact.birthday_day == null) return null;
  const today = shanghaiDate(now);
  return contact.birthday_calendar === 'solar'
    ? solarOccurrence(contact.birthday_month, contact.birthday_day, today)
    : lunarOccurrence(contact.birthday_month, contact.birthday_day, contact.birthday_is_leap_month, today);
}

export function buildBirthdayReminders(contacts: Contact[], now = new Date()): DueReminder[] {
  const today = shanghaiDate(now);
  return contacts.flatMap((contact) => {
    if (contact.review_status !== 'approved' || !contact.birthday_reminder_enabled) return [];
    const occurrence = nextBirthdayOccurrence(contact, now);
    if (!occurrence) return [];
    const sevenDaysBefore = addDays(occurrence, -7);
    if (today !== occurrence && today !== sevenDaysBefore) return [];
    const isToday = today === occurrence;
    return [{
      id: `birthday:${contact.id}:${occurrence}:${isToday ? 'today' : 'upcoming'}`,
      subject_type: 'contact' as const,
      subject_id: contact.id,
      title: isToday ? `今天是${contact.name}的生日` : `${contact.name}生日还有7天`,
      kind: isToday ? 'birthday_today' as const : 'birthday_upcoming' as const,
      due_date: occurrence,
      href: `/relationships?contact=${contact.id}`,
    }];
  });
}
