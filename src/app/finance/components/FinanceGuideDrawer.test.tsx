import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FinanceGuideDrawer from './FinanceGuideDrawer';

describe('FinanceGuideDrawer', () => {
  it('explains the workflow with concrete examples', () => {
    render(<FinanceGuideDrawer />);
    fireEvent.click(screen.getByRole('button', { name: '填写说明' }));
    expect(screen.getByText('先建资产与负债，再记收支，月底结账')).toBeInTheDocument();
    expect(screen.getByText(/月供 ¥8,000/)).toBeInTheDocument();
    expect(screen.getByText(/还信用卡时不要再次记家庭支出/)).toBeInTheDocument();
    expect(screen.getByText(/转入证券账户 ¥50,000/)).toBeInTheDocument();
    expect(screen.getByText(/月底怎么做/)).toBeInTheDocument();
  });
});
