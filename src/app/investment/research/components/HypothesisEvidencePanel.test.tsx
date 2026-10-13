import { App } from 'antd';
import { fireEvent, render, screen } from '@testing-library/react';
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
});
