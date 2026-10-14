import { render, screen } from '@testing-library/react';
import { App } from 'antd';
import { expect, it, vi } from 'vitest';
import TransactionPanel from './TransactionPanel';
import type { Transaction } from '@/types';

it('renders original recorded currency and outflow rather than dollar conversion', () => {
  const tx = { id: '1', type: 'buy', currency: 'CNY', quantity: 100, price: 7.2, amount_orig: 720, amount_usd: 100, trade_date: '2026-10-01' } as Transaction;
  render(<App><TransactionPanel transactions={[tx]} loading={false} onRefresh={vi.fn()} /></App>);
  expect(screen.getByText('CN¥ 7.2000')).toBeInTheDocument();
  expect(screen.getByText('-CN¥ 720.00')).toBeInTheDocument();
});
