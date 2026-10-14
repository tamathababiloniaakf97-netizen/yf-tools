import { calculateAccountSummary } from '@/lib/cost-engine';
import type { PortfolioOpening, PortfolioOpeningPosition, Ticker, Transaction } from '@/types';

export interface PositionsResponse {
  exchange?: { rates: Record<string, number> };
  tickers: Ticker[];
  transactions: Transaction[];
  opening: PortfolioOpening | null;
  openingPositions: PortfolioOpeningPosition[];
}

export function financeDataKey(mode: string, year: number, index: number) {
  return `/api/household-finance?mode=${mode}&year=${year}&index=${index}`;
}

export function summarizePositions(data: PositionsResponse) {
  const prices = Object.fromEntries((data.tickers || []).map((ticker) => [ticker.id, ticker.current_price || 0]));
  const summary = calculateAccountSummary(
    data.transactions || [],
    data.tickers || [],
    prices,
    data.opening ? { opening: data.opening, positions: data.openingPositions || [] } : null,
    data.exchange?.rates,
  );

  return {
    totalAssets: summary.totalAssets,
    marketValue: summary.marketValue,
    cashBalance: summary.cashBalance,
  };
}
