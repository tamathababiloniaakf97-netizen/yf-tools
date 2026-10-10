import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PortfolioHistoryPanel from './PortfolioHistoryPanel';

vi.mock('./NavChart', () => ({ default: ({ userNav, spyNav, metrics, warning, periodLabel }: {
  userNav: Array<{ date: string; nav: number }>;
  spyNav: Array<{ date: string; nav: number }>;
  metrics: { twrReturn: number; excessReturn: number | null };
  warning?: string;
  periodLabel?: string;
}) => <div>图表：{userNav.length}；基准末值：{spyNav.at(-1)?.nav.toFixed(2)}；TWR：{metrics.twrReturn.toFixed(2)}；超额：{metrics.excessReturn?.toFixed(2)}；{periodLabel}；{warning}</div> }));

afterEach(() => vi.unstubAllGlobals());

describe('PortfolioHistoryPanel', () => {
  it('explains the metrics and shows accumulation state before two daily points exist', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [{ date: '2026-10-10', nav: 1, benchmark_nav: 1, valuation_status: 'complete', price_errors: [] }] })));
    render(<PortfolioHistoryPanel />);
    expect(await screen.findByText('历史数据正在积累')).toBeInTheDocument();
    expect(screen.getByText(/TWR排除入金、出金影响/)).toBeInTheDocument();
    expect(screen.getByText(/XIRR考虑每笔资金投入时间/)).toBeInTheDocument();
  });

  it('renders persisted NAV, normalized benchmark and partial-valuation warning', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [
      { date: '2026-10-10', nav: 1, benchmark_nav: 2, valuation_status: 'complete', price_errors: [] },
      { date: '2026-10-11', nav: 1.05, benchmark_nav: 2.2, valuation_status: 'partial', price_errors: ['159201：沿用最后有效价格'] },
    ] })));
    render(<PortfolioHistoryPanel />);
    await waitFor(() => expect(screen.getByText(/图表：2/)).toBeInTheDocument());
    expect(screen.getByText(/基准末值：1.10/)).toBeInTheDocument();
    expect(screen.getByText(/TWR：5.00/)).toBeInTheDocument();
    expect(screen.getByText(/部分日期使用最后有效价格/)).toBeInTheDocument();
  });

  it('switches to a fixed period, rebases both series and explains shortened history', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [
      { date: '2026-09-20', nav: 1, benchmark_nav: 2, valuation_status: 'complete', price_errors: [] },
      { date: '2026-10-10', nav: 1.1, benchmark_nav: 2.1, valuation_status: 'complete', price_errors: [] },
    ] })));
    render(<PortfolioHistoryPanel />);
    await waitFor(() => expect(screen.getByText(/图表：2/)).toBeInTheDocument());

    fireEvent.click(screen.getByText('3月'));

    expect(await screen.findByText(/实际从 2026-09-20 起算/)).toBeInTheDocument();
    expect(screen.getByText(/超额：5.00/)).toBeInTheDocument();
    expect(screen.getAllByText(/3月/).length).toBeGreaterThan(0);
  });

  it('shows honest accumulation state when a selected period has fewer than two points', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [
      { date: '2026-01-01', nav: 1, benchmark_nav: 1, valuation_status: 'complete', price_errors: [] },
      { date: '2026-10-10', nav: 1.1, benchmark_nav: 1.05, valuation_status: 'complete', price_errors: [] },
    ] })));
    render(<PortfolioHistoryPanel />);
    await waitFor(() => expect(screen.getByText(/图表：2/)).toBeInTheDocument());

    fireEvent.click(screen.getByText('1月'));

    expect(await screen.findByText('所选区间数据正在积累')).toBeInTheDocument();
    expect(screen.getByText(/当前只有 1 个每日快照/)).toBeInTheDocument();
  });
});
