import { describe, expect, it } from 'vitest';
import { buildGoalCategoryCoverage, goalCategoryLabels } from './categories';

describe('annual goal category coverage', () => {
  it('keeps the seven agreed categories and reports covered versus missing', () => {
    expect(Object.values(goalCategoryLabels)).toEqual(['健康与精力', '家庭与育儿', '事业与创造', '财务与投资', '学习与阅读', '兴趣与体验', '人际关系与社会连接']);
    const coverage = buildGoalCategoryCoverage(['health_energy', 'learning_reading']);
    expect(coverage.filter(item => item.covered).map(item => item.value)).toEqual(['health_energy', 'learning_reading']);
    expect(coverage.filter(item => !item.covered)).toHaveLength(5);
  });
});
