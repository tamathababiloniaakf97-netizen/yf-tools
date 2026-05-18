'use client';

import React from 'react';
import { Typography, Tag } from 'antd';

const { Text } = Typography;

interface SymbolCardProps {
  ticker: string;
  currentPrice: number | null;
  costPerShare: number | null;
  pnlPercent: number | null;
  referenceHigh: number | null;
  status: string;
}

export default function SymbolCard({
  ticker,
  currentPrice,
  costPerShare,
  pnlPercent,
  referenceHigh,
  status,
}: SymbolCardProps) {
  const declineFromHigh =
    referenceHigh && currentPrice
      ? ((referenceHigh - currentPrice) / referenceHigh * 100).toFixed(1)
      : null;

  const statusColor =
    status === '执行中' ? 'blue' :
    status === '已暂停' ? 'orange' :
    status === '已完成' ? 'green' : 'default';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f6f9fc 0%, #eef3f8 100%)',
        borderRadius: 8,
        padding: '12px 14px',
        border: '1px solid #e8e8e8',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text strong style={{ fontSize: 16, letterSpacing: 0.5 }}>
          {ticker}
        </Text>
        <Tag color={statusColor} style={{ margin: 0 }}>{status}</Tag>
      </div>

      <div className="yf-symbol-info-grid">
        {currentPrice != null && (
          <div className="yf-symbol-info-item">
            <Text type="secondary" style={{ fontSize: 11 }}>现价</Text>
            <Text strong style={{ fontSize: 18, lineHeight: 1.3 }}>${currentPrice.toFixed(2)}</Text>
          </div>
        )}
        {costPerShare != null && (
          <div className="yf-symbol-info-item">
            <Text type="secondary" style={{ fontSize: 11 }}>成本</Text>
            <Text style={{ fontSize: 14 }}>${costPerShare.toFixed(2)}</Text>
          </div>
        )}
        {pnlPercent != null && (
          <div className="yf-symbol-info-item">
            <Text type="secondary" style={{ fontSize: 11 }}>盈亏</Text>
            <Text
              style={{
                fontSize: 14,
                color: pnlPercent >= 0 ? '#52c41a' : '#ff4d4f',
                fontWeight: 500,
              }}
            >
              {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
            </Text>
          </div>
        )}
        {referenceHigh != null && declineFromHigh != null && (
          <div className="yf-symbol-info-item">
            <Text type="secondary" style={{ fontSize: 11 }}>参考高价</Text>
            <Text style={{ fontSize: 14 }}>
              ${referenceHigh.toFixed(2)}
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                ↓{declineFromHigh}%
              </Text>
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
