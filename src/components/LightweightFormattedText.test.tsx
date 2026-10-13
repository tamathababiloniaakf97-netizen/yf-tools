import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LightweightFormattedText from './LightweightFormattedText';

describe('LightweightFormattedText', () => {
  it('renders approved formatting and preserves a single return', () => {
    const { container } = render(<LightweightFormattedText value={'## 判断\n第一行\n第二行\n- 依据\n> 反例\n**重点**和==警示=='} />);
    expect(screen.getByRole('heading', { name: '判断', level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('list')).toHaveTextContent('依据');
    expect(screen.getByText('反例')).toHaveClass('lightweight-formatted-quote');
    expect(screen.getByText('重点').tagName).toBe('STRONG');
    expect(screen.getByText('警示')).toHaveClass('lightweight-formatted-emphasis');
    expect(container.querySelectorAll('br')).toHaveLength(1);
  });

  it('renders HTML input as literal text without creating elements', () => {
    const { container } = render(<LightweightFormattedText value={'<script>alert(1)</script>'} />);
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });
});
