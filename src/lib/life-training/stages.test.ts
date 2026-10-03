import { describe, expect, it } from 'vitest';
import { nextExpressionStage } from './stages';

describe('nextExpressionStage', () => {
  it('advances through the first-version route', () => {
    expect(nextExpressionStage('structured')).toBe('video');
    expect(nextExpressionStage('video')).toBe('conversation');
    expect(nextExpressionStage('conversation')).toBe('completed');
    expect(nextExpressionStage('completed')).toBe('completed');
  });
});
