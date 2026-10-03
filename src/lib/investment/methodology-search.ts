import type { MethodologyCategory, MethodologyItem } from '@/types/life-os';

const methodologyCategories: MethodologyCategory[] = ['selection', 'valuation', 'position', 'discipline', 'review'];

export type MethodologyCategoryFilter = MethodologyCategory | 'all';

export interface MethodologySearchInput {
  keyword: string;
  category: string;
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase('zh-CN');
}

function isMethodologyCategory(value: string): value is MethodologyCategory {
  return methodologyCategories.includes(value as MethodologyCategory);
}

export function methodologySearchText(item: MethodologyItem) {
  return normalizeSearchText(`${item.title}\n${item.content}`);
}

export function filterMethodologyItems(items: MethodologyItem[], input: MethodologySearchInput) {
  const keyword = normalizeSearchText(input.keyword);
  const category = isMethodologyCategory(input.category) ? input.category : 'all';

  return items.filter((item) => {
    const matchesKeyword = keyword === '' || methodologySearchText(item).includes(keyword);
    const matchesCategory = category === 'all' || item.category === category;
    return matchesKeyword && matchesCategory;
  });
}
