import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AppSidebar from './AppSidebar';

describe('AppSidebar', () => {
  it('shows the Life OS structure without retired product entries', () => {
    render(<AppSidebar pathname="/investment/research" onNavigate={() => {}} />);
    expect(screen.getByText('人生工作台')).toBeInTheDocument();
    expect(screen.getByText('投资')).toBeInTheDocument();
    expect(screen.getByText('公司研究')).toBeInTheDocument();
    expect(screen.getByText('持仓')).toBeInTheDocument();
    expect(screen.queryByText('AI策略构建')).not.toBeInTheDocument();
  });

  it('navigates to the existing holdings route', () => {
    const onNavigate = vi.fn();
    render(<AppSidebar pathname="/investment" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('持仓'));
    expect(onNavigate).toHaveBeenCalledWith('/cost');
  });
});
