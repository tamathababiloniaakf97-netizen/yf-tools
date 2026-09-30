import { render, screen } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import MonthlyEntryPanel from './MonthlyEntryPanel';

describe('MonthlyEntryPanel', () => {
  it('keeps business input minimal and household expenses separate', () => {
    render(<App><MonthlyEntryPanel entries={[]} loading={false} onRefresh={vi.fn()} /></App>);
    expect(screen.getByText('经营收支')).toBeInTheDocument();
    expect(screen.getByText('家庭支出')).toBeInTheDocument();
    expect(screen.getAllByText('备注').length).toBeGreaterThan(0);
    expect(screen.queryByText('客户')).not.toBeInTheDocument();
    expect(screen.queryByText('课程')).not.toBeInTheDocument();
  });
});
