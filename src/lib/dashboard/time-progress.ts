const DAY_MS = 24 * 60 * 60 * 1000;

export interface TimeProgress {
  dateKey: string;
  dateLabel: string;
  weekdayLabel: string;
  year: number;
  yearDay: number;
  yearTotalDays: number;
  yearRemainingDays: number;
  yearPercent: number;
  month: number;
  monthDay: number;
  monthTotalDays: number;
  monthRemainingDays: number;
  monthPercent: number;
}

function roundPercent(value: number) {
  return Math.round(value * 10) / 10;
}

function shanghaiParts(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day') };
}

export function buildTimeProgress(now: Date): TimeProgress {
  const { year, month, day } = shanghaiParts(now);
  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const calendarDay = Date.UTC(year, month - 1, day);
  const yearDay = Math.floor((calendarDay - Date.UTC(year, 0, 0)) / DAY_MS);
  const yearTotalDays = Math.floor((Date.UTC(year + 1, 0, 0) - Date.UTC(year, 0, 0)) / DAY_MS);
  const monthTotalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const weekdayLabel = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', weekday: 'long',
  }).format(new Date(`${dateKey}T12:00:00+08:00`));

  return {
    dateKey,
    dateLabel: `${year}年${month}月${day}日`,
    weekdayLabel,
    year,
    yearDay,
    yearTotalDays,
    yearRemainingDays: yearTotalDays - yearDay,
    yearPercent: roundPercent(yearDay / yearTotalDays * 100),
    month,
    monthDay: day,
    monthTotalDays,
    monthRemainingDays: monthTotalDays - day,
    monthPercent: roundPercent(day / monthTotalDays * 100),
  };
}
