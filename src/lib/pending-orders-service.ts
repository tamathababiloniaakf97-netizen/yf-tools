import type { PendingOrder, PendingOrderInput } from '@/types';
import { validatePendingOrderInput } from './pending-orders';

export interface PendingOrderRepository {
  ownsTicker(userId: string, tickerId: string): Promise<boolean>;
  insert(row: PendingOrderInput & { user_id: string }): Promise<unknown>;
  findOwned(userId: string, orderId: string): Promise<PendingOrder | null>;
  update(userId: string, orderId: string, row: PendingOrderInput): Promise<unknown>;
}

export async function createPendingOrder(
  userId: string,
  input: Partial<PendingOrderInput>,
  repository: PendingOrderRepository,
) {
  const validated = validatePendingOrderInput(input);
  if (!validated.ok) throw new Error(validated.error);
  if (!await repository.ownsTicker(userId, validated.value.ticker_id)) {
    throw new Error('标的不存在或无权操作');
  }
  return repository.insert({ user_id: userId, ...validated.value });
}

export async function updatePendingOrder(
  userId: string,
  orderId: string,
  input: Partial<PendingOrderInput>,
  repository: PendingOrderRepository,
) {
  const existing = await repository.findOwned(userId, orderId);
  if (!existing) throw new Error('挂单不存在或无权操作');
  const validated = validatePendingOrderInput(input);
  if (!validated.ok) throw new Error(validated.error);
  if (!await repository.ownsTicker(userId, validated.value.ticker_id)) {
    throw new Error('标的不存在或无权操作');
  }
  return repository.update(userId, orderId, validated.value);
}
