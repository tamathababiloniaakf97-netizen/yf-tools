import { describe, expect, it } from 'vitest';
import { buildCognitionOverview, normalizeCognitionJournalInput, normalizeCognitionMethodInput } from './records';

describe('cognition records', () => {
  it('normalizes a journal without forcing optional reflection prompts', () => {
    const result = normalizeCognitionJournalInput({
      title: '  我过早推断了对方的动机  ', occurred_on: '2026-10-07', content: '  一次沟通误判  ',
      category_id: 'cat-1', tags: ['沟通', '沟通', ' 关系 '], error_tags: ['动机推断', '动机推断'],
    });
    expect(result).toEqual({ ok: true, value: expect.objectContaining({
      title: '我过早推断了对方的动机', content: '一次沟通误判', tags: ['沟通', '关系'],
      error_tags: ['动机推断'], facts: '', next_action: '', method_id: null,
    }) });
  });

  it('requires core journal fields', () => {
    expect(normalizeCognitionJournalInput({ title: '', content: '', occurred_on: '', category_id: '' })).toEqual({
      ok: false, errors: ['请填写标题', '请选择日期', '请选择分类', '请填写正文'],
    });
  });

  it('keeps a method lightweight while cleaning optional boundaries', () => {
    const result = normalizeCognitionMethodInput({ title: ' 先区分事实与解释 ', category_id: 'cat-1', content: ' 核心原则 ', exceptions: ' 信息不足时暂缓 ' });
    expect(result).toEqual({ ok: true, value: expect.objectContaining({
      title: '先区分事实与解释', content: '核心原则', exceptions: '信息不足时暂缓', status: 'unverified',
    }) });
  });

  it('only reports explicit repeated errors from the last 30 days', () => {
    const journals = [
      { id: '1', occurred_on: '2026-10-07', error_tags: ['动机推断'], method_id: null },
      { id: '2', occurred_on: '2026-09-20', error_tags: ['动机推断', '忽略基准率'], method_id: null },
      { id: '3', occurred_on: '2026-08-01', error_tags: ['忽略基准率'], method_id: null },
    ];
    const methods = [{ id: 'm1', status: 'unverified' as const }];
    expect(buildCognitionOverview(journals, methods, new Date('2026-10-07T12:00:00+08:00'))).toEqual({
      unprocessedJournalIds: ['1', '2'], unverifiedMethodIds: ['m1'], repeatedErrors: [{ label: '动机推断', count: 2 }],
    });
  });
});
