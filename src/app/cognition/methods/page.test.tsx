import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CognitionMethodsPage from './page';
vi.mock('swr', () => ({ default: () => ({ data: [], error: undefined, mutate: vi.fn() }) }));
vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

describe('CognitionMethodsPage', () => {
  it('presents cognition methods as bounded rules', () => {
    render(<CognitionMethodsPage />);
    expect(screen.getByRole('heading', { name: '认知方法论' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /添加方法/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /管理分类/ })).toBeInTheDocument();
    expect(screen.getByText(/适用边界/)).toBeInTheDocument();
  });
});
