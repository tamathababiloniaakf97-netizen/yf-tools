import { fireEvent, render, screen } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ResearchMaterialLibrary from './ResearchMaterialLibrary';

afterEach(() => vi.unstubAllGlobals());

describe('ResearchMaterialLibrary', () => {
  it('keeps capture lightweight and optional details collapsed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] } as Response)));
    render(<App><ResearchMaterialLibrary /></App>);
    expect(await screen.findByText('研究资料库')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '事实' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /新增资料/ }));
    expect(screen.getByLabelText('标题')).toBeInTheDocument();
    expect(screen.getByLabelText('内容或关键摘录')).toBeInTheDocument();
    expect(screen.getByText('补充信息（可选）')).toBeInTheDocument();
    expect(screen.queryByLabelText('我的理解')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('补充信息（可选）'));
    expect(screen.getByText('写下这条资料对你的判断意味着什么、有什么疑问或后续需要验证的地方；不要重复摘抄原文。')).toBeInTheDocument();
  });
});
