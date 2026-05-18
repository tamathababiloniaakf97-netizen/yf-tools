'use client';

import React from 'react';
import { Card, Table, InputNumber, Typography, Space, Tag } from 'antd';

const { Text } = Typography;

interface CashRow {
  tier: number;
  priceRange: string;
  shares: number;
  cost: number;
}

interface Props {
  totalCash: number;
  onTotalCashChange: (v: number) => void;
  entryPlan: Array<{ tier?: number; priceRange?: string; shares?: number }>;
  optionsPlan: Array<{ costIncome?: number }>;
}

/** 兼容旧的价格区间格式，也支持单个价格 */
function parsePrice(val: string): number {
  if (!val) return 0;
  const clean = val.replace(/[$,]/g, '');
  const nums = clean.split('-').map(Number);
  if (nums.length >= 2 && !nums.slice(0, 2).some(isNaN)) {
    return (nums[0] + nums[1]) / 2;
  }
  return Number(clean) || 0;
}

export default function CashSummary({ totalCash, onTotalCashChange, entryPlan, optionsPlan }: Props) {
  const totalOptionPremium = optionsPlan.reduce((sum, r) => sum + (r.costIncome || 0), 0);

  const cashRows: CashRow[] = entryPlan.map((row, i) => {
    const midPrice = parsePrice(row.priceRange || '');
    const cost = midPrice * (row.shares || 0);
    return {
      tier: (row.tier || i + 1),
      priceRange: row.priceRange || '',
      shares: row.shares || 0,
      cost,
    };
  });

  const totalEntryCost = cashRows.reduce((sum, r) => sum + r.cost, 0);
  const remainingAfterAll = totalCash - totalEntryCost + totalOptionPremium;

  const detailColumns = [
    { title: '档位', dataIndex: 'tier', width: 50, render: (_: unknown, __: unknown, i: number) => i + 1 },
    {
      title: '价格', dataIndex: 'priceRange', width: 90,
      render: (_: unknown, __: unknown, i: number) => {
        const price = parsePrice(cashRows[i]?.priceRange || '');
        return <span style={{ fontSize: 12 }}>{price ? `$${price}` : '-'}</span>;
      },
    },
    {
      title: '股数', dataIndex: 'shares', width: 65,
      render: (_: unknown, __: unknown, i: number) => <span style={{ fontSize: 12 }}>{(cashRows[i]?.shares || 0).toLocaleString()}</span>,
    },
    {
      title: '预估成本', dataIndex: 'cost', width: 90,
      render: (_: unknown, __: unknown, i: number) => {
        const cost = cashRows[i]?.cost || 0;
        return <span style={{ fontSize: 12 }}>${cost.toLocaleString()}</span>;
      },
    },
    {
      title: '累计消耗', width: 90,
      render: (_: unknown, __: unknown, i: number) => {
        const cum = cashRows.slice(0, i + 1).reduce((s, r) => s + r.cost, 0);
        return <span style={{ fontSize: 12 }}>${cum.toLocaleString()}</span>;
      },
    },
    {
      title: '剩余现金', width: 90,
      render: (_: unknown, __: unknown, i: number) => {
        const cum = cashRows.slice(0, i + 1).reduce((s, r) => s + r.cost, 0);
        const rem = totalCash - cum;
        return <span style={{ fontSize: 12, color: rem >= 0 ? '#52c41a' : '#ff4d4f' }}>${rem.toLocaleString()}</span>;
      },
    },
  ];

  return (
    <Card size="small" title="现金预算" style={{ marginBottom: 12 }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <Text strong style={{ fontSize: 13 }}>总现金：</Text>
            <InputNumber
              size="small"
              min={0}
              value={totalCash || undefined}
              onChange={(v) => onTotalCashChange(v || 0)}
              style={{ width: 140 }}
              prefix="$"
              placeholder="100000"
            />
          </div>
          <Tag color="blue">建仓总需 ${totalEntryCost.toLocaleString()}</Tag>
          <Tag color={totalOptionPremium >= 0 ? 'green' : 'orange'}>
            期权净收支 ${totalOptionPremium >= 0 ? '+' : ''}{totalOptionPremium.toLocaleString()}
          </Tag>
          <Tag color={remainingAfterAll >= 0 ? 'green' : 'red'}>
            最终剩余 ${remainingAfterAll.toLocaleString()}
          </Tag>
        </div>

        {cashRows.length > 0 && (
          <Table
            size="small"
            rowKey={(_, i) => String(i)}
            dataSource={cashRows.map((r, i) => ({ ...r, key: i }))}
            columns={detailColumns}
            pagination={false}
            locale={{ emptyText: '暂无建仓档位' }}
          />
        )}
      </Space>
    </Card>
  );
}
