'use client';

import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { DollarOutlined, FundOutlined, PercentageOutlined, RiseOutlined, WalletOutlined } from '@ant-design/icons';
import type { AccountSummary } from '@/types';

interface Props { summary: AccountSummary | null; loading: boolean; }

export default function AccountSummaryCards({ summary, loading }: Props) {
  if (!summary) return null;
  const configured = summary.openingConfigured === true;
  const cashRatio = summary.totalAssets !== 0 ? summary.cashBalance / summary.totalAssets * 100 : null;
  const visible = (value: number | null | undefined) => configured && value != null ? value : '—';
  const precision = (value: number | null | undefined) => configured && value != null ? 2 : undefined;
  const cards = [
    { title: '账户净资产', value: summary.totalAssets, precision: 2, prefix: '$', icon: <WalletOutlined style={{ fontSize: 24, color: '#1677ff' }} /> },
    { title: summary.cashBalance < 0 ? '融资余额/现金占比' : '现金余额/现金占比', value: Math.abs(summary.cashBalance), precision: 2, prefix: '$', suffix: cashRatio == null ? undefined : `${cashRatio.toFixed(1)}%`, icon: <DollarOutlined style={{ fontSize: 24, color: summary.cashBalance < 0 ? '#fa8c16' : '#52c41a' }} /> },
    { title: '净入金', value: visible(summary.netContributions), precision: precision(summary.netContributions), prefix: configured ? '$' : undefined, icon: <FundOutlined style={{ fontSize: 24, color: '#722ed1' }} /> },
    { title: '累计盈亏', value: visible(summary.cumulativePnl), precision: precision(summary.cumulativePnl), prefix: configured ? '$' : undefined, icon: <RiseOutlined style={{ fontSize: 24, color: (summary.cumulativePnl ?? 0) >= 0 ? '#f5222d' : '#52c41a' }} /> },
    { title: '资金收益率(XIRR)', value: visible(summary.xirr), precision: precision(summary.xirr), suffix: configured && summary.xirr != null ? '%' : undefined, icon: <PercentageOutlined style={{ fontSize: 24, color: '#13c2c2' }} /> },
  ];
  return <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
    {cards.map(card => <Col xs={24} sm={12} md={8} lg={4} key={card.title}>
      <Card size="small" loading={loading} hoverable><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {card.icon}<Statistic title={card.title} value={card.value} precision={card.precision} prefix={card.prefix} suffix={card.suffix} styles={{ content: { fontSize: 18 } }} />
      </div></Card>
    </Col>)}
  </Row>;
}
