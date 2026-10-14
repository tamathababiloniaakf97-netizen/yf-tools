import { App } from 'antd';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ResearchProfile, ResearchSnapshot } from '@/types/life-os';
import SnapshotList from './SnapshotList';

const profile = { id: 'p1', asset_name: '当前公司', business_model: '现在的生意' } as ResearchProfile;
const snapshot = {
  id: 's1', research_profile_id: 'p1', snapshot_version: 1, created_at: '2026-10-13T12:00:00Z',
  snapshot_data: { profile: { asset_name: '历史公司', business_model: '当时的生意', investment_thesis: '当时的摘要' },
    hypotheses: [{ id: 'h1', statement: '当时的假设', key_variables: '续费率', status: 'challenged', next_check_at: null }] },
  evidence_snapshot: [{ id: 'e1', content: '当时的证据', impact: 'challenge', source_name: '年报', source_url: 'https://example.com/report', hypothesis_id: 'h1', occurred_at: null }],
} as ResearchSnapshot;
afterEach(() => vi.unstubAllGlobals());

it('requires confirmation and removes a successfully deleted snapshot', async () => {
  const fetchMock = vi.fn(async (_url, init) => ({ ok: true, json: async () => init?.method === 'DELETE' ? { success: true } : [snapshot] }));
  vi.stubGlobal('fetch', fetchMock);
  render(<App><SnapshotList profile={profile} /></App>);
  fireEvent.click(await screen.findByRole('button', { name: '删除快照' }));
  expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: '确认删除' }));
  expect(await screen.findByText('尚未保存研究快照')).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith('/api/investment/research/p1/snapshots/s1', { method: 'DELETE' });
});

it('keeps a snapshot when a decision reference prevents deletion', async () => {
  vi.stubGlobal('fetch', vi.fn(async (_url, init) => ({ ok: init?.method !== 'DELETE', json: async () => init?.method === 'DELETE' ? { error: '该快照已被投资决策引用，不能删除' } : [snapshot] })));
  render(<App><SnapshotList profile={profile} /></App>);
  fireEvent.click(await screen.findByRole('button', { name: '删除快照' }));
  fireEvent.click(screen.getByRole('button', { name: '确认删除' }));
  expect(await screen.findByText('该快照已被投资决策引用，不能删除')).toBeInTheDocument();
  expect(screen.getByText('当时的摘要')).toBeInTheDocument();
});

it('opens frozen research, hypotheses and evidence from the listed version', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [snapshot] })));
  render(<App><SnapshotList profile={profile} /></App>);
  expect(await screen.findByText('当时的摘要')).toBeInTheDocument();
  expect(screen.getByText('1 条假设 · 1 条证据')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '查看快照' }));
  const detail = within(await screen.findByRole('dialog'));
  expect(detail.getByText('当时的生意')).toBeInTheDocument();
  expect(detail.queryByText('现在的生意')).not.toBeInTheDocument();
  expect(detail.getAllByText('当时的假设').length).toBeGreaterThan(0);
  expect(detail.getByText('当时的证据')).toBeInTheDocument();
  expect(detail.getByRole('link', { name: '年报' })).toHaveAttribute('href', 'https://example.com/report');
});

it('shows a retryable load error instead of an empty archive', async () => {
  const fetchMock = vi.fn().mockRejectedValueOnce(new Error('网络断开')).mockResolvedValue({ ok: true, json: async () => [snapshot] });
  vi.stubGlobal('fetch', fetchMock);
  render(<App><SnapshotList profile={profile} /></App>);
  expect(await screen.findByText('网络断开')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /重\s*试/ }));
  expect(await screen.findByText('当时的摘要')).toBeInTheDocument();
});

it('opens the newly saved version for inspection', async () => {
  vi.stubGlobal('fetch', vi.fn(async (_url, init) => ({ ok: true, json: async () => init?.method === 'POST' ? snapshot : [] })));
  render(<App><SnapshotList profile={profile} /></App>);
  await screen.findByText('尚未保存研究快照');
  expect(screen.getByText(/未保存的表单修改不会包含在快照中/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /保存当前研究快照/ }));
  expect(within(await screen.findByRole('dialog')).getByText('当时的生意')).toBeInTheDocument();
});

it('clears the old company detail and list when switching companies', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url) => ({ ok: true, json: async () => String(url).includes('/p1/') ? [snapshot] : [] })));
  const { rerender } = render(<App><SnapshotList profile={profile} /></App>);
  fireEvent.click(await screen.findByRole('button', { name: '查看快照' }));
  await screen.findByRole('dialog');
  rerender(<App><SnapshotList profile={{ ...profile, id: 'p2' }} /></App>);
  await screen.findByText('尚未保存研究快照');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByText('当时的摘要')).not.toBeInTheDocument();
});

it('explains empty historical sections and does not render unsafe source links', async () => {
  const sparse = { ...snapshot, snapshot_data: { profile: { asset_name: '旧档案' }, hypotheses: [] }, evidence_snapshot: [{ ...snapshot.evidence_snapshot[0], source_url: 'javascript:alert(1)' }] };
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [sparse] })));
  render(<App><SnapshotList profile={profile} /></App>);
  fireEvent.click(await screen.findByRole('button', { name: '查看快照' }));
  const detail = within(await screen.findByRole('dialog'));
  expect(detail.getByText('此版本未记录研究假设')).toBeInTheDocument();
  expect(detail.getAllByText('未填写').length).toBeGreaterThan(0);
  expect(detail.queryByRole('link')).not.toBeInTheDocument();
});
