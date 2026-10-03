import { describe, expect, it } from 'vitest';
import { validateTrainingResult } from './validation';

const base = {
  task_id: '11111111-1111-4111-8111-111111111111',
  stage: 'structured', record_type: 'practice', topic: '市场大跌',
  intended_message: '先管理仓位，再判断涨跌', decision: 'continue',
  evidence: [{ summary: '结论太晚', quote: '直到后半段才谈仓位', time_range: '01:10-01:25' }],
  next_action: '前15秒先说观点', artifact_ref: 'sha256:abc',
  source_type: 'codex', source_ref: 'report:abc', review_status: 'approved',
} as const;

describe('validateTrainingResult', () => {
  it('forces Codex results to pending', () => {
    expect(validateTrainingResult(base)).toMatchObject({ ok: true, value: { review_status: 'pending' } });
  });

  it('rejects more than two evidence items', () => {
    expect(validateTrainingResult({ ...base, evidence: [base.evidence[0], base.evidence[0], base.evidence[0]] }).ok).toBe(false);
  });

  it('requires a source reference for Codex results', () => {
    expect(validateTrainingResult({ ...base, source_ref: null }).ok).toBe(false);
  });

  it('rejects pass decisions for ordinary practice', () => {
    expect(validateTrainingResult({ ...base, decision: 'pass' }).ok).toBe(false);
  });
});
