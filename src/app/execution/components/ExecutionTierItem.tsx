'use client';

import React, { useState } from 'react';
import { Typography, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import MarkExecutionModal from './MarkExecutionModal';

const { Text } = Typography;

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

interface ExecutionTierItemProps {
  tier: TierData;
  planType: string;
  currentPrice: number | null;
  isLast: boolean;
  onMarkExecution: (execution: ExecutionData) => void;
}

export default function ExecutionTierItem({
  tier,
  planType,
  currentPrice,
  isLast,
  onMarkExecution,
}: ExecutionTierItemProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const isExecuted = tier.execution?.status === 'executed';

  const distanceFromCurrent =
    currentPrice != null && tier.price
      ? ((currentPrice - tier.price) / tier.price * 100)
      : null;

  const distanceLabel =
    distanceFromCurrent != null
      ? distanceFromCurrent > 0
        ? `距现价↑${Math.abs(distanceFromCurrent).toFixed(1)}%`
        : `距现价↓${Math.abs(distanceFromCurrent).toFixed(1)}%`
      : null;

  return (
    <>
      <div
        style={{
          padding: '10px 12px',
          borderBottom: isLast ? 'none' : '1px solid #f0f0f0',
          background: isExecuted ? '#f6ffed' : '#fff',
          cursor: 'pointer',
        }}
        onClick={() => setModalOpen(true)}
      >
        {/* 执行状态 + 档位信息 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isExecuted ? (
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            ) : (
              <ClockCircleOutlined style={{ color: '#d9d9d9', fontSize: 16 }} />
            )}
            <Text strong style={{ fontSize: 13 }}>
              档{tier.tier}
            </Text>
            <Tag color={isExecuted ? 'success' : 'default'} style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}>
              {isExecuted ? '已执行' : '待执行'}
            </Tag>
          </div>
          <Text style={{ fontSize: 12, color: '#1677ff', cursor: 'pointer' }}>
            {isExecuted ? '修改' : '标记执行'}
          </Text>
        </div>

        {/* 计划价格和数量 */}
        <div style={{ marginTop: 4, paddingLeft: 24 }}>
          <Text style={{ fontSize: 13 }}>
            计划: <Text strong>${tier.price}</Text> × {tier.shares}股
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
              占比 {tier.ratio}% / 累计 {tier.cumulativeRatio}%
            </Text>
          </Text>
          {distanceLabel && (
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
              {distanceLabel}
            </Text>
          )}
        </div>

        {/* 实际执行信息 */}
        {isExecuted && (
          <div style={{ marginTop: 3, paddingLeft: 24 }}>
            {tier.execution?.actualPrice != null || tier.execution?.actualQuantity != null ? (
              <Text style={{ fontSize: 12, color: '#52c41a' }}>
                实际: ${tier.execution?.actualPrice ?? tier.price} × {tier.execution?.actualQuantity ?? tier.shares}股
                {tier.execution?.actualPrice != null && tier.execution?.actualPrice !== tier.price && (
                  <Text style={{ fontSize: 11, marginLeft: 4, color: '#8c8c8c' }}>
                    偏离 {((tier.execution.actualPrice - tier.price) / tier.price * 100).toFixed(1)}%
                  </Text>
                )}
              </Text>
            ) : (
              <Text style={{ fontSize: 12, color: '#52c41a' }}>已执行</Text>
            )}
            {tier.execution?.executedAt && (
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                {tier.execution.executedAt}
              </Text>
            )}
            {tier.execution?.note && (
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 8, fontStyle: 'italic' }}>
                {tier.execution.note}
              </Text>
            )}
          </div>
        )}
      </div>

      <MarkExecutionModal
        open={modalOpen}
        title={`标记执行 — ${planType}档${tier.tier}`}
        planPrice={tier.price}
        planQuantity={tier.shares}
        initialData={tier.execution}
        onOk={(data) => {
          onMarkExecution(data);
          setModalOpen(false);
        }}
        onCancel={() => setModalOpen(false)}
      />
    </>
  );
}
