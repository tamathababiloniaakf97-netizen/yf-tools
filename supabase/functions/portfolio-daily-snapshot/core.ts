export type SnapshotTransaction = {
  date: string;
  type: 'buy' | 'sell' | 'dividend' | 'option_income' | 'deposit' | 'withdraw';
  tickerId: string | null;
  quantity: number | null;
  amountUsd: number;
};

export type SnapshotOpening = {
  openingDate: string;
  openingCash: number;
  positions: Array<{ tickerId: string; quantity: number; openingMarketValueUsd: number }>;
};

export type SnapshotPrice = {
  priceUsd: number;
  source: string;
  observedOn: string | null;
  fallback: boolean;
  error?: string;
};

export type DailySnapshot = {
  date: string;
  totalAssets: number;
  cashBalance: number;
  marketValue: number;
  externalFlow: number;
  shares: number;
  nav: number;
  valuationStatus: 'complete' | 'partial';
  priceErrors: string[];
};

export type PositionSnapshot = {
  tickerId: string;
  quantity: number;
  priceUsd: number;
  marketValueUsd: number;
  priceSource: string;
  priceDate: string | null;
  usedFallback: boolean;
};

export function buildOpeningBaseline(opening: SnapshotOpening): DailySnapshot {
  const marketValue = opening.positions.reduce((sum, position) => sum + position.openingMarketValueUsd, 0);
  const totalAssets = opening.openingCash + marketValue;
  return {
    date: opening.openingDate,
    totalAssets,
    cashBalance: opening.openingCash,
    marketValue,
    externalFlow: 0,
    shares: totalAssets,
    nav: totalAssets > 0 ? 1 : 0,
    valuationStatus: 'complete',
    priceErrors: [],
  };
}

function inRange(transaction: SnapshotTransaction, openingDate: string, date: string) {
  return transaction.date >= openingDate && transaction.date <= date;
}

export function buildDailySnapshot(input: {
  date: string;
  opening: SnapshotOpening;
  transactions: SnapshotTransaction[];
  prices: Record<string, SnapshotPrice>;
  previous?: DailySnapshot | null;
}): { ok: true; snapshot: DailySnapshot; positions: PositionSnapshot[] } | { ok: false; errors: string[] } {
  const relevant = input.transactions.filter((transaction) => inRange(transaction, input.opening.openingDate, input.date));
  const quantities = new Map(input.opening.positions.map((position) => [position.tickerId, position.quantity]));
  let cashBalance = input.opening.openingCash;

  for (const transaction of relevant) {
    switch (transaction.type) {
      case 'buy':
        if (transaction.tickerId) quantities.set(transaction.tickerId, (quantities.get(transaction.tickerId) ?? 0) + (transaction.quantity ?? 0));
        cashBalance -= transaction.amountUsd;
        break;
      case 'sell':
        if (transaction.tickerId) quantities.set(transaction.tickerId, (quantities.get(transaction.tickerId) ?? 0) - (transaction.quantity ?? 0));
        cashBalance += transaction.amountUsd;
        break;
      case 'deposit': cashBalance += transaction.amountUsd; break;
      case 'withdraw': cashBalance -= transaction.amountUsd; break;
      case 'dividend':
      case 'option_income': cashBalance += transaction.amountUsd; break;
    }
  }

  const errors: string[] = [];
  const priceErrors: string[] = [];
  const positions: PositionSnapshot[] = [];
  for (const [tickerId, quantity] of quantities) {
    if (quantity <= 0) continue;
    const price = input.prices[tickerId];
    if (!price || !Number.isFinite(price.priceUsd) || price.priceUsd <= 0) {
      errors.push(`${tickerId}：没有可用价格`);
      continue;
    }
    if (price.fallback) priceErrors.push(`${tickerId}：${price.error || '沿用最后有效价格'}`);
    positions.push({
      tickerId,
      quantity,
      priceUsd: price.priceUsd,
      marketValueUsd: quantity * price.priceUsd,
      priceSource: price.source,
      priceDate: price.observedOn,
      usedFallback: price.fallback,
    });
  }
  if (errors.length > 0) return { ok: false, errors };

  const marketValue = positions.reduce((sum, position) => sum + position.marketValueUsd, 0);
  const totalAssets = cashBalance + marketValue;
  const externalFlow = relevant
    .filter((transaction) => !input.previous || transaction.date > input.previous.date)
    .reduce((sum, transaction) => transaction.type === 'deposit'
      ? sum + transaction.amountUsd
      : transaction.type === 'withdraw' ? sum - transaction.amountUsd : sum, 0);
  const openingAssets = buildOpeningBaseline(input.opening).totalAssets;
  const baseNav = input.previous?.nav && input.previous.nav > 0 ? input.previous.nav : 1;
  const baseShares = input.previous?.shares ?? openingAssets;
  const shares = baseShares + externalFlow / baseNav;
  const nav = shares > 0 ? totalAssets / shares : 0;

  return {
    ok: true,
    snapshot: {
      date: input.date,
      totalAssets,
      cashBalance,
      marketValue,
      externalFlow,
      shares,
      nav,
      valuationStatus: priceErrors.length > 0 ? 'partial' : 'complete',
      priceErrors,
    },
    positions,
  };
}

export function calculateHistoryMetrics(points: Array<{ date: string; nav: number }>) {
  if (points.length < 2) return { twrReturn: null, annualizedReturn: null, maxDrawdown: 0 };
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const twrReturn = first.nav > 0 ? (last.nav / first.nav - 1) * 100 : null;
  let peak = first.nav;
  let maxDrawdown = 0;
  for (const point of sorted) {
    peak = Math.max(peak, point.nav);
    if (peak > 0) maxDrawdown = Math.max(maxDrawdown, (peak - point.nav) / peak * 100);
  }
  const days = (Date.parse(last.date) - Date.parse(first.date)) / 86_400_000;
  const annualizedReturn = days >= 60 && first.nav > 0 && last.nav > 0
    ? (Math.pow(last.nav / first.nav, 365 / days) - 1) * 100
    : null;
  return { twrReturn, annualizedReturn, maxDrawdown };
}
