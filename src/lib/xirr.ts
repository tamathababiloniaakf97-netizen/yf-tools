export interface DatedCashFlow { date: string; amount: number }

export function calculateXirr(cashFlows: DatedCashFlow[]): number | null {
  if (cashFlows.length < 2 || !cashFlows.some((flow) => flow.amount < 0) || !cashFlows.some((flow) => flow.amount > 0)) return null;
  const sorted = [...cashFlows].sort((a, b) => a.date.localeCompare(b.date));
  const start = new Date(sorted[0].date).getTime();
  const npv = (rate: number) => sorted.reduce((sum, flow) => {
    const years = (new Date(flow.date).getTime() - start) / 31_536_000_000;
    return sum + flow.amount / Math.pow(1 + rate, years);
  }, 0);
  let low = -0.9999;
  let high = 10;
  let lowValue = npv(low);
  let highValue = npv(high);
  while (lowValue * highValue > 0 && high < 1_000_000) {
    high *= 10;
    highValue = npv(high);
  }
  if (!Number.isFinite(lowValue) || !Number.isFinite(highValue) || lowValue * highValue > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    const value = npv(mid);
    if (Math.abs(value) < 1e-8) return mid * 100;
    if (lowValue * value <= 0) {
      high = mid;
      highValue = value;
    } else {
      low = mid;
      lowValue = value;
    }
  }
  const result = ((low + high) / 2) * 100;
  return Number.isFinite(result) ? result : null;
}
