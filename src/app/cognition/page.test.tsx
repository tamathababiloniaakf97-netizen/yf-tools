import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CognitionOverviewPage from './page';
vi.mock('swr', () => ({ default: (key: string) => ({ data: key.includes('journals') ? [] : [], error: undefined }) }));
vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

describe('CognitionOverviewPage', () => {
  it('presents a reflection workbench without vanity metrics', () => {
    render(<CognitionOverviewPage />);
    expect(screen.getByRole('heading', { name: '认知概览' })).toBeInTheDocument();
    expect(screen.getByText('待整理的认知日志')).toBeInTheDocument();
    expect(screen.getByText('待验证的方法论')).toBeInTheDocument();
    expect(screen.getByText('近期重复出现的错误')).toBeInTheDocument();
    expect(screen.queryByText(/连续.*天/)).not.toBeInTheDocument();
  });
});
