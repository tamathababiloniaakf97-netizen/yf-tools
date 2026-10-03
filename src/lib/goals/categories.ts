import type { GoalCategory } from '@/types/life-os';
import { goalCategories } from '@/types/life-os';

export const goalCategoryLabels: Record<GoalCategory, string> = {
  health_energy: '健康与精力',
  family_parenting: '家庭与育儿',
  career_creation: '事业与创造',
  finance_investment: '财务与投资',
  learning_reading: '学习与阅读',
  interests_experiences: '兴趣与体验',
  relationships_social: '人际关系与社会连接',
};

export function buildGoalCategoryCoverage(covered: GoalCategory[]) {
  const coveredSet = new Set(covered);
  return goalCategories.map(value => ({ value, label: goalCategoryLabels[value], covered: coveredSet.has(value) }));
}
