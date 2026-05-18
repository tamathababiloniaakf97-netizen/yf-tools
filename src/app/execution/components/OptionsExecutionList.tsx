'use client';

import React from 'react';
import { Collapse, Tag } from 'antd';
import OptionsExecutionItem from './OptionsExecutionItem';

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

interface OptionsExecutionListProps {
  options: OptionItem[];
  netTheta: number | null;
  onMarkExecution: (index: number, execution: ExecutionData) => void;
}

export default function OptionsExecutionList({
  options,
  netTheta,
  onMarkExecution,
}: OptionsExecutionListProps) {
  if (!options || options.length === 0) {
    return (
      <Collapse
        size="small"
        items={[{
          key: 'options',
          label: (
            <span style={{ fontSize: 13, fontWeight: 500, color: '#999' }}>
              期权计划  0 条
            </span>
          ),
          children: (
            <div style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: '12px 0' }}>
              该策略未配置期权
            </div>
          ),
        }]}
      />
    );
  }

  const executedCount = options.filter((o) => o.execution?.status === 'executed').length;

  return (
    <Collapse
      size="small"
      defaultActiveKey={[]}
      items={[{
        key: 'options',
        label: (
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            期权计划
            <Tag
              color={executedCount > 0 ? 'blue' : 'default'}
              style={{ marginLeft: 8, fontSize: 11, lineHeight: '18px' }}
            >
              {executedCount}/{options.length} 条
            </Tag>
          </span>
        ),
        children: (
          <div>
            {options.map((opt, i) => (
              <OptionsExecutionItem
                key={i}
                option={opt}
                isLast={i === options.length - 1}
                onMarkExecution={(data) => onMarkExecution(i, data)}
              />
            ))}
            {netTheta != null && (
              <div
                style={{
                  padding: '8px 12px',
                  background: '#fafafa',
                  borderTop: '1px solid #f0f0f0',
                  fontSize: 12,
                  color: netTheta > 0 ? '#52c41a' : '#ff4d4f',
                  fontWeight: 500,
                }}
              >
                净Theta: {netTheta > 0 ? '+' : ''}${netTheta}/月
              </div>
            )}
          </div>
        ),
      }]}
    />
  );
}
