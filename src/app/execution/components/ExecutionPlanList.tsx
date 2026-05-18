'use client';

import React from 'react';
import { Collapse, Tag } from 'antd';
import ExecutionTierItem from './ExecutionTierItem';

interface ExecutionData {
  status: 'pending' | 'executed';
  actualPrice?: number;
  actualQuantity?: number;
  executedAt?: string;
  note?: string;
}

interface TierData {
  tier: number;
  price: number;
  shares: number;
  ratio: number;
  cumulativeRatio: number;
  model: string;
  triggerCondition: string;
  declineFromRef: number;
  execution?: ExecutionData;
}

interface ExecutionPlanListProps {
  title: string;
  tiers: TierData[];
  currentPrice: number | null;
  onMarkExecution: (tierIndex: number, execution: ExecutionData) => void;
}

export default function ExecutionPlanList({
  title,
  tiers,
  currentPrice,
  onMarkExecution,
}: ExecutionPlanListProps) {
  if (!tiers || tiers.length === 0) {
    return (
      <Collapse
        size="small"
        items={[{
          key: title,
          label: (
            <span style={{ fontSize: 13, fontWeight: 500, color: '#999' }}>
              {title}  0 档
            </span>
          ),
          children: (
            <div style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: '12px 0' }}>
              未配置
            </div>
          ),
        }]}
      />
    );
  }

  const executedCount = tiers.filter((t) => t.execution?.status === 'executed').length;
  const avgCost =
    tiers.length > 0
      ? tiers.reduce((sum, t) => sum + t.price * t.shares, 0) /
        tiers.reduce((sum, t) => sum + t.shares, 0)
      : null;
  const model = tiers[0]?.model || '';

  return (
    <Collapse
      size="small"
      defaultActiveKey={[]}
      items={[{
        key: title,
        label: (
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            {title}
            <Tag
              color={executedCount > 0 ? 'blue' : 'default'}
              style={{ marginLeft: 8, fontSize: 11, lineHeight: '18px' }}
            >
              {executedCount}/{tiers.length} 档
            </Tag>
          </span>
        ),
        children: (
          <div>
            {tiers.map((tier, i) => (
              <ExecutionTierItem
                key={i}
                tier={tier}
                planType={title}
                currentPrice={currentPrice}
                isLast={i === tiers.length - 1}
                onMarkExecution={(data) => onMarkExecution(i, data)}
              />
            ))}
            <div
              style={{
                padding: '8px 12px',
                background: '#fafafa',
                borderTop: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: '#666',
              }}
            >
              <span>模型: {model || '—'}</span>
              {avgCost != null && <span>均摊价格: ${avgCost.toFixed(2)}</span>}
            </div>
          </div>
        ),
      }]}
    />
  );
}
