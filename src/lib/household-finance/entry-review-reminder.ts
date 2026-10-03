import type { HouseholdEntryReview } from '@/types/household-finance';
import { buildMonthlyChecklist } from './monthly-checklist';

export interface EntryReviewReminder {
  periodKey: string;
  periodMonth: string;
  month: number;
  dueDate: string;
  overdue: boolean;
  statusLabel: '月底预检查' | '上月补录';
  completedCount: number;
  totalCount: 8;
  missingLabels: string[];
}

function shanghaiParts(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value('year'), month: value('month'), day: value('day') };
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function nextMonth(year: number, month: number) {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

export function buildEntryReviewReminder(
  now: Date,
  startedMonth: string | null | undefined,
  reviews: Pick<HouseholdEntryReview, 'period_month' | 'reviewed_at' | 'checks'>[],
  closedMonths: string[] = [],
): EntryReviewReminder | null {
  if (!startedMonth || !/^\d{4}-\d{2}-01$/.test(startedMonth)) return null;

  const current = shanghaiParts(now);
  const currentKey = monthKey(current.year, current.month);
  const startKey = startedMonth.slice(0, 7);
  if (startKey > currentKey) return null;

  const reviewMap = new Map(reviews.map((review)=>([review.period_month.slice(0,7),review])));
  const closed = new Set(closedMonths.map(month=>month.slice(0,7)));
  let year = Number(startKey.slice(0, 4));
  let month = Number(startKey.slice(5, 7));

  while (monthKey(year, month) <= currentKey) {
    const periodKey = monthKey(year, month);
    const checklist=buildMonthlyChecklist(reviewMap.get(periodKey)?.checks,closed.has(periodKey));
    if (checklist.some(item=>!item.completed)) {
      const isCurrent = periodKey === currentKey;
      const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      if (!isCurrent || current.day >= daysInMonth - 6) {
        const deadlineMonth = nextMonth(year, month);
        const dueDate = `${monthKey(deadlineMonth.year, deadlineMonth.month)}-07`;
        const today = `${currentKey}-${String(current.day).padStart(2, '0')}`;
        return {
          periodKey,
          periodMonth: `${periodKey}-01`,
          month,
          dueDate,
          overdue: today > dueDate,
          statusLabel: isCurrent ? '月底预检查' : '上月补录',
          completedCount: checklist.filter(item=>item.completed).length,
          totalCount: 8,
          missingLabels: checklist.filter(item=>!item.completed).map(item=>item.label),
        };
      }
    }
    ({ year, month } = nextMonth(year, month));
  }

  return null;
}
