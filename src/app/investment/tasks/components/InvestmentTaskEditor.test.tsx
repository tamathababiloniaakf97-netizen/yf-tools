import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import InvestmentTaskEditor from './InvestmentTaskEditor';

describe('InvestmentTaskEditor', () => {
  it('submits a linked ticker and reference price', async () => {
    const onSubmit = vi.fn(async () => undefined);
    render(<App><InvestmentTaskEditor open initial={null} saving={false} onCancel={() => undefined} onSubmit={onSubmit} tickers={[{ id: 'ticker-1', name: '腾讯', code: '00700', currency: 'HKD' }]} /></App>);
    fireEvent.change(screen.getByLabelText('待办事项'), { target: { value: '观察腾讯价格' } });
    fireEvent.mouseDown(screen.getByLabelText('关联标的'));
    fireEvent.click(await screen.findByText('腾讯 · 00700'));
    fireEvent.change(screen.getByLabelText('价格'), { target: { value: '420' } });
    fireEvent.click(screen.getByRole('button', { name: /OK|确/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ ticker_id: 'ticker-1', price: 420 })));
  });
});
