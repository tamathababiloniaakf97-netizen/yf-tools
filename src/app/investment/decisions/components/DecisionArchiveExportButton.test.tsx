import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import DecisionArchiveExportButton from './DecisionArchiveExportButton';

afterEach(() => vi.restoreAllMocks());

it('downloads all finalized decisions for one company', async () => {
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob(['pdf']), { status: 200 })));
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:archive'), revokeObjectURL: vi.fn() });
  render(<App><DecisionArchiveExportButton profileId="profile-1" assetName="腾讯" /></App>);
  fireEvent.click(screen.getByRole('button', { name: '导出全部决策' }));
  await waitFor(() => expect(click).toHaveBeenCalled());
  expect(fetch).toHaveBeenCalledWith('/api/investment/research/profile-1/decisions/export');
});
