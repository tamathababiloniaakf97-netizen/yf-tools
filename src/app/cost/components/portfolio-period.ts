export type PeriodKey = '1m' | '3m' | '6m' | 'ytd' | '1y' | 'all';

export const periodOptions: Array<{ label: string; value: PeriodKey }> = [
  { label: '1月', value: '1m' },
  { label: '3月', value: '3m' },
  { label: '6月', value: '6m' },
  { label: '今年以来', value: 'ytd' },
  { label: '1年', value: '1y' },
  { label: '期初以来', value: 'all' },
];

export interface PeriodHistoryRow {
  date: string;
  nav: number | string;
  benchmark_nav?: number | string | null;
  valuation_status?: string | null;
}

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

function subtractMonths(dateText: string, months: number) {
  const date = new Date(`${dateText}T00:00:00Z`);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - months);
  const finalDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, finalDay));
  return toIsoDate(date);
}

export function getPeriodStart(period: PeriodKey, latestDate: string): string | null {
  if (period === 'all') return null;
  if (period === 'ytd') return `${latestDate.slice(0, 4)}-01-01`;
  if (period === '1y') return subtractMonths(latestDate, 12);
  return subtractMonths(latestDate, Number.parseInt(period, 10));
}

function rebase(points: Array<{ date: string; nav: number }>) {
  const base = points[0]?.nav;
  if (!base || base <= 0) return [];
  return points.map((point) => ({ date: point.date, nav: point.nav / base }));
}

export function buildPeriodView(history: PeriodHistoryRow[], period: PeriodKey) {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const latestDate = sorted.at(-1)?.date;
  const requestedStart = latestDate ? getPeriodStart(period, latestDate) : null;
  const selected = requestedStart ? sorted.filter((item) => item.date >= requestedStart) : sorted;
  const userNav = rebase(selected
    .map((item) => ({ date: item.date, nav: Number(item.nav) }))
    .filter((item) => Number.isFinite(item.nav) && item.nav > 0));
  const spyNav = rebase(selected
    .map((item) => ({ date: item.date, nav: Number(item.benchmark_nav) }))
    .filter((item) => Number.isFinite(item.nav) && item.nav > 0));
  const actualStart = selected[0]?.date ?? null;

  return {
    rows: selected,
    userNav,
    spyNav,
    requestedStart,
    actualStart,
    shortened: Boolean(requestedStart && actualStart && sorted[0]?.date > requestedStart),
    hasEnoughData: userNav.length >= 2,
  };
}
