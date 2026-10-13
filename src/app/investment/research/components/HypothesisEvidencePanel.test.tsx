import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ResearchProfile } from '@/types/life-os';
import HypothesisEvidencePanel from './HypothesisEvidencePanel';

const profile = { id: 'research-1', asset_name: '腾讯' } as ResearchProfile;

describe('HypothesisEvidencePanel', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses vertically resizable multi-line fields for hypothesis details and evidence', () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] } as Response)));
    render(<App><HypothesisEvidencePanel profile={profile} /></App>);

    fireEvent.click(screen.getByRole('button', { name: /添加假设/ }));
    const statement = screen.getByLabelText('假设');
    const keyVariables = screen.getByLabelText('关键变量');
    expect(statement.tagName).toBe('TEXTAREA');
    expect(keyVariables.tagName).toBe('TEXTAREA');
    expect(statement).toHaveStyle({ resize: 'vertical' });
    expect(keyVariables).toHaveStyle({ resize: 'vertical' });

    fireEvent.click(screen.getByRole('button', { name: /取\s*消/ }));
    fireEvent.click(screen.getByRole('button', { name: /添加证据/ }));
    expect(screen.getByLabelText('证据内容')).toHaveStyle({ resize: 'vertical' });
  });

  it('edits an existing hypothesis with the prefilled modal', async () => {
    const hypothesis = { id: 'hypothesis-1', statement: '收入继续增长', key_variables: '续费率', status: 'unverified', next_check_at: null };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'PATCH') return { ok: true, json: async () => hypothesis } as Response;
      return { ok: true, json: async () => String(input).includes('/hypotheses') ? [hypothesis] : [] } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<App><HypothesisEvidencePanel profile={profile} /></App>);

    await screen.findByText('收入继续增长');
    fireEvent.click(screen.getByRole('button', { name: '编辑假设：收入继续增长' }));
    expect(screen.getByLabelText('假设')).toHaveValue('收入继续增长');
    expect(screen.getByLabelText('关键变量')).toHaveValue('续费率');
    fireEvent.change(screen.getByLabelText('假设'), { target: { value: '收入稳定增长' } });
    fireEvent.click(screen.getByRole('button', { name: /保\s*存/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/investment/research/research-1/hypotheses/hypothesis-1', expect.objectContaining({ method: 'PATCH' })));
  });

  it('edits an existing evidence record with the prefilled modal', async () => {
    const evidence = { id: 'evidence-1', asset_name: '腾讯', content: '续约率稳定', impact: 'support', hypothesis_id: null, source_name: '年报', source_url: '', occurred_at: null };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'PATCH') return { ok: true, json: async () => evidence } as Response;
      return { ok: true, json: async () => String(input).includes('/evidence') ? [evidence] : [] } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<App><HypothesisEvidencePanel profile={profile} /></App>);

    await screen.findByText('续约率稳定');
    fireEvent.click(screen.getByRole('button', { name: '编辑证据：续约率稳定' }));
    expect(screen.getByLabelText('证据内容')).toHaveValue('续约率稳定');
    expect(screen.getByLabelText('来源名称')).toHaveValue('年报');
    fireEvent.change(screen.getByLabelText('证据内容'), { target: { value: '续约率连续三季稳定' } });
    fireEvent.click(screen.getByRole('button', { name: /保\s*存/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/investment/evidence/evidence-1', expect.objectContaining({ method: 'PATCH' })));
  });
});
