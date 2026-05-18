'use client';

import React, { useMemo } from 'react';
import { Card, Col, Row, Statistic, Tag } from 'antd';
import {
  WalletOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  FundOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import type { AccountSummary, TickerStyle } from '@/types';

interface Props {
  summary: AccountSummary | null;
  loading: boolean;
  strategyReturnPercent?: number | null;
  accountReturnPercent?: number | null;
}

const styleConfig: Record<TickerStyle, { label: string; color: string }> = {
  offensive: { label: '进攻', color: 'red' },
  balanced: { label: '平衡', color: 'blue' },
  defensive: { label: '防守', color: 'green' },
};

export default function AccountSummaryCards({ summary, loading, strategyReturnPercent, accountReturnPercent }: Props) {
  const styleAllocation = useMemo(() => {
    if (!summary || summary.marketValue <= 0) return null;
    const map: Record<string, { value: number; color: string }> = {};
    for (const p of summary.positions) {
      const s = p.ticker.style;
      if (!s) continue;
      const cfg = styleConfig[s];
      if (!map[s]) map[s] = { value: 0, color: cfg.color };
      map[s].value += p.marketValue;
    }
    const entries = Object.entries(map)
      .map(([k, v]) => ({ label: styleConfig[k as TickerStyle].label, pct: (v.value / summary.marketValue) * 100, color: v.color }))
      .sort((a, b) => b.pct - a.pct);
    return entries.length > 0 ? entries : null;
  }, [summary]);

  if (!summary) return null;

  const cards = [
    {
      title: '总资产',
      value: summary.totalAssets,
      precision: 2,
      prefix: '$',
      icon: <WalletOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
      color: '#1677ff',
    },
    {
      title: '现金余额/占比',
      value: summary.cashBalance,
      precision: 2,
      prefix: '$',
      suffix: summary.totalAssets > 0
        ? `${((summary.cashBalance / summary.totalAssets) * 100).toFixed(1)}%`
        : undefined,
      icon: <DollarOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      color: '#52c41a',
    },
    {
      title: '持仓市值/占比',
      value: summary.marketValue,
      precision: 2,
      prefix: '$',
      suffix: summary.totalAssets > 0
        ? `${((summary.marketValue / summary.totalAssets) * 100).toFixed(1)}%`
        : undefined,
      icon: <FundOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      color: '#722ed1',
    },
    {
      title: '总投入',
      value: summary.totalInvested,
      precision: 2,
      prefix: '$',
      icon: <DollarOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
      color: '#fa8c16',
    },
    {
      title: '总盈亏',
      value: summary.totalPnL,
      precision: 2,
      prefix: '$',
      icon: summary.totalPnL >= 0
        ? <RiseOutlined style={{ fontSize: 24, color: '#f5222d' }} />
        : <FallOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      color: summary.totalPnL >= 0 ? '#f5222d' : '#52c41a',
    },
    {
      title: '策略收益率(TWR)',
      value: strategyReturnPercent !== null && strategyReturnPercent !== undefined ? strategyReturnPercent : '—',
      precision: strategyReturnPercent !== null && strategyReturnPercent !== undefined ? 2 : undefined,
      suffix: strategyReturnPercent !== null && strategyReturnPercent !== undefined ? '%' : undefined,
      icon: <RiseOutlined style={{ fontSize: 24, color: '#cf1322' }} />,
      color: '#cf1322',
    },
    {
      title: '账户收益率',
      value: accountReturnPercent !== null && accountReturnPercent !== undefined ? accountReturnPercent : '—',
      precision: accountReturnPercent !== null && accountReturnPercent !== undefined ? 2 : undefined,
      suffix: accountReturnPercent !== null && accountReturnPercent !== undefined ? '%' : undefined,
      icon: <PercentageOutlined style={{ fontSize: 24, color: '#13c2c2' }} />,
      color: '#13c2c2',
    },
  ];

  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      {cards.map((card) => (
        <Col xs={12} sm={8} md={6} lg={4} key={card.title}>
          <Card size="small" loading={loading} hoverable>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              {card.icon}
              <div style={{ flex: 1 }}>
                <Statistic
                  title={card.title}
                  value={card.value}
                  precision={card.precision}
                  prefix={card.prefix}
                  suffix={card.suffix}
                  valueStyle={{ fontSize: 18 }}
                />
              </div>
            </div>
          </Card>
        </Col>
      ))}
      {styleAllocation && (
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small" hoverable>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <FundOutlined style={{ fontSize: 24, color: '#eb2f96' }} />
              <div style={{ flex: 1 }}>
                <Statistic
                  title="风格占比"
                  value=" "
                  valueStyle={{ fontSize: 0 }}
                />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {styleAllocation.map((s) => (
                    <Tag key={s.label} color={s.color} style={{ margin: 0, fontSize: 12 }}>
                      {s.label} {s.pct.toFixed(0)}%
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      )}
    </Row>
  );
}
