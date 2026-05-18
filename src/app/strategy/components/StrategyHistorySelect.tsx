'use client';

import React from 'react';
import { Button, Tag, Typography } from 'antd';
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import type { StrategySummary } from '@/types';

const { Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  '规划中': 'blue',
  '执行中': 'green',
  '已暂停': 'orange',
  '已完成': 'default',
};

interface Props {
  strategies: StrategySummary[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function StrategyHistorySelect({ strategies, selectedId, onSelect }: Props) {
  const current = strategies.find((s) => s.id === selectedId);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Button
        size="small"
        type={selectedId ? 'default' : 'primary'}
        icon={<PlusOutlined />}
        onClick={() => onSelect(null)}
      >
        新建策略
      </Button>

      {current && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          <FileTextOutlined style={{ fontSize: 13, color: '#1677ff' }} />
          <Text ellipsis style={{ fontSize: 13, fontWeight: 500 }}>
            {current.title}
          </Text>
          <Tag color={STATUS_COLOR[current.status] || 'default'} style={{ fontSize: 11, lineHeight: '18px', marginLeft: 4 }}>
            {current.status}
          </Tag>
        </div>
      )}

      {!current && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          选择下方策略或新建
        </Text>
      )}
    </div>
  );
}
