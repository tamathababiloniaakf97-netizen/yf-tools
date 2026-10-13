import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

import DecisionCopyButton from './DecisionCopyButton';

describe('DecisionCopyButton', () => {
  beforeEach(() => { push.mockClear(); vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => vi.unstubAllGlobals());

  it('creates a draft copy and opens it', async () => {
    let resolveFetch!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));
    render(<App><DecisionCopyButton decisionId="decision-1" /></App>);

    fireEvent.click(screen.getByRole('button', { name: '复制为新草稿' }));
    expect(fetch).toHaveBeenCalledWith('/api/investment/decisions/decision-1/copy', { method: 'POST' });
    expect(screen.getByRole('button', { name: '复制为新草稿' })).toBeDisabled();
    resolveFetch(new Response(JSON.stringify({ id: 'decision-2' }), { status: 201, headers: { 'Content-Type': 'application/json' } }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/investment/decisions/decision-2'));
  });

  it('keeps the current page and shows the server error', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: '复制失败' }), { status: 409, headers: { 'Content-Type': 'application/json' } }));
    render(<App><DecisionCopyButton decisionId="decision-1" /></App>);
    fireEvent.click(screen.getByRole('button', { name: '复制为新草稿' }));

    expect(await screen.findByText('复制失败')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
