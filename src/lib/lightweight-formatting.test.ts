import { describe, expect, it } from 'vitest';
import {
  applyInlineFormat,
  parseLightweightText,
  stripLightweightFormatting,
  toggleLinePrefix,
} from './lightweight-formatting';

describe('parseLightweightText', () => {
  it('parses the supported block and inline formats', () => {
    expect(parseLightweightText('## 判断\n普通**重点**和==警示==\n- 依据一\n- 依据二\n> 反例')).toEqual([
      { type: 'heading', content: [{ type: 'text', value: '判断' }] },
      { type: 'paragraph', lines: [[
        { type: 'text', value: '普通' },
        { type: 'bold', value: '重点' },
        { type: 'text', value: '和' },
        { type: 'emphasis', value: '警示' },
      ]] },
      { type: 'list', items: [
        [{ type: 'text', value: '依据一' }],
        [{ type: 'text', value: '依据二' }],
      ] },
      { type: 'quote', lines: [[{ type: 'text', value: '反例' }]] },
    ]);
  });

  it('keeps a single return as a visible line and a blank line as a new paragraph', () => {
    expect(parseLightweightText('第一行\n第二行\n\n下一段')).toEqual([
      { type: 'paragraph', lines: [
        [{ type: 'text', value: '第一行' }],
        [{ type: 'text', value: '第二行' }],
      ] },
      { type: 'paragraph', lines: [[{ type: 'text', value: '下一段' }]] },
    ]);
  });

  it('leaves malformed markers and HTML as literal text', () => {
    expect(parseLightweightText('未闭合 **重点\n<script>alert(1)</script>')).toEqual([
      { type: 'paragraph', lines: [
        [{ type: 'text', value: '未闭合 **重点' }],
        [{ type: 'text', value: '<script>alert(1)</script>' }],
      ] },
    ]);
  });

  it('preserves emphasis color when bold and emphasis are combined in either order', () => {
    expect(parseLightweightText('**==重点判断==**\n==**另一条判断**==')).toEqual([
      { type: 'paragraph', lines: [
        [{ type: 'boldEmphasis', value: '重点判断' }],
        [{ type: 'boldEmphasis', value: '另一条判断' }],
      ] },
    ]);
  });
});

describe('format transforms', () => {
  it('wraps a selected range and returns the new selection', () => {
    expect(applyInlineFormat('这里是重点', 3, 5, '**', '重点')).toEqual({
      value: '这里是**重点**',
      selectionStart: 5,
      selectionEnd: 7,
    });
  });

  it('inserts selected placeholder text when there is no selection', () => {
    expect(applyInlineFormat('结论：', 3, 3, '==', '强调内容')).toEqual({
      value: '结论：==强调内容==',
      selectionStart: 5,
      selectionEnd: 9,
    });
  });

  it('toggles a prefix across all selected lines', () => {
    expect(toggleLinePrefix('第一条\n第二条', 0, 7, '- ')).toEqual({
      value: '- 第一条\n- 第二条', selectionStart: 0, selectionEnd: 11,
    });
    expect(toggleLinePrefix('- 第一条\n- 第二条', 0, 11, '- ')).toEqual({
      value: '第一条\n第二条', selectionStart: 0, selectionEnd: 7,
    });
  });

  it('removes supported markers for compact excerpts', () => {
    expect(stripLightweightFormatting('## 判断\n**现金流**与==风险==\n- 分批')).toBe('判断 现金流与风险 分批');
  });
});
