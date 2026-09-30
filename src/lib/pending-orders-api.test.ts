import { describe, expect, it, vi } from 'vitest';
import { createPendingOrder, updatePendingOrder } from './pending-orders-service';

const validStock = {
  ticker_id: 'ticker-1', category: 'stock' as const, side: 'buy' as const,
  option_action: null, option_type: null, position_id: null,
  quantity: 10, price: 165, strike_price: null, expiration_date: null,
  order_date: '2026-09-30',
};

describe('pending order service', () => {
  it('refuses to create an order for another users ticker', async () => {
    const repository = {
      ownsTicker: vi.fn().mockResolvedValue(false),
      insert: vi.fn(),
      findOwned: vi.fn(),
      update: vi.fn(),
    };
    await expect(createPendingOrder('user-1', validStock, repository)).rejects.toThrow('标的不存在或无权操作');
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('stores only normalized validated fields with the current user id', async () => {
    const repository = {
      ownsTicker: vi.fn().mockResolvedValue(true),
      insert: vi.fn().mockResolvedValue({ id: 'order-1' }),
      findOwned: vi.fn(),
      update: vi.fn(),
    };
    await createPendingOrder('user-1', { ...validStock, ignored: 'unsafe' } as typeof validStock, repository);
    expect(repository.insert).toHaveBeenCalledWith({ user_id: 'user-1', ...validStock });
  });

  it('refuses to update an order owned by another user', async () => {
    const repository = {
      ownsTicker: vi.fn(),
      insert: vi.fn(),
      findOwned: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    };
    await expect(updatePendingOrder('user-1', 'order-2', validStock, repository)).rejects.toThrow('挂单不存在或无权操作');
    expect(repository.update).not.toHaveBeenCalled();
  });
});
