import type { CostBasisResult, Transaction, Ticker, Position, AccountSummary, OptionPosition, OptionDetail, OptionDirection, OptionCallPut } from '@/types';
import { toUSD } from './exchange';
import { parseLegacyOptionType } from '@/types';

// ============================================================
// 期权：金额计算 / 仓位分组 / PnL
// ============================================================

/**
 * 从 option_detail 中提取 direction，兼容新旧格式
 */
function getDirection(od: OptionDetail | null | undefined): OptionDirection | null {
  if (!od) return null;
  if (od.direction) return od.direction;
  // 旧版兼容：从 option_type 解析
  if (od.option_type) {
    const parsed = parseLegacyOptionType(od.option_type);
    if (parsed) return parsed.direction;
  }
  return null;
}

function getCallPut(od: OptionDetail | null | undefined): OptionCallPut | null {
  if (!od) return null;
  if (od.type) return od.type;
  if (od.option_type) {
    const parsed = parseLegacyOptionType(od.option_type);
    if (parsed) return parsed.type;
  }
  return null;
}

/**
 * 计算期权交易的 amount_usd
 *
 * SELL → +price × quantity（收到权利金）
 * BUY  → -price × quantity（支付权利金）
 *
 * 注意：SELL 为正，BUY 为负，因此一个完整仓位的 PnL = sum(SELL) + sum(BUY) = sum(all amounts)
 */
export function computeOptionAmount(od: OptionDetail): number {
  const sign = od.direction === 'sell' ? 1 : -1;
  return sign * od.price * od.quantity;
}

/**
 * 将期权交易按 position_id 分组，计算每个仓位的状态和 PnL
 *
 * 成本规则：
 *  - 仓位 PnL = sum(SELL trades) - sum(BUY trades) = sum(all amounts)
 *  - 完全平仓 → PnL 全额计入股票成本（无论 SELL 还是 BUY）
 *  - 未平仓（含部分平仓）→ 不影响股票成本
 *  - 无 position_id 的历史数据 → 单条视为一个已平仓仓位（向后兼容）
 */
export function calculateOptionPositionPnL(
  optionTransactions: Transaction[]
): { closedPnL: number; openPositions: OptionPosition[] } {
  const byPosition = new Map<string, Transaction[]>();
  const legacy: Transaction[] = [];

  for (const t of optionTransactions) {
    const pid = t.option_detail?.position_id;
    if (pid) {
      if (!byPosition.has(pid)) byPosition.set(pid, []);
      byPosition.get(pid)!.push(t);
    } else {
      legacy.push(t);
    }
  }

  let closedPnL = 0;        // 已平仓期权 PnL → 全部计入股票成本
  const openPositions: OptionPosition[] = [];

  // 处理 legacy（无 position_id → 视为立即平仓，向后兼容）
  for (const t of legacy) {
    closedPnL += t.amount_usd ?? 0;
  }

  // 处理分组仓位
  for (const [pid, txns] of byPosition) {
    // 统计开仓/平仓合约数
    let totalQty = 0;
    let closedQty = 0;
    for (const t of txns) {
      const qty = t.option_detail?.quantity ?? 1;
      if (t.option_detail?.action === 'open') {
        totalQty += qty;
      } else if (t.option_detail?.action === 'close') {
        closedQty += qty;
      }
    }
    const remainingQty = totalQty - closedQty;
    const totalPnl = txns.reduce((sum, t) => sum + (t.amount_usd ?? 0), 0);

    const first = txns[0];
    const tickerId = first.ticker_id ?? '';
    const od = first.option_detail;
    const direction = getDirection(od);

    // 是否为旧版数据（无 direction 字段）
    const isLegacy = !direction;

    // 完全平仓判断
    const isFullyClosed = remainingQty <= 0;

    if (isFullyClosed) {
      // 完全平仓 → 无论 SELL/BUY，全部计入股票成本
      closedPnL += totalPnl;
    } else {
      // 未完全平仓 → 仅记录展示，不影响成本
      openPositions.push({
        position_id: pid,
        ticker_id: tickerId,
        direction: od?.direction || 'sell',
        type: getCallPut(od) || 'put',
        strike_price: od?.strike_price,
        expiration_date: od?.expiration_date,
        status: 'open',
        totalQuantity: totalQty,
        closedQuantity: closedQty,
        remainingQuantity: remainingQty,
        totalPremiumIn: txns
          .filter(t => (t.amount_usd ?? 0) > 0)
          .reduce((s, t) => s + (t.amount_usd ?? 0), 0),
        totalPremiumOut: txns
          .filter(t => (t.amount_usd ?? 0) < 0)
          .reduce((s, t) => s + Math.abs(t.amount_usd ?? 0), 0),
        pnl: totalPnl,
        openedAt: first.trade_date,
      });
    }
  }

  return { closedPnL, openPositions };
}

/**
 * 计算单个标的的持仓成本（终身成本法）
 *
 * 公式：
 *   持仓成本 = (累计买入总支出 - 累计卖出总收入 - 累计分红) ÷ 当前持仓数量
 *
 * 关键规则：
 *   - 终身制不清零：清仓后成本池保持不变
 *   - 期权收益不计入持仓成本，通过 optionPnl 单独展示
 */
