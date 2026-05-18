/**
 * 净值化算法
 *
 * 参考公募基金净值计算方式：
 *   总资产 = 持仓市值 + 现金余额
 *   初始净值 = 1.0000
 *   每日净值 = 当前总资产 ÷ 当前总份额
 *   入金时：新份额 = 入金额 ÷ 当日净值
 *   出金时：减少份额 = 出金额 ÷ 当日净值
 *
 * 用于净值曲线，排除中途追加本金对收益率的影响。
 */

import type { Transaction } from '@/types';

export interface NavPoint {
  date: string;
  nav: number;
  totalAssets: number;
  shares: number;
}

interface NavInput {
  date: string;
  transactions: Transaction[];
  // 当天收盘后的总市值（不含现金）
  marketValue: number;
  cashBalance: number;
}

/**
 * 按日期排序的净值计算
 *
 * dates 需按时间升序排列（从最早到最新）
 */
export function calculateNavSeries(dates: NavInput[]): NavPoint[] {
  // 按日期排序
  const sorted = [...dates].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const result: NavPoint[] = [];
  let currentNav = 1.0;
  let currentShares = 1.0; // 初始份额 = 1

  for (const day of sorted) {
    const totalAssets = day.marketValue + day.cashBalance;
    const dayNav = totalAssets / currentShares;
    currentNav = dayNav;

    // 处理当天的入金/出金
    for (const tx of day.transactions) {
      if (tx.type === 'deposit' && tx.amount_usd) {
        const newShares = tx.amount_usd / currentNav;
        currentShares += newShares;
      } else if (tx.type === 'withdraw' && tx.amount_usd) {
        const reduceShares = tx.amount_usd / currentNav;
        currentShares -= reduceShares;
      }
    }

    result.push({
      date: day.date,
      nav: currentNav,
      totalAssets,
      shares: currentShares,
    });
  }

  return result;
}

/**
 * 从交易记录和每日持仓数据生成净值序列
 */
export function buildNavFromHistory(
  dailyData: { date: string; marketValue: number; cashBalance: number }[],
  deposits: { date: string; amount_usd: number }[],
  withdraws: { date: string; amount_usd: number }[]
): NavPoint[] {
  // 按日期合并所有数据
  const dateMap = new Map<string, { marketValue: number; cashBalance: number; amounts: number[] }>();

  for (const d of dailyData) {
    dateMap.set(d.date, { marketValue: d.marketValue, cashBalance: d.cashBalance, amounts: [] });
  }

  for (const d of deposits) {
    if (!dateMap.has(d.date)) {
      dateMap.set(d.date, { marketValue: 0, cashBalance: 0, amounts: [] });
    }
    dateMap.get(d.date)!.amounts.push(d.amount_usd);
  }

  for (const d of withdraws) {
    if (!dateMap.has(d.date)) {
      dateMap.set(d.date, { marketValue: 0, cashBalance: 0, amounts: [] });
    }
    dateMap.get(d.date)!.amounts.push(-d.amount_usd);
  }

  const sortedDates = Array.from(dateMap.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  let nav = 1.0;
  let shares = 1.0;
  const result: NavPoint[] = [];

  for (const date of sortedDates) {
    const data = dateMap.get(date)!;
    const totalAssets = data.marketValue + data.cashBalance;
    const dayNav = shares > 0 ? totalAssets / shares : 1;
    nav = dayNav;

    // 调整份额
    for (const amount of data.amounts) {
      if (amount > 0) {
        const newShares = amount / nav;
        shares += newShares;
      } else {
        const reduceShares = Math.abs(amount) / nav;
        shares -= reduceShares;
      }
    }

    result.push({ date, nav, totalAssets, shares });
  }

  return result;
}
