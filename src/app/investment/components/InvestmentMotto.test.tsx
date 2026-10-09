import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InvestmentMotto from './InvestmentMotto';

describe('InvestmentMotto', () => {
  it('renders four ordered, non-interactive seals', () => {
    const { container } = render(<InvestmentMotto />);

    expect(screen.getByLabelText('道势法术')).toHaveTextContent('道势法术');
    expect(container.querySelectorAll('.investment-motto-seal')).toHaveLength(4);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
