import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ResearchPage from './page';

vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));

describe('ResearchPage layout', () => {
  afterEach(() => vi.unstubAllGlobals());

  const ticker = (id: string, name: string, code: string) => ({
    id, name, code, user_id: 'user-1', type: 'stock_us', currency: 'USD',
    current_price: null, price_updated_at: null, style: null, created_at: '2026-10-13T00:00:00Z',
  });

  function mockApi({ profiles = [], tickers = [] }: { profiles?: unknown[]; tickers?: unknown[] }) {
    const requests: Array<[RequestInfo | URL, RequestInit | undefined]> = [];
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      requests.push([url, init]);
      const path = String(url);
      if (path === '/api/investment/research' && init?.method === 'POST') {
        const body = JSON.parse(String(init.body));
        return { ok: true, json: async () => ({ id: 'research-new', ...body }) } as Response;
      }
      if (path === '/api/investment/research') return { ok: true, json: async () => profiles } as Response;
      if (path === '/api/investment/industries') return { ok: true, json: async () => [] } as Response;
      if (path === '/api/tickers') return { ok: true, json: async () => tickers } as Response;
      if (path.startsWith('/api/investment/')) return { ok: true, json: async () => [] } as Response;
      throw new Error(`Unexpected request: ${path}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    return requests;
  }

  it('keeps the company list narrow on wide screens so the research workspace gets priority', () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] } as Response)));
    render(<App><ResearchPage /></App>);

    expect(screen.getByText('研究公司 · 0').closest('.ant-col')).toHaveClass('ant-col-xl-4');
    expect(screen.getByText('选择或新建一家公司').closest('.ant-col')).toHaveClass('ant-col-xl-20');
  });

  it('creates research with the selected ticker id and canonical name', async () => {
    const requests = mockApi({ tickers: [ticker('ticker-crcl', 'Circle', 'CRCL')] });
    render(<App><ResearchPage /></App>);

    fireEvent.click(screen.getByRole('button', { name: /新建研究/ }));
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '公司或标的' }));
    fireEvent.click(await screen.findByText('Circle · CRCL'));
    fireEvent.click(screen.getByRole('button', { name: /创\s*建/ }));

    await waitFor(() => {
      const request = requests.find(([url, init]) => String(url) === '/api/investment/research' && init?.method === 'POST');
      expect(request).toBeDefined();
      expect(JSON.parse(String(request?.[1]?.body))).toEqual({ ticker_id: 'ticker-crcl', asset_name: 'Circle' });
    });
  });

  it('hides tickers that already have a linked research profile', async () => {
    mockApi({
      profiles: [{ id: 'research-meta', ticker_id: 'ticker-meta', asset_name: 'Meta', updated_at: '2026-10-13T00:00:00Z' }],
      tickers: [ticker('ticker-meta', 'Meta', 'META'), ticker('ticker-crcl', 'Circle', 'CRCL')],
    });
    render(<App><ResearchPage /></App>);

    await screen.findByRole('heading', { name: 'Meta' });
    fireEvent.click(screen.getByRole('button', { name: /新建研究/ }));
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '公司或标的' }));

    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByRole('option', { name: 'Circle · CRCL' })).toBeInTheDocument();
    expect(within(listbox).queryByRole('option', { name: 'Meta · META' })).not.toBeInTheDocument();
  });

  it('does not offer a same-name ticker for a legacy profile without ticker id', async () => {
    mockApi({
      profiles: [{ id: 'research-circle', ticker_id: null, asset_name: 'Circle', updated_at: '2026-10-13T00:00:00Z' }],
      tickers: [ticker('ticker-crcl', 'Circle', 'CRCL')],
    });
    render(<App><ResearchPage /></App>);

    await screen.findByRole('heading', { name: 'Circle' });
    fireEvent.click(screen.getByRole('button', { name: /新建研究/ }));
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '公司或标的' }));

    expect(await screen.findByText('没有可用标的，请先到持仓添加标的')).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Circle · CRCL' })).not.toBeInTheDocument();
  });

  it('tells the user to add a ticker when none are available', async () => {
    mockApi({ tickers: [] });
    render(<App><ResearchPage /></App>);

    fireEvent.click(screen.getByRole('button', { name: /新建研究/ }));
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '公司或标的' }));

    expect(await screen.findByText('没有可用标的，请先到持仓添加标的')).toBeInTheDocument();
  });
});
