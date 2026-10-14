/**
 * 汇率折算工具
 *
 * 初期使用固定汇率，后续可改为实时汇率
 */

// Immutable legacy storage scale. Never replace these with today's valuation rates:
// ticker.current_price and opening costs were encoded using this scale.
export const LEGACY_RATES: Readonly<Record<string, number>> = Object.freeze({
  USD: 1,
  HKD: 1 / 7.8,
  CNY: 1 / 7.2,
});

export function fromLegacyUSD(amount: number, currency: string): number {
  return amount / getRate(currency);
}

export function formatMoney(value: number, currency: string, digits = 2, signed = false): string {
  const symbol = ({ USD: 'US$', HKD: 'HK$', CNY: 'CN¥' } as Record<string, string>)[currency] ?? currency;
  return `${value < 0 ? '-' : signed && value > 0 ? '+' : ''}${symbol} ${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

/**
 * 将原始币种金额折算为 USD
 */
export function toUSD(amount: number, currency: string): number {
  const rate = LEGACY_RATES[currency];
  if (rate === undefined) {
    throw new Error(`不支持的币种: ${currency}`);
  }
  return amount * rate;
}

/**
 * 获取指定币种兑 USD 的汇率
 */
export function getRate(currency: string): number {
  const rate = LEGACY_RATES[currency];
  if (rate === undefined) {
    throw new Error(`不支持的币种: ${currency}`);
  }
  return rate;
}

