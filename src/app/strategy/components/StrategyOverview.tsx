'use client';

import React from 'react';
import { Card, Input, Select, Tag, Descriptions, Typography, InputNumber } from 'antd';
const { Text } = Typography;
import type { StrategyStatus } from '@/types';

interface Props {
  title: string;
  type: string;
  target: string;
  status: StrategyStatus;
  currentPrice?: string;
  allocPercent?: string;
  referenceHigh?: number;
  onReferenceHighChange?: (v: number) => void;
  currentPriceNum?: number;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: StrategyStatus) => void;
}

const statusColorMap: Record<string, string> = {
  '规划中': 'blue',
  '执行中': 'processing',
  '已暂停': 'warning',
  '已完成': 'success',
};

export default function StrategyOverview({ title, type, target, status, currentPrice, allocPercent, referenceHigh, onReferenceHighChange, currentPriceNum, onTitleChange, onStatusChange }: Props) {
  const declineFromHigh = referenceHigh && currentPriceNum ? ((referenceHigh - currentPriceNum) / referenceHigh) * 100 : null;

  return (
    <Card size="small" title="策略概览" style={{ marginBottom: 12 }}>
      <Descriptions size="small" column={2} labelStyle={{ width: 80 }}>
        <Descriptions.Item label="策略标题">
          <Input
            size="small"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            style={{ width: 200 }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="执行状态">
          <Select
            size="small"
            value={status}
            style={{ width: 120 }}
            onChange={(v) => onStatusChange(v as StrategyStatus)}
            options={[
              { value: '规划中', label: '规划中' },
              { value: '执行中', label: '执行中' },
              { value: '已暂停', label: '已暂停' },
              { value: '已完成', label: '已完成' },
            ]}
          />
        </Descriptions.Item>
        <Descriptions.Item label="策略类型">
          <Tag>{type || '未分类'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="标的">
          <Text strong>{target || '-'}</Text>
        </Descriptions.Item>
        {currentPrice && (
          <Descriptions.Item label="当前价格">
            <Text style={{ fontSize: 13 }}>{currentPrice}</Text>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="参考最高价">
          <InputNumber
            size="small"
            min={0}
            value={referenceHigh || undefined}
            onChange={(v) => onReferenceHighChange?.(v || 0)}
            placeholder="如 500"
            style={{ width: 110 }}
            prefix="$"
          />
        </Descriptions.Item>
        <Descriptions.Item label="距高点跌幅">
          {declineFromHigh !== null ? (
            <Text style={{ fontSize: 13, color: '#ff4d4f', fontWeight: 600 }}>
              -{declineFromHigh.toFixed(1)}%
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>{referenceHigh ? '需在建仓方案填写现价' : '需填写参考最高价'}</Text>
          )}
        </Descriptions.Item>
        {allocPercent && (
          <Descriptions.Item label="仓位占比">{allocPercent}</Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );
}
