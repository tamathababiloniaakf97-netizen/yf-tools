import type { AccountSummary } from '@/types';

export function buildPortfolioOverview(summary: AccountSummary) {
  const topPositions = [...summary.positions]
    .sort((a, b) => b.allocPercent - a.allocPercent)
    .slice(0, 5);
  const largestWeight = topPositions[0]?.allocPercent ?? 0;
  const cashRatio = summary.totalAssets === 0 ? 0 : (summary.cashBalance / summary.totalAssets) * 100;
  const stockExposurePercent = summary.stockExposurePercent
    ?? (summary.totalAssets > 0 ? (summary.marketValue / summary.totalAssets) * 100 : 0);
  const primaryRisk = summary.cashBalance < 0
    ? `账户使用融资，股票敞口 ${stockExposurePercent.toFixed(1)}%`
    : stockExposurePercent > 100
      ? `股票敞口达到 ${stockExposurePercent.toFixed(1)}%`
      : largestWeight >= 50
        ? `最大单一持仓占比 ${largestWeight.toFixed(1)}%`
        : '暂未发现明显结构风险';

  return {
    topPositions,
    cashRatio,
    primaryRisk,
    primaryRiskLevel: primaryRisk === '暂未发现明显结构风险' ? 'success' as const : 'warning' as const,
  };
}
