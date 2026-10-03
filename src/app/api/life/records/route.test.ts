import { describe, expect, it } from 'vitest';
import { validateLifeRecordInput } from '@/lib/life-reinforcement/validation';

describe('life record route contract', () => {
  it('keeps the selected stage as a text snapshot', () => {
    const result = validateLifeRecordInput({
      trained_on: '2026-10-01', activity: '完成一次练习', stage_name: '阶段二',
    });
    expect(result).toMatchObject({ ok: true, value: { stage_name: '阶段二' } });
  });
});
