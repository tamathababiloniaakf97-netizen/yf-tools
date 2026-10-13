import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LightweightTextEditor from './LightweightTextEditor';

describe('LightweightTextEditor', () => {
  it('wraps selected text with bold markers', () => {
    const onChange = vi.fn();
    render(<LightweightTextEditor value="现金流重要" onChange={onChange} ariaLabel="规则正文" />);
    const textarea = screen.getByRole('textbox', { name: '规则正文' }) as HTMLTextAreaElement;
    textarea.setSelectionRange(0, 3);
    fireEvent.click(screen.getByRole('button', { name: '粗体' }));
    expect(onChange).toHaveBeenCalledWith('**现金流**重要');
  });

  it('adds and removes a list prefix for selected lines', () => {
    const onChange = vi.fn();
    const { rerender } = render(<LightweightTextEditor value={'第一条\n第二条'} onChange={onChange} ariaLabel="正文" />);
    const textarea = screen.getByRole('textbox', { name: '正文' }) as HTMLTextAreaElement;
    textarea.setSelectionRange(0, textarea.value.length);
    fireEvent.click(screen.getByRole('button', { name: '列表' }));
    expect(onChange).toHaveBeenLastCalledWith('- 第一条\n- 第二条');

    rerender(<LightweightTextEditor value={'- 第一条\n- 第二条'} onChange={onChange} ariaLabel="正文" />);
    const updated = screen.getByRole('textbox', { name: '正文' }) as HTMLTextAreaElement;
    updated.setSelectionRange(0, updated.value.length);
    fireEvent.click(screen.getByRole('button', { name: '列表' }));
    expect(onChange).toHaveBeenLastCalledWith('第一条\n第二条');
  });

  it('offers only the five approved formatting actions', () => {
    render(<LightweightTextEditor value="" onChange={() => undefined} />);
    expect(screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
      '粗体', '小标题', '列表', '引用', '强调',
    ]);
  });
});
