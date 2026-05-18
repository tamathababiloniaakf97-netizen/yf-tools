/**
 * 投资组合计算模块
 *
 * 集中管理所有收益/风险指标计算，确保一致性。
 * 采用基金行业标准的净值法（NAV / TWR）。
 */

import { calculateAccountSummary } from './cost-engine';
import type { Transaction, Ticker } from '@/types';

// ============================================================
// 类型定义
// ============================================================

export interface NavPoint {
  date: string;
  nav: number;
}

export interface PortfolioMetrics {
  /** 策略收益率（TWR，基于净值，不受入金影响）% */
  twrReturn: number | null;
  /** 年化收益率 % */
  annualizedReturn: number | null;
  /** 最大回撤 % */
  maxDrawdown: number;
  /** 账户收益率（简单收益，受入金影响）% */
  accountReturn: number | null;
  /** 净值序列 */
  navSeries: NavPoint[];
}

// ============================================================
// 1. NAV 净值序列计算（基金份额法）
// ============================================================

/**
 * 计算净值序列
 *
 * 规则：
 *  - NAV 从 1.0 开始
 *  - 入金/出金只调整份额，不影响 NAV
 *  - NAV 仅由持仓涨跌决定
 *  - 若缺少初始入金，自动补充（确保现金余额不为负）
 */
