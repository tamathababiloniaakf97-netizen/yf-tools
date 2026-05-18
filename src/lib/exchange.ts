/**
 * 汇率折算工具
 *
 * 初期使用固定汇率，后续可改为实时汇率
 */

const RATES: Record<string, number> = {
  USD: 1,
  HKD: 1 / 7.8,
  CNY: 1 / 7.2,
};

/**
 * 将原始币种金额折算为 USD
 */
export function toUSD(amount: number, currency: string): number {
  const rate = RATES[currency];
  if (rate === undefined) {
    throw new Error(`不支持的币种: ${currency}`);
  }
  return amount * rate;
}

/**
 * 获取指定币种兑 USD 的汇率
 */
export function getRate(currency: string): number {
  const rate = RATES[currency];
  if (rate === undefined) {
    throw new Error(`不支持的币种: ${currency}`);
  }
  return rate;
}
