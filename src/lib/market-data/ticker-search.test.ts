import { describe, expect, it } from 'vitest';
import { normalizeCryptoCandidates, normalizeStockCandidates } from './ticker-search';

describe('normalizeStockCandidates', () => {
  it('区分美股、港股和 A 股，并过滤不支持的市场', () => {
    const result = normalizeStockCandidates([
      { Code: 'AAPL', Name: '苹果', JYS: '纳斯达克', MktNum: '105' },
      { Code: '00700', Name: '腾讯控股', JYS: '港交所', MktNum: '116' },
      { Code: '600519', Name: '贵州茅台', JYS: '上交所', MktNum: '1' },
      { Code: 'X', Name: '不支持', JYS: '其他', MktNum: '999' },
    ]);

    expect(result).toEqual([
      expect.objectContaining({ code: 'AAPL', type: 'stock_us', currency: 'USD' }),
      expect.objectContaining({ code: '00700', type: 'stock_hk', currency: 'HKD' }),
      expect.objectContaining({ code: '600519', type: 'stock_a', currency: 'CNY' }),
    ]);
  });
});

describe('normalizeCryptoCandidates', () => {
  const products = [
    { id: 'BTC-USD', base_currency: 'BTC', quote_currency: 'USD', display_name: 'BTC-USD' },
    { id: 'ETH-USD', base_currency: 'ETH', quote_currency: 'USD', display_name: 'ETH-USD' },
    { id: 'BTC-EUR', base_currency: 'BTC', quote_currency: 'EUR', display_name: 'BTC-EUR' },
  ];

  it('支持中文别名，且只返回 USD 交易对', () => {
    expect(normalizeCryptoCandidates(products, '比特币')).toEqual([
      expect.objectContaining({ name: '比特币', code: 'BTC-USD', type: 'crypto', currency: 'USD' }),
    ]);
  });

  it('支持代码搜索', () => {
    expect(normalizeCryptoCandidates(products, 'eth')[0]).toMatchObject({ code: 'ETH-USD' });
  });

  it('对重复产品去重', () => {
    expect(normalizeCryptoCandidates([...products, products[0]], 'btc')).toHaveLength(1);
  });
});
