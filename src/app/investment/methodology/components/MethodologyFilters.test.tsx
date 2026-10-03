import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MethodologyFilters from './MethodologyFilters';

describe('MethodologyFilters', () => {
  it('把输入的关键词交给页面', () => {
    const onKeywordChange = vi.fn();
    render(
      <MethodologyFilters
        keyword=""
        category="all"
        onKeywordChange={onKeywordChange}
        onCategoryChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('搜索标题或规则内容'), { target: { value: '现金流' } });
    expect(onKeywordChange).toHaveBeenCalledWith('现金流');
  });

  it('把选择的分类交给页面', () => {
    const onCategoryChange = vi.fn();
    render(
      <MethodologyFilters
        keyword=""
        category="all"
        onKeywordChange={vi.fn()}
        onCategoryChange={onCategoryChange}
      />,
    );

    fireEvent.click(screen.getByText('估值'));
    expect(onCategoryChange).toHaveBeenCalledWith('valuation');
  });
});
