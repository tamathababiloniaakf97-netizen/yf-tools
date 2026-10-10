'use client';

import { SearchOutlined } from '@ant-design/icons';
import { Input, Segmented, Space } from 'antd';
import type { MethodologyCategoryFilter } from '@/lib/investment/methodology-search';

interface MethodologyFiltersProps {
  keyword: string;
  category: MethodologyCategoryFilter;
  onKeywordChange: (value: string) => void;
  onCategoryChange: (value: MethodologyCategoryFilter) => void;
}

const categoryOptions: Array<{ label: string; value: MethodologyCategoryFilter }> = [
  { label: '全部', value: 'all' },
  { label: '选股', value: 'selection' },
  { label: '估值', value: 'valuation' },
  { label: '仓位', value: 'position' },
  { label: '纪律', value: 'discipline' },
  { label: '复盘', value: 'review' },
];

export default function MethodologyFilters({
  keyword,
  category,
  onKeywordChange,
  onCategoryChange,
}: MethodologyFiltersProps) {
  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="搜索标题或规则内容"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
      />
      <Segmented
        block
        options={categoryOptions}
        value={category}
        onChange={(value) => onCategoryChange(value as MethodologyCategoryFilter)}
      />
    </Space>
  );
}
