import { getRate, toUSD } from '@/lib/exchange';
import type { Currency, PortfolioOpeningInput } from '@/types';

type ValidationResult = { ok: true; value: PortfolioOpeningInput } | { ok: false; error: string };
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function calculateOpeningPositionAmounts(
  quantity: number,
  unitCost: number,
  currency: Currency,
  currentPrice: number | null,
) {
  if (!(quantity > 0) || !(unitCost > 0)) return null;
  if (currentPrice == null || !(currentPrice > 0)) return null;
  return {
    total_cost_usd: toUSD(quantity * unitCost, currency),
    opening_market_value_usd: toUSD(quantity * currentPrice, currency),
  };
}

export function deriveOpeningUnitCost(
  totalCostUsd: number,
  quantity: number,
  currency: Currency,
) {
  if (!(quantity > 0)) return 0;
  return totalCostUsd / quantity / getRate(currency);
}

export function validatePortfolioOpening(input: PortfolioOpeningInput, earliestTransactionDate: string | null): ValidationResult {
  if (!isoDate.test(input.opening_date)) return { ok: false, error: '期初日期无效' };
  if (earliestTransactionDate && input.opening_date > earliestTransactionDate) {
    return { ok: false, error: `期初日期不能晚于最早交易日期 ${earliestTransactionDate}` };
  }
  if (!Number.isFinite(input.opening_cash)) return { ok: false, error: '期初现金无效' };
  const ids = input.positions.map((position) => position.ticker_id);
  if (new Set(ids).size !== ids.length) return { ok: false, error: '期初持仓不能包含重复标的' };
  for (const position of input.positions) {
    if (!position.ticker_id) return { ok: false, error: '请选择期初持仓标的' };
    if (!Number.isFinite(position.quantity) || position.quantity <= 0) return { ok: false, error: '期初持仓数量必须大于 0' };
    if (!Number.isFinite(position.total_cost_usd) || position.total_cost_usd < 0) return { ok: false, error: '期初历史成本不能小于 0' };
    if (!Number.isFinite(position.opening_market_value_usd) || position.opening_market_value_usd < 0) return { ok: false, error: '期初市场价值不能小于 0' };
  }
  const openingNetAssets = input.opening_cash + input.positions.reduce((sum, position) => sum + position.opening_market_value_usd, 0);
  if (openingNetAssets <= 0) return { ok: false, error: '期初账户净资产必须大于 0' };
  return { ok: true, value: input };
}
