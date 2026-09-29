import { describe, expect, it } from 'vitest';
import { taskPrefillFromSearchParams } from './task-prefill';

describe('taskPrefillFromSearchParams', () => {
  it('creates an unsaved pending task from approved URL fields', () => {
    const result = taskPrefillFromSearchParams(new URLSearchParams('new=1&asset_name=%E8%85%BE%E8%AE%AF&task_type=validation&title=%E9%AA%8C%E8%AF%81%E5%B9%BF%E5%91%8A%E5%A2%9E%E9%95%BF&condition_note=%E4%B8%8B%E5%AD%A3%E8%B4%A2%E6%8A%A5%E7%A1%AE%E8%AE%A4'));
    expect(result).toEqual({ asset_name: '腾讯', task_type: 'validation', title: '验证广告增长', condition_note: '下季财报确认', status: 'pending' });
  });

  it('returns null unless a new task was explicitly requested', () => {
    expect(taskPrefillFromSearchParams(new URLSearchParams('asset_name=腾讯'))).toBeNull();
    expect(taskPrefillFromSearchParams(new URLSearchParams('new=1&task_type=bad'))?.task_type).toBe('research');
  });
});