export function calculateNAVSeries(
  transactions: Transaction[],
  tickers: Ticker[],
  currentPrices: Record<string, number>
): NavPoint[] {
  if (transactions.length === 0 || tickers.length === 0) return [];

  const sortedTx = [...transactions].sort(
    (a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
  );

  // ----------------------------------------------------------
  // 检查是否需要自动补充初始入金
  // ----------------------------------------------------------
  // 计算首笔真实入金前的最大累计现金缺口
  const firstDepositIdx = sortedTx.findIndex(t => t.type === 'deposit');
  let maxDeficit = 0;
  let cumulativeCash = 0;
  const scanEnd = firstDepositIdx >= 0 ? firstDepositIdx : sortedTx.length;

  for (let i = 0; i < scanEnd; i++) {
    const tx = sortedTx[i];
    if (tx.type === 'buy') cumulativeCash -= (tx.amount_usd ?? 0);
    else if (tx.type === 'sell') cumulativeCash += (tx.amount_usd ?? 0);
    else if (tx.type === 'dividend') cumulativeCash += (tx.amount_usd ?? 0);
    else if (tx.type === 'option_income') cumulativeCash += (tx.amount_usd ?? 0);
    // deposit/withdraw excluded since we stop at first deposit
    if (cumulativeCash < maxDeficit) maxDeficit = cumulativeCash;
  }

  // 若有缺口，在第一天前补充初始入金
  const needsInitialDeposit = maxDeficit < 0;
  const firstDate = sortedTx[0].trade_date;
  let virtualDepositDate = firstDate;

  if (needsInitialDeposit) {
    // 虚拟入金在首笔交易前一天
    const d = new Date(firstDate);
    d.setDate(d.getDate() - 1);
    virtualDepositDate = d.toISOString().split('T')[0];

    // 插入虚拟入金交易
    sortedTx.unshift({
      id: '__virtual__',
      user_id: '',
      ticker_id: null,
      type: 'deposit',
      quantity: null,
      price: null,
      amount_orig: -maxDeficit,
      amount_usd: -maxDeficit,
      currency: 'USD',
      option_detail: null,
      note: '系统自动补充初始入金',
      trade_date: virtualDepositDate,
      created_at: '',
    });
  }

  // ----------------------------------------------------------
  // 净值计算主循环
  // ----------------------------------------------------------
  const dates = [...new Set(sortedTx.map(t => t.trade_date))].sort();
  let totalShares = 0;
  let navStarted = false;
  const result: NavPoint[] = [];

  for (const date of dates) {
    const dayTx = sortedTx.filter(t => t.trade_date === date);
    let dayNetDeposit = 0;
    for (const tx of dayTx) {
      if (tx.type === 'deposit') dayNetDeposit += (tx.amount_usd ?? 0);
      if (tx.type === 'withdraw') dayNetDeposit -= (tx.amount_usd ?? 0);
    }

    const txUpToDate = sortedTx.filter(t => t.trade_date <= date);
    const daySummary = calculateAccountSummary(txUpToDate, tickers, currentPrices);
    const totalAssets = daySummary.totalAssets;

    if (!navStarted) {
      if (totalAssets <= 0) continue;
      totalShares = totalAssets;
      navStarted = true;
      result.push({ date, nav: 1 });
    } else {
      const assetsBeforeCashFlow = totalAssets - dayNetDeposit;
      const nav = totalShares > 0 ? assetsBeforeCashFlow / totalShares : 1;

      if (dayNetDeposit !== 0 && nav > 0) {
        totalShares += dayNetDeposit / nav;
      }

      result.push({ date, nav: Math.max(nav, 0) });
    }
  }

  // 跳过虚拟入金日（只用真实交易日的净值）
  return needsInitialDeposit
    ? result.filter(p => p.date !== virtualDepositDate)
    : result;
}

// ============================================================
// 2. 策略收益率 TWR（基于净值）
// ============================================================

/**
 * 计算策略收益率（Time-Weighted Return）
 * = (最终净值 / 初始净值) - 1
 * 不受入金/出金影响
 */
export function calculateTWR(navSeries: NavPoint[]): number | null {
  if (navSeries.length < 2) return null;
  const first = navSeries[0].nav;
  const last = navSeries[navSeries.length - 1].nav;
  return ((last - first) / first) * 100;
}

// ============================================================
// 3. 年化收益率
// ============================================================

/**
 * 计算年化收益率
 * 公式：(1 + totalReturn)^(365/days) - 1
 * 至少需要 minDays 天才计算
 */
export function calculateAnnualizedReturn(
  navSeries: NavPoint[],
  minDays: number = 60
): number | null {
  if (navSeries.length < 2) return null;
  const first = navSeries[0].nav;
  const last = navSeries[navSeries.length - 1].nav;
  const days =
    (new Date(navSeries[navSeries.length - 1].date).getTime() -
      new Date(navSeries[0].date).getTime()) /
    (1000 * 60 * 60 * 24);

  if (days < minDays || first <= 0 || last <= 0) return null;
  return (Math.pow(last / first, 365 / days) - 1) * 100;
}

// ============================================================
// 4. 最大回撤（基于 NAV）
// ============================================================

/**
 * 计算最大回撤
 * 使用 rolling peak 方法，基于 NAV 序列
 */
export function calculateMaxDrawdown(navSeries: NavPoint[]): number {
  if (navSeries.length === 0) return 0;
  let peak = navSeries[0].nav;
  let maxDd = 0;
  for (const p of navSeries) {
    if (p.nav > peak) peak = p.nav;
    const dd = (peak - p.nav) / peak;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd * 100;
}

// ============================================================
// 5. 账户收益率（简单收益）
// ============================================================

/**
 * 计算账户收益率
 * = (总资产 - 净投入) / 净投入 * 100
 * 受入金/出金影响，反映用户整体赚了多少钱
 */
export function calculateAccountReturn(
  totalAssets: number,
  netDeposits: number
): number | null {
  if (netDeposits <= 0) return null;
  return ((totalAssets - netDeposits) / netDeposits) * 100;
}

// ============================================================
// 6. 综合计算
// ============================================================

/**
 * 一键计算所有指标
 */
export function calculateAllMetrics(
  transactions: Transaction[],
  tickers: Ticker[],
  currentPrices: Record<string, number>,
  totalAssets: number,
  netDeposits: number,
  annualizedMinDays: number = 60
): PortfolioMetrics {
  const navSeries = calculateNAVSeries(transactions, tickers, currentPrices);

  return {
    navSeries,
    twrReturn: calculateTWR(navSeries),
    annualizedReturn: calculateAnnualizedReturn(navSeries, annualizedMinDays),
    maxDrawdown: calculateMaxDrawdown(navSeries),
    accountReturn: calculateAccountReturn(totalAssets, netDeposits),
  };
}
