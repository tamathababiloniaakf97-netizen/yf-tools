import { render, screen } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ResearchPage from './page';

vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));

describe('ResearchPage layout', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the company list narrow on wide screens so the research workspace gets priority', () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] } as Response)));
    render(<App><ResearchPage /></App>);

    expect(screen.getByText('研究公司 · 0').closest('.ant-col')).toHaveClass('ant-col-xl-4');
    expect(screen.getByText('选择或新建一家公司').closest('.ant-col')).toHaveClass('ant-col-xl-20');
  });
});
