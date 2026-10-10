import type { Position, TickerStyle, TickerType } from '@/types';

export interface PositionFilters {
  style: TickerStyle | null;
  type: TickerType | null;
  query: string;
}

export interface PositionFilterSummary {
  visibleCount: number;
  totalCount: number;
  marketValue: number;
  pnl: number;
  returnPercent: number | null;
  accountPercent: number | null;
}

export function filterPositions(positions: Position[], filters: PositionFilters): Position[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return positions.filter(position => {
    if (filters.style && position.ticker.style !== filters.style) return false;
    if (filters.type && position.ticker.type !== filters.type) return false;
    if (!query) return true;
    return position.ticker.name.toLocaleLowerCase().includes(query)
      || position.ticker.code.toLocaleLowerCase().includes(query);
  });
}

export function summarizePositions(
  visiblePositions: Position[],
  totalCount: number,
  totalAssets: number,
): PositionFilterSummary {
  const marketValue = visiblePositions.reduce((sum, position) => sum + position.marketValue, 0);
  const totalCost = visiblePositions.reduce((sum, position) => sum + position.totalCost, 0);
  const pnl = visiblePositions.reduce((sum, position) => sum + position.pnl, 0);

  return {
    visibleCount: visiblePositions.length,
    totalCount,
    marketValue,
    pnl,
    returnPercent: totalCost > 0 ? pnl / totalCost * 100 : null,
    accountPercent: totalAssets > 0 ? marketValue / totalAssets * 100 : null,
  };
}
