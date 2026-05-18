'use client';

import React from 'react';
import { Select, Typography } from 'antd';

const { Text } = Typography;

interface StrategyOption {
  id: string;
  title: string;
  status: string;
}

interface ColumnSelectorProps {
  strategies: StrategyOption[];
  selectedIds: (string | null)[];
  onSelect: (columnIndex: number, strategyId: string | null) => void;
}

export default function ColumnSelector({
  strategies,
  selectedIds,
  onSelect,
}: ColumnSelectorProps) {
  const options = [
    { value: '', label: '— 空 —' },
    ...strategies.map((s) => ({
      value: s.id,
      label: `${s.title} (${s.status})`,
      disabled: selectedIds.includes(s.id),
    })),
  ];

  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
      {[0, 1, 2].map((colIndex) => (
        <div key={colIndex} style={{ flex: '1 1 0', minWidth: 200 }}>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
            列{colIndex + 1}
          </Text>
          <Select
            style={{ width: '100%' }}
            size="small"
            value={selectedIds[colIndex] || ''}
            onChange={(val) => onSelect(colIndex, val || null)}
            options={options}
            placeholder="选择策略"
            showSearch
            optionFilterProp="label"
            allowClear
          />
        </div>
      ))}
    </div>
  );
}
