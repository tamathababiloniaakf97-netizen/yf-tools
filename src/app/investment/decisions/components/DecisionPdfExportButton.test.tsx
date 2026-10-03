import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DecisionPdfExportButton from './DecisionPdfExportButton';

describe('DecisionPdfExportButton', () => {
  const createObjectURL = vi.fn(() => 'blob:decision-pdf');
  const revokeObjectURL = vi.fn();
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

  beforeEach(() => {
    click.mockClear(); createObjectURL.mockClear(); revokeObjectURL.mockClear();
    vi.stubGlobal('fetch', vi.fn());
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('downloads the fixed decision PDF and releases the object URL', async () => {
    let resolveFetch!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));
    render(<App><DecisionPdfExportButton decisionId="decision-1" assetName="腾讯" decisionDate="2026-09-30" /></App>);

    fireEvent.click(screen.getByRole('button', { name: '导出 PDF' }));
    expect(fetch).toHaveBeenCalledWith('/api/investment/decisions/decision-1/export');
    expect(screen.getByRole('button', { name: '导出 PDF' })).toBeDisabled();
    resolveFetch(new Response(new Blob(['pdf']), { status: 200 }));

    await waitFor(() => expect(click).toHaveBeenCalled());
    const anchor = click.mock.instances.at(-1) as HTMLAnchorElement;
    expect(anchor.download).toBe('腾讯-投资决策-2026-09-30.pdf');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:decision-pdf');
  });

  it('shows the server error without starting a download', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: '只有已定稿决策可以导出' }), { status: 409, headers: { 'Content-Type': 'application/json' } }));
    render(<App><DecisionPdfExportButton decisionId="decision-1" assetName="腾讯" decisionDate={null} /></App>);
    fireEvent.click(screen.getByRole('button', { name: '导出 PDF' }));

    expect(await screen.findByText('只有已定稿决策可以导出')).toBeInTheDocument();
    expect(click).not.toHaveBeenCalled();
  });
});
