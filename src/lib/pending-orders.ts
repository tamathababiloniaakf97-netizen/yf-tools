import type { PendingOrder, PendingOrderInput, Ticker } from '@/types';
import { toUSD } from './exchange';

type ValidationResult =
  | { ok: true; value: PendingOrderInput }
  | { ok: false; error: string };

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function validatePendingOrderInput(input: Partial<PendingOrderInput>): ValidationResult {
  if (!input.ticker_id) return { ok: false, error: '请选择标的' };
  if (input.category !== 'stock' && input.category !== 'option') return { ok: false, error: '挂单类别无效' };
  if (input.side !== 'buy' && input.side !== 'sell') return { ok: false, error: '买卖方向无效' };
  if (!Number.isFinite(input.quantity) || Number(input.quantity) <= 0) return { ok: false, error: '数量必须大于 0' };
  if (!Number.isFinite(input.price) || Number(input.price) <= 0) return { ok: false, error: '价格必须大于 0' };
  if (!input.order_date || !isoDate.test(input.order_date)) return { ok: false, error: '挂单日期无效' };

  if (input.category === 'option') {
    if (input.option_action !== 'open' && input.option_action !== 'close') return { ok: false, error: '请选择开仓或平仓' };
    if (input.option_type !== 'call' && input.option_type !== 'put') return { ok: false, error: '请选择 CALL 或 PUT' };
    if (!Number.isFinite(input.strike_price) || Number(input.strike_price) <= 0) return { ok: false, error: '行权价必须大于 0' };
    if (!input.expiration_date || !isoDate.test(input.expiration_date)) return { ok: false, error: '到期日无效' };
    if (input.option_action === 'close' && !input.position_id) return { ok: false, error: '平仓挂单必须关联期权仓位' };
  }

  return {
    ok: true,
    value: {
      ticker_id: input.ticker_id,
      category: input.category,
      side: input.side,
      option_action: input.category === 'option' ? input.option_action! : null,
      option_type: input.category === 'option' ? input.option_type! : null,
      position_id: input.category === 'option' ? input.position_id ?? null : null,
      quantity: Number(input.quantity),
      price: Number(input.price),
      strike_price: input.category === 'option' ? Number(input.strike_price) : null,
      expiration_date: input.category === 'option' ? input.expiration_date! : null,
      order_date: input.order_date,
    },
  };
}

export function buildTransactionFromPendingOrder(order: PendingOrder, ticker: Ticker, tradeDate: string) {
  if (order.category === 'stock') {
    const amountOrig = order.quantity * order.price;
    return {
      ticker_id: order.ticker_id,
      type: order.side,
      quantity: order.quantity,
      price: order.price,
      amount_orig: amountOrig,
      amount_usd: toUSD(amountOrig, ticker.currency),
      currency: ticker.currency,
      option_detail: null,
      note: '由挂单成交转入',
      trade_date: tradeDate,
    };
  }

  const amount = order.price * order.quantity;
  return {
    ticker_id: order.ticker_id,
    type: 'option_income' as const,
    quantity: null,
    price: null,
    amount_orig: null,
    amount_usd: order.side === 'sell' ? amount : -amount,
    currency: 'USD' as const,
    option_detail: {
      direction: order.side,
      type: order.option_type!,
      action: order.option_action!,
      position_id: order.position_id || `opt_${order.id}`,
      quantity: order.quantity,
      price: order.price,
      strike_price: order.strike_price ?? undefined,
      expiration_date: order.expiration_date ?? undefined,
    },
    note: '由挂单成交转入',
    trade_date: tradeDate,
  };
}
