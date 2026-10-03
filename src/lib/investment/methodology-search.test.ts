import { describe, expect, it } from 'vitest';
import type { MethodologyItem } from '@/types/life-os';
import { filterMethodologyItems } from './methodology-search';

const items: MethodologyItem[] = [
  {
    id: 'm1',
    user_id: 'u1',
    title: '现金流优先',
    content: '关注 CASH FLOW，而不是只看利润。',
    category: 'valuation',
    status: 'active',
    source_type: 'manual',
    source_ref: null,
    review_status: 'approved',
    created_at: '2026-10-01T03:00:00.000Z',
    updated_at: '2026-10-01T03:00:00.000Z',
  },
  {
    id: 'm2',
    user_id: 'u1',
    title: '分批建仓',
    content: '确认逻辑后仍要控制仓位。',
    category: 'position',
    status: 'active',
    source_type: 'manual',
    source_ref: null,
    review_status: 'pending',
    created_at: '2026-10-01T02:00:00.000Z',
    updated_at: '2026-10-01T02:00:00.000Z',
  },
  {
    id: 'm3',
    user_id: 'u1',
    title: '交易纪律',
    content: '买入前先写退出条件。',
    category: 'discipline',
    status: 'active',
    source_type: 'manual',
    source_ref: null,
    review_status: 'approved',
    created_at: '2026-10-01T01:00:00.000Z',
    updated_at: '2026-10-01T01:00:00.000Z',
  },
];

describe('filterMethodologyItems', () => {
  it('忽略关键词首尾空格和英文大小写', () => {
    expect(filterMethodologyItems(items, { keyword: '  cash flow ', category: 'all' }).map((item) => item.id)).toEqual(['m1']);
  });

  it('组合关键词与分类筛选', () => {
    expect(filterMethodologyItems(items, { keyword: '控制仓位', category: 'position' }).map((item) => item.id)).toEqual(['m2']);
  });

  it('空关键词只应用分类筛选', () => {
    expect(filterMethodologyItems(items, { keyword: '', category: 'valuation' }).map((item) => item.id)).toEqual(['m1']);
  });

  it('无匹配时返回空数组', () => {
    expect(filterMethodologyItems(items, { keyword: '不存在', category: 'all' })).toEqual([]);
  });

  it('未知分类按全部处理并保留原顺序', () => {
    const result = filterMethodologyItems(items, { keyword: '', category: 'unknown' });
    expect(result.map((item) => item.id)).toEqual(['m1', 'm2', 'm3']);
  });
});
