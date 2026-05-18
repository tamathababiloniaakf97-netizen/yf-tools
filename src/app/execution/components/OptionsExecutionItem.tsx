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

interface OptionItem {
  layer: string;
  tool: string;
  state: string;
  direction: string;
  quantity: number;
  strike: number;
  expiry: string;
  costIncome: number;
  func: string;
  execution?: ExecutionData;
}

interface OptionsExecutionItemProps {
  option: OptionItem;
  isLast: boolean;
  onMarkExecution: (execution: ExecutionData) => void;
}

export default function OptionsExecutionItem({
  option,
  isLast,
  onMarkExecution,
}: OptionsExecutionItemProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const isExecuted = option.execution?.status === 'executed';

  const label = `${option.tool} $${option.strike}`;
  const planStr = `${option.func}`;

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isExecuted ? (
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            ) : (
              <ClockCircleOutlined style={{ color: '#d9d9d9', fontSize: 16 }} />
            )}
            <Text strong style={{ fontSize: 13 }}>
              {label}
            </Text>
            <Tag color={isExecuted ? 'success' : 'default'} style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}>
              {isExecuted ? '已开仓' : '待开仓'}
            </Tag>
          </div>
          <Text style={{ fontSize: 12, color: '#1677ff', cursor: 'pointer' }}>
            {isExecuted ? '修改' : '标记执行'}
          </Text>
        </div>

        <div style={{ marginTop: 4, paddingLeft: 24 }}>
          <Text style={{ fontSize: 13 }}>
            计划: {option.direction} {option.quantity}张
            <Tag style={{ marginLeft: 6, fontSize: 10, lineHeight: '16px' }}>{option.layer}</Tag>
          </Text>
          <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
            {planStr}
          </Text>
          {option.costIncome !== 0 && (
            <Text
              style={{
                fontSize: 11,
                marginLeft: 8,
                color: option.costIncome > 0 ? '#52c41a' : '#ff4d4f',
              }}
            >
              {option.costIncome > 0 ? '收入' : '成本'}: ${Math.abs(option.costIncome)}
            </Text>
          )}
          {option.expiry && (
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
              到期: {option.expiry}
            </Text>
          )}
        </div>

        {isExecuted && (
          <div style={{ marginTop: 3, paddingLeft: 24 }}>
            <Text style={{ fontSize: 12, color: '#52c41a' }}>
              实际开仓: {option.execution?.actualQuantity ?? option.quantity}张
              {option.execution?.actualPrice != null && (
                <span> @ ${option.execution.actualPrice}</span>
              )}
            </Text>
            {option.execution?.executedAt && (
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                {option.execution.executedAt}
              </Text>
            )}
            {option.execution?.note && (
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 8, fontStyle: 'italic' }}>
                {option.execution.note}
              </Text>
            )}
          </div>
        )}
      </div>

      <MarkExecutionModal
        open={modalOpen}
        title={`标记执行 — ${label}`}
        planPrice={option.strike}
        planQuantity={option.quantity}
        initialData={option.execution}
        onOk={(data) => {
          onMarkExecution(data);
          setModalOpen(false);
        }}
        onCancel={() => setModalOpen(false)}
      />
    </>
  );
}
