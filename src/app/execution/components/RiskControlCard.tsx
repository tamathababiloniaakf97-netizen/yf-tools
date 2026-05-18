'use client';

import React from 'react';
import { Typography, Tag } from 'antd';

const { Text } = Typography;

interface RiskControlData {
  cashMin?: string;
  singleMax?: string;
  hedgeRatio?: string;
  positiveCarry?: boolean;
  // calculated checks
  singlePositionOk?: boolean;
  hedgeOk?: boolean;
  positiveCarryOk?: boolean;
  cashReserveOk?: boolean;
  singlePositionPercent?: number;
}

interface RiskControlCardProps {
  data: RiskControlData;
}

export default function RiskControlCard({ data }: RiskControlCardProps) {
  const items = [
    {
      label: '单标占比',
      value: data.singlePositionPercent != null ? `${data.singlePositionPercent}%` : '—',
      limit: data.singleMax || '≤20%',
      ok: data.singlePositionOk,
    },
    {
      label: '对冲',
      value: data.hedgeRatio || '—',
      limit: '≥2x',
      ok: data.hedgeOk,
    },
    {
      label: '正Carry',
      value: data.positiveCarry != null ? (data.positiveCarry ? '是' : '否') : '—',
      limit: '净Theta>0',
      ok: data.positiveCarryOk,
    },
    {
      label: '现金底线',
      value: data.cashMin || '—',
      limit: '—',
      ok: data.cashReserveOk,
    },
  ];

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 6,
        border: '1px solid #f0f0f0',
        padding: '10px 14px',
      }}
    >
      <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
        风控
      </Text>
      <div className="yf-risk-grid">
        {items.map((item) => (
          <div key={item.label} className="yf-risk-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>{item.label}</Text>
              <Text style={{ fontSize: 12, fontWeight: 500 }}>{item.value}</Text>
            </div>
            {item.ok != null && (
              <Tag
                color={item.ok ? 'success' : 'error'}
                style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}
              >
                {item.ok ? '✓' : '✗'}
              </Tag>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
