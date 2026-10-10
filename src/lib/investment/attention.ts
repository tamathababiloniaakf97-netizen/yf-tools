import type { InvestmentTask, WatchlistItem } from '@/types/life-os';

export type InvestmentAttentionItem = {
  id: string;
  source: 'watch' | 'task';
  sourceId: string;
  title: string;
  detail: string;
  reason: '价格关注' | '已逾期' | '今天提醒' | '7天未推进' | '14天未复核';
  date: string | null;
  href: string;
  task?: InvestmentTask;
  watchItem?: WatchlistItem;
};

type BuildAttentionInput = {
  tasks: InvestmentTask[];
  watchItems: WatchlistItem[];
  now?: Date;
  limit?: number;
};

function shanghaiDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function isOlderThan(value: string, now: Date, days: number) {
  return new Date(value).getTime() <= now.getTime() - days * 24 * 60 * 60 * 1000;
}

function datedReason(date: string, today: string): InvestmentAttentionItem['reason'] {
  return date < today ? '已逾期' : '今天提醒';
}

export function buildInvestmentAttentionItems({ tasks, watchItems, now = new Date(), limit }: BuildAttentionInput) {
  const today = shanghaiDate(now);
  const items: Array<InvestmentAttentionItem & { priority: number; sortDate: string }> = [];

  for (const item of watchItems) {
    if (item.review_status !== 'approved') continue;
    if (item.next_check_at && item.next_check_at <= today) {
      items.push({
        id: `watch:${item.id}`, source: 'watch', sourceId: item.id,
        title: item.asset_name, detail: item.reason || item.entry_condition,
        reason: datedReason(item.next_check_at, today), date: item.next_check_at,
        href: '/investment/watchlist', watchItem: item,
        priority: item.next_check_at < today ? 0 : 1, sortDate: item.next_check_at,
      });
    } else if (!item.next_check_at && item.status !== 'paused' && isOlderThan(item.updated_at, now, 14)) {
      items.push({
        id: `watch:${item.id}`, source: 'watch', sourceId: item.id,
        title: item.asset_name, detail: item.reason || item.entry_condition,
        reason: '14天未复核', date: null, href: '/investment/watchlist', watchItem: item,
        priority: 3, sortDate: item.updated_at,
      });
    }
  }

  for (const item of tasks) {
    if (item.review_status !== 'approved' || !['pending', 'waiting'].includes(item.status)) continue;
    if (item.price != null) {
      items.push({
        id: `task:${item.id}`, source: 'task', sourceId: item.id,
        title: item.title, detail: item.asset_name || item.condition_note,
        reason: '价格关注', date: item.reminder_date,
        href: `/investment/tasks?task=${item.id}`, task: item,
        priority: -1, sortDate: item.updated_at,
      });
    } else if (item.reminder_date && item.reminder_date <= today) {
      items.push({
        id: `task:${item.id}`, source: 'task', sourceId: item.id,
        title: item.title, detail: item.asset_name || item.condition_note,
        reason: datedReason(item.reminder_date, today), date: item.reminder_date,
        href: `/investment/tasks?task=${item.id}`, task: item,
        priority: item.reminder_date < today ? 0 : 1, sortDate: item.reminder_date,
      });
    } else if (!item.reminder_date && isOlderThan(item.updated_at, now, 7)) {
      items.push({
        id: `task:${item.id}`, source: 'task', sourceId: item.id,
        title: item.title, detail: item.asset_name || item.condition_note,
        reason: '7天未推进', date: null, href: `/investment/tasks?task=${item.id}`, task: item,
        priority: 2, sortDate: item.updated_at,
      });
    }
  }

  const sorted = items.sort((a, b) => a.priority - b.priority || a.sortDate.localeCompare(b.sortDate) || a.title.localeCompare(b.title));
  return (limit === undefined ? sorted : sorted.slice(0, limit)).map((item): InvestmentAttentionItem => ({
    id: item.id, source: item.source, sourceId: item.sourceId, title: item.title,
    detail: item.detail, reason: item.reason, date: item.date, href: item.href,
    task: item.task, watchItem: item.watchItem,
  }));
}
