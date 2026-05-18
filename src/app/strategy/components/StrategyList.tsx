'use client';

import React, { useMemo, useState } from 'react';
import { Input, List, Typography, Tag, Popconfirm } from 'antd';
import { SearchOutlined, FileTextOutlined, DeleteOutlined } from '@ant-design/icons';
import type { StrategySummary } from '@/types';

const { Text } = Typography;

interface Props {
  strategies: StrategySummary[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  '规划中': 'blue',
  '执行中': 'green',
  '已暂停': 'orange',
  '已完成': 'default',
};

export default function StrategyList({ strategies, selectedId, onSelect, onDelete }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return strategies;
    const kw = search.toLowerCase();
    return strategies.filter(
      (s) =>
        s.title.toLowerCase().includes(kw) ||
        s.status.includes(kw)
    );
  }, [strategies, search]);

  if (strategies.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <Text strong style={{ fontSize: 13 }}>
          已保存策略 ({strategies.length})
        </Text>
      </div>

      <Input
        size="small"
        placeholder="搜索策略..."
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 8 }}
        allowClear
      />

      <List
        size="small"
        dataSource={filtered}
        style={{
          maxHeight: 260,
          overflowY: 'auto',
          border: '1px solid #f0f0f0',
          borderRadius: 6,
        }}
        locale={{ emptyText: '无匹配策略' }}
        renderItem={(s) => {
          const isActive = s.id === selectedId;
          return (
            <List.Item
              key={s.id}
              onClick={() => onSelect(s.id)}
              style={{
                cursor: 'pointer',
                padding: '8px 12px',
                background: isActive ? '#e6f4ff' : '#fff',
                borderLeft: isActive ? '3px solid #1677ff' : '3px solid transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = '#fafafa';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = '#fff';
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileTextOutlined style={{ fontSize: 12, color: isActive ? '#1677ff' : '#999' }} />
                  <Text
                    ellipsis
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#1677ff' : '#333',
                    }}
                  >
                    {s.title}
                  </Text>
                </div>
                <div style={{ marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Tag color={STATUS_COLOR[s.status] || 'default'} style={{ fontSize: 11, lineHeight: '18px' }}>
                    {s.status}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {s.updated_at ? new Date(s.updated_at).toLocaleDateString('zh-CN') : ''}
                  </Text>
                </div>
              </div>
              <Popconfirm
                title="确定删除此策略？"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  onDelete(s.id);
                }}
                onCancel={(e) => e?.stopPropagation()}
              >
                <DeleteOutlined
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: 13, color: '#bbb', cursor: 'pointer' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ff4d4f')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#bbb')}
                />
              </Popconfirm>
            </List.Item>
          );
        }}
      />
    </div>
  );
}
