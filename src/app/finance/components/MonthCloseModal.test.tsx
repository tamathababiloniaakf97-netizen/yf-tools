import { render, screen } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import MonthCloseModal from './MonthCloseModal';

describe('MonthCloseModal', () => {
  it('uses the selected page month and leaves actual cash for manual entry', () => {
    render(<App><MonthCloseModal
      open
      periodMonth="2026-09"
      onClose={vi.fn()}
      onSuccess={vi.fn()}
      theoreticalCash={214000}
      investmentUsd={17039.09}
      securitiesUsd={16000}
      investmentCashUsd={1039.09}
    /></App>);

    expect(screen.getByLabelText('结账月份')).toHaveValue('2026-09');
    expect(screen.getByLabelText('家庭实际现金合计（CNY）')).toHaveDisplayValue('');
    expect(screen.getByText('本月账面现金净变化（仅供核对）')).toBeInTheDocument();
  });
});
