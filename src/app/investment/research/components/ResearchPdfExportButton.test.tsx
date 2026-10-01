import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ResearchPdfExportButton from './ResearchPdfExportButton';

describe('ResearchPdfExportButton', () => {
  const createObjectURL = vi.fn(() => 'blob:research-pdf');
  const revokeObjectURL = vi.fn();
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

  beforeEach(() => {
    click.mockClear(); createObjectURL.mockClear(); revokeObjectURL.mockClear();
    vi.stubGlobal('fetch', vi.fn());
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('downloads the generated PDF and releases the object URL', async () => {
    let resolveFetch!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));
    render(<App><ResearchPdfExportButton profileId="profile-1" assetName="腾讯" /></App>);

    fireEvent.click(screen.getByRole('button', { name: '导出 PDF' }));
    expect(fetch).toHaveBeenCalledWith('/api/investment/research/profile-1/export');
    expect(screen.getByRole('button', { name: '导出 PDF' })).toBeDisabled();
    resolveFetch(new Response(new Blob(['pdf']), { status: 200 }));

    await waitFor(() => expect(click).toHaveBeenCalled());
    const anchor = click.mock.instances.at(-1) as HTMLAnchorElement;
    expect(anchor.download).toMatch(/腾讯-当前公司研究-\d{4}-\d{2}-\d{2}\.pdf/);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:research-pdf');
  });

  it('shows the server error without starting a download', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: '导出失败' }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
    render(<App><ResearchPdfExportButton profileId="profile-1" assetName="腾讯" /></App>);
    fireEvent.click(screen.getByRole('button', { name: '导出 PDF' }));

    expect(await screen.findByText('导出失败')).toBeInTheDocument();
    expect(click).not.toHaveBeenCalled();
  });
});