export function calculateCostBasis(
  transactions: Transaction[],
  tickerCurrency: string
): CostBasisResult {
  let totalBought = 0;
  let totalSold = 0;
  let totalBuyAmount = 0;
  let totalSellAmount = 0;
  let totalDividend = 0;

  const optionTx: Transaction[] = [];

  for (const t of transactions) {
    const amountUSD = t.amount_usd ?? toUSD(t.amount_orig ?? 0, tickerCurrency);

    switch (t.type) {
      case 'buy':
        totalBought += t.quantity ?? 0;
        totalBuyAmount += amountUSD;
        break;
      case 'sell':
        totalSold += t.quantity ?? 0;
        totalSellAmount += amountUSD;
        break;
      case 'dividend':
        totalDividend += amountUSD;
        break;
      case 'option_income':
        optionTx.push(t);
        break;
    }
  }

  // 计算期权仓位 PnL（仅已平仓仓位）
  const { closedPnL } = calculateOptionPositionPnL(optionTx);

  const totalShares = totalBought - totalSold;
  const costPool = totalBuyAmount - totalSellAmount - totalDividend;

  if (totalShares <= 0) {
    return {
      costPerShare: 0,
      totalCost: 0,
      totalShares: 0,
      isNegativeCost: costPool < 0,
      optionPnl: closedPnL,
    };
  }

  const costPerShare = costPool / totalShares;
  return {
    costPerShare,
    totalCost: costPool,
    totalShares,
    isNegativeCost: costPerShare < 0,
    optionPnl: closedPnL,
  };
}

/**
 * 计算账户汇总
 *
 * 现金余额 = 累计入金 - 累计出金 + 累计卖出收入 - 累计买入支出 + 累计分红 + 累计期权净现金流
 * 总资产 = 持仓市值 + 现金余额
 * 总盈亏 = 总资产 - 总投入
 *
 * 期权所有现金流（BUY 和 SELL）均影响现金余额，但不影响股票持仓成本。
 */
export function calculateAccountSummary(
  allTransactions: Transaction[],
  tickers: Ticker[],
  currentPrices: Record<string, number>
): AccountSummary {
  let totalDeposit = 0;
  let totalWithdraw = 0;
  let totalBuyAmount = 0;
  let totalSellAmount = 0;
  let totalDividend = 0;
  const txByTicker: Record<string, Transaction[]> = {};
  for (const t of allTransactions) {
    if (t.ticker_id && (t.type === 'buy' || t.type === 'sell' || t.type === 'dividend' || t.type === 'option_income')) {
      if (!txByTicker[t.ticker_id]) txByTicker[t.ticker_id] = [];
      txByTicker[t.ticker_id].push(t);
    }

    const amountUSD = t.amount_usd ?? 0;
    switch (t.type) {
      case 'deposit':
        totalDeposit += amountUSD;
        break;
      case 'withdraw':
        totalWithdraw += amountUSD;
        break;
      case 'buy':
        totalBuyAmount += amountUSD;
        break;
      case 'sell':
        totalSellAmount += amountUSD;
        break;
      case 'dividend':
        totalDividend += amountUSD;
        break;
    }
  }

  // 计算每个标的的持仓
  const positions: Position[] = [];
  let totalMarketValue = 0;
  const allOptionTx: Transaction[] = [];

  for (const ticker of tickers) {
    const tickerTx = txByTicker[ticker.id] || [];
    const costBasis = calculateCostBasis(tickerTx, ticker.currency);
    if (costBasis.totalShares <= 0) continue;

    const currentPrice = currentPrices[ticker.id] ?? 0;
    const marketValue = costBasis.totalShares * currentPrice;
    totalMarketValue += marketValue;

    const pnl = (currentPrice - costBasis.costPerShare) * costBasis.totalShares;
    const pnlPercent = costBasis.costPerShare > 0
      ? ((currentPrice - costBasis.costPerShare) / costBasis.costPerShare) * 100
      : 0;

    positions.push({
      ticker,
      totalShares: costBasis.totalShares,
      costPerShare: costBasis.costPerShare,
      totalCost: costBasis.totalCost,
      currentPrice,
      marketValue,
      optionPnl: costBasis.optionPnl,
      pnl,
      pnlPercent: costBasis.isNegativeCost ? 0 : pnlPercent,
      isNegativeCost: costBasis.isNegativeCost,
      allocPercent: 0,
    });

    allOptionTx.push(...tickerTx.filter(t => t.type === 'option_income'));
  }

  // 计算未平仓期权仓位
  const { closedPnL, openPositions } = calculateOptionPositionPnL(allOptionTx);

  // 补充 ticker_name
  const tickerMap = new Map(tickers.map(t => [t.id, t.name]));
  for (const op of openPositions) {
    op.ticker_name = tickerMap.get(op.ticker_id);
  }

  // 现金余额（所有期权现金流都真实影响现金）
  const cashBalance = totalDeposit - totalWithdraw + totalSellAmount - totalBuyAmount + totalDividend + closedPnL;
  const totalAssets = totalMarketValue + cashBalance;
  const totalInvested = totalDeposit - totalWithdraw;
  const totalPnL = totalAssets - totalInvested;
  const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : null;

  for (const p of positions) {
    p.allocPercent = totalAssets > 0 ? (p.marketValue / totalAssets) * 100 : 0;
  }

  return {
    totalAssets,
    cashBalance,
    marketValue: totalMarketValue,
    totalInvested,
    totalPnL,
    pnlPercent,
    positions,
    openOptions: openPositions,
  };
}
