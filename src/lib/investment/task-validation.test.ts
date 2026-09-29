import { describe, expect, it } from 'vitest';
import { validateInvestmentTaskInput } from './task-validation';

describe('investment task validation', () => {
  it('accepts an optional asset and trims manual input', () => {
    expect(validateInvestmentTaskInput({ task_type: 'research', title: ' 研究广告业务 ', asset_name: ' ', condition_note: ' 检查增长 ', notes: ' 季报 ' })).toMatchObject({
      ok: true, value: { title: '研究广告业务', asset_name: '', condition_note: '检查增长', notes: '季报', status: 'pending', source_type: 'manual', review_status: 'approved' },
    });
  });
  it('rejects blank titles and invalid type or status', () => {
    expect(validateInvestmentTaskInput({ task_type: 'research', title: ' ' }).ok).toBe(false);
    expect(validateInvestmentTaskInput({ task_type: 'bad' as 'research', title: '任务' }).ok).toBe(false);
    expect(validateInvestmentTaskInput({ task_type: 'research', title: '任务', status: 'bad' as 'pending' }).ok).toBe(false);
  });
  it('requires automation provenance', () => {
    expect(validateInvestmentTaskInput({ task_type: 'validation', title: '等待验证', source_type: 'automation' }).ok).toBe(false);
  });
  it('sets completion time only for completed tasks', () => {
    const completed = validateInvestmentTaskInput({ task_type: 'other', title: '已做', status: 'completed' });
    expect(completed).toMatchObject({ ok: true, value: { status: 'completed' } });
    if (completed.ok) expect(completed.value.completed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(validateInvestmentTaskInput({ task_type: 'other', title: '取消', status: 'cancelled', completed_at: '2026-09-29T00:00:00Z' })).toMatchObject({ ok: true, value: { completed_at: null } });
  });
});
