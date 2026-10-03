import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';

import EntryReviewStatus from './EntryReviewStatus';

afterEach(() => vi.unstubAllGlobals());

describe('EntryReviewStatus', () => {
  it('saves an individual checklist confirmation and refreshes its owner', async () => {
    const onReviewed = vi.fn();
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ reviewed_at: '2026-10-29T10:00:00Z' }) } as Response));
    vi.stubGlobal('fetch', fetchMock);
    render(<App><EntryReviewStatus periodMonth="2026-10-01" review={null} monthClosed={false} evidence={{business:'系统检测到 3 笔'}} onReviewed={onReviewed} /></App>);

    expect(screen.queryByRole('checkbox', { name:/经营收支/ })).not.toBeInTheDocument();
    expect(screen.getByText(/未完成：经营收支、家庭收支、还款记录等 8 项/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name:'展开检查' }));
    expect(screen.getByText('系统检测到 3 笔')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /经营收支/ }));

    await waitFor(() => expect(onReviewed).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith('/api/household-finance/entry-reviews', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ period_month: '2026-10-01', checks:{ business:true } }),
    }));
  });

  it('shows month close as system-controlled and included in progress', () => {
    render(<App><EntryReviewStatus periodMonth="2026-09-01" review={{ period_month:'2026-09-01', reviewed_at:'2026-09-29T10:00:00Z', checks:{business:true} }} monthClosed onReviewed={vi.fn()} /></App>);
    expect(screen.getByText('已完成 2/8')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name:'展开检查' }));
    expect(screen.getByRole('checkbox', { name:/月度结账/ })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name:/月度结账/ })).toBeChecked();
  });

  it('keeps the action available when confirmation fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({ error: '保存失败' }) } as Response)));
    render(<App><EntryReviewStatus periodMonth="2026-09-01" review={null} monthClosed={false} onReviewed={vi.fn()} /></App>);

    fireEvent.click(screen.getByRole('button', { name:'展开检查' }));
    fireEvent.click(screen.getByRole('checkbox', { name:/经营收支/ }));

    expect(await screen.findByText('保存失败')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name:/经营收支/ })).not.toBeChecked();
  });
});
