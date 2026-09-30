import { render, screen } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import PortfolioOpeningModal from './PortfolioOpeningModal';

describe('PortfolioOpeningModal', () => {
  it('separates opening market value from historical cost', () => {
    render(<App><PortfolioOpeningModal open tickers={[]} opening={null} positions={[]} earliestTransactionDate="2026-01-01" onClose={vi.fn()} onSuccess={vi.fn()} /></App>);
    expect(screen.getByText('期初现金（USD）')).toBeInTheDocument();
    expect(screen.getByText(/历史总成本/)).toBeInTheDocument();
    expect(screen.getByText(/期初市场价值/)).toBeInTheDocument();
    expect(screen.getByText(/不能晚于 2026-01-01/)).toBeInTheDocument();
  });
});
