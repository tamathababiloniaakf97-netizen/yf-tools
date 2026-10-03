import { describe, expect, it } from 'vitest';
import { validateLifeProjectInput, validateLifeRecordInput } from './validation';

describe('life reinforcement validation', () => {
  it('normalizes a valid project and removes blank stages', () => {
    expect(validateLifeProjectInput({
      name: '  表达训练  ',
      long_term_goal: '  说清重点  ',
      practical_method: '  每周练习  ',
      stages: [' 基础 ', '', ' 实战 '],
      is_active: true,
    })).toEqual({
      ok: true,
      value: {
        name: '表达训练',
        long_term_goal: '说清重点',
        practical_method: '每周练习',
        stages: ['基础', '实战'],
        is_active: true,
      },
    });
  });

  it('requires a project name', () => {
    const result = validateLifeProjectInput({ name: '   ', stages: [] });
    expect(result.ok).toBe(false);
  });

  it('normalizes a valid training record', () => {
    expect(validateLifeRecordInput({
      trained_on: '2026-10-01',
      stage_name: ' 场景穿搭 ',
      session_goal: ' 试一套通勤搭配 ',
      activity: ' 比较了三套衣服 ',
      result_notes: ' 第二套更协调 ',
    })).toEqual({
      ok: true,
      value: {
        trained_on: '2026-10-01',
        stage_name: '场景穿搭',
        session_goal: '试一套通勤搭配',
        activity: '比较了三套衣服',
        result_notes: '第二套更协调',
      },
    });
  });

  it('requires a real date and an activity', () => {
    const result = validateLifeRecordInput({ trained_on: '2026-02-30', activity: ' ' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toEqual(expect.arrayContaining(['训练日期无效', '请填写做了什么']));
  });
});
