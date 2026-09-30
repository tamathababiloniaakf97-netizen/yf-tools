import { describe, expect, it } from 'vitest';
import { buildTransactionFromPendingOrder, validatePendingOrderInput } from './pending-orders';
import type { PendingOrder, Ticker } from '@/types';

const ticker: Ticker = {
  id: 'ticker-1',
  user_id: 'user-1',
  name: '英伟达',
  code: 'NVDA',
  type: 'stock_us',
  currency: 'USD',
  current_price: null,
  price_updated_at: null,
  style: null,
  created_at: '2026-09-30T00:00:00Z',
};

function optionOrder(overrides: Partial<PendingOrder> = {}): PendingOrder {
  return {
    id: 'order-1',
    user_id: 'user-1',
    ticker_id: 'ticker-1',
    category: 'option',
    side: 'sell',
    option_action: 'open',
    option_type: 'put',
    position_id: 'opt-1',
    quantity: 1,
    price: 250,
    strike_price: 160,
    expiration_date: '2026-10-17',
    order_date: '2026-09-30',
    created_at: '2026-09-30T00:00:00Z',
    updated_at: '2026-09-30T00:00:00Z',
    ...overrides,
  };
}

describe('pending order validation', () => {
  it('accepts a valid stock order', () => {
    expect(validatePendingOrderInput({
      ticker_id: 'ticker-1', category: 'stock', side: 'buy', quantity: 10,
      price: 165, order_date: '2026-09-30',
    })).toMatchObject({ ok: true });
  });

  it('rejects non-positive quantity and price', () => {
    expect(validatePendingOrderInput({
      ticker_id: 'ticker-1', category: 'stock', side: 'buy', quantity: 0,
      price: 165, order_date: '2026-09-30',
    })).toEqual({ ok: false, error: '数量必须大于 0' });
    expect(validatePendingOrderInput({
      ticker_id: 'ticker-1', category: 'stock', side: 'buy', quantity: 1,
      price: -1, order_date: '2026-09-30',
    })).toEqual({ ok: false, error: '价格必须大于 0' });
  });

  it('requires option fields and a position for closing orders', () => {
    expect(validatePendingOrderInput({
      ticker_id: 'ticker-1', category: 'option', side: 'buy', option_action: 'close',
      option_type: 'put', quantity: 1, price: 100, strike_price: 160,
      expiration_date: '2026-10-17', order_date: '2026-09-30',
    })).toEqual({ ok: false, error: '平仓挂单必须关联期权仓位' });
  });
});

describe('pending order conversion', () => {
  it('maps a stock order to a normal transaction', () => {
    const order = optionOrder({ category: 'stock', side: 'buy', option_action: null, option_type: null, position_id: null, strike_price: null, expiration_date: null, quantity: 10, price: 165 });
    expect(buildTransactionFromPendingOrder(order, ticker, '2026-10-01')).toMatchObject({
      ticker_id: 'ticker-1', type: 'buy', quantity: 10, price: 165,
      amount_orig: 1650, amount_usd: 1650, currency: 'USD', trade_date: '2026-10-01',
    });
  });

  it('uses already-multiplied option premium without another x100', () => {
    expect(buildTransactionFromPendingOrder(optionOrder(), ticker, '2026-10-01')).toMatchObject({
      type: 'option_income', amount_usd: 250,
      option_detail: { direction: 'sell', action: 'open', type: 'put', quantity: 1, price: 250, position_id: 'opt-1' },
    });
    expect(buildTransactionFromPendingOrder(optionOrder({ side: 'buy', option_action: 'close', price: 100 }), ticker, '2026-10-02')).toMatchObject({
      amount_usd: -100,
      option_detail: { direction: 'buy', action: 'close', price: 100, position_id: 'opt-1' },
    });
  });
});
