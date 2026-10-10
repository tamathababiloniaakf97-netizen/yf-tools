import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CognitionJournalsPage from './page';
vi.mock('swr', () => ({ default: () => ({ data: [], error: undefined, mutate: vi.fn() }) }));
vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

describe('CognitionJournalsPage', () => {
  it('offers free writing and optional guided reflection', () => {
    render(<CognitionJournalsPage />);
    expect(screen.getByRole('heading', { name: '认知日志' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /写一条/ })).toBeInTheDocument();
    expect(screen.getByText(/真实事件中的判断/)).toBeInTheDocument();
  });
});
