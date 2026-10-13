'use client';

import React from 'react';
import { Card, Table, Input, InputNumber, Select, Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface ExitRow {
  tier: number;
  priceRange: string;
  shares: number;
  remainingAlloc?: string;
  model: string;
  trigger: string;
}

interface Props {
  data: ExitRow[];
  onChange: (data: ExitRow[]) => void;
  referenceLow: number;
  onReferenceLowChange: (v: number) => void;
  totalShares: number;
  existingAvgCost: number;
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

function calcGain(refLow: number, priceStr: string): string {
  if (!refLow || !priceStr) return '-';
  const price = parsePrice(priceStr);
  if (!price) return '-';
  const gain = ((price - refLow) / refLow) * 100;
  return `${gain >= 0 ? '+' : ''}${gain.toFixed(1)}%`;
}

export default function ExitPlanTable({ data, onChange, referenceLow, onReferenceLowChange, totalShares, existingAvgCost }: Props) {
  const update = (index: number, field: keyof ExitRow, value: unknown) => {
    const updated = data.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    onChange(updated);
  };

  const add = () => {
    onChange([...data, { tier: data.length + 1, priceRange: '', shares: 0, model: '倒金字塔', trigger: '目标价+回撤<5%' }]);
  };

  const remove = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  // 实时计算剩余仓位（基于总股数）
  const computedRemaining: string[] = [];
  let cumSold = 0;
  for (const row of data) {
    cumSold += row.shares || 0;
    const remaining = totalShares > 0 ? ((totalShares - cumSold) / totalShares * 100).toFixed(1) + '%' : '-';
    computedRemaining.push(remaining);
  }

  const columns = [
    { title: '档位', dataIndex: 'tier', width: 60, render: (_: unknown, __: unknown, i: number) => i + 1 },
    {
      title: '价格', dataIndex: 'priceRange', width: 110,
      render: (_: unknown, __: unknown, i: number) => (
        <InputNumber
          size="small"
          min={0}
          style={{ width: 95 }}
          value={parsePrice(data[i]?.priceRange) || undefined}
          onChange={(v) => update(i, 'priceRange', v != null ? String(v) : '')}
          placeholder="450"
          prefix="$"
        />
      ),
    },
    {
      title: '卖出股数', dataIndex: 'shares', width: 90,
      render: (_: unknown, __: unknown, i: number) => (
        <InputNumber size="small" min={0} style={{ width: 70 }} value={data[i]?.shares} onChange={(v) => update(i, 'shares', v || 0)} />
      ),
    },
    {
      title: '剩余仓位', dataIndex: 'remainingAlloc', width: 80,
      render: (_: unknown, __: unknown, i: number) => (
        <span style={{ fontSize: 12 }}>{computedRemaining[i] || '-'}</span>
      ),
    },
    {
      title: '减仓模型', dataIndex: 'model', width: 110,
      render: (_: unknown, __: unknown, i: number) => (
        <Select size="small" value={data[i]?.model} style={{ width: 90 }} onChange={(v) => update(i, 'model', v)}
          options={[
            { value: '倒金字塔', label: '倒金字塔' },
            { value: '等份', label: '等份' },
          ]}
        />
      ),
    },
    {
      title: '触发条件', dataIndex: 'trigger', width: 130,
      render: (_: unknown, __: unknown, i: number) => (
        <Input size="small" value={data[i]?.trigger} onChange={(e) => update(i, 'trigger', e.target.value)} placeholder="目标价+回撤<5%" />
      ),
    },
    {
      title: '涨幅', dataIndex: 'gain', width: 80,
      render: (_: unknown, __: unknown, i: number) => (
        <span style={{ fontSize: 12, color: referenceLow ? '#52c41a' : undefined }}>
          {calcGain(referenceLow, data[i]?.priceRange)}
        </span>
      ),
    },
    {
      title: '', width: 40,
      render: (_: unknown, __: unknown, i: number) => <Button type="link" size="small" danger onClick={() => remove(i)}>删</Button>,
    },
  ];

  return (
    <Card size="small" title="止盈/减仓方案" style={{ marginBottom: 12 }}
      extra={<Button size="small" icon={<PlusOutlined />} onClick={add}>添加档位</Button>}
    >
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Text strong style={{ fontSize: 13 }}>参考最低价：</Text>
        <InputNumber
          size="small"
          min={0}
          value={referenceLow || undefined}
          onChange={(v) => onReferenceLowChange(v || 0)}
          placeholder="如 300"
          style={{ width: 100 }}
          prefix="$"
        />
        <Text type="secondary" style={{ fontSize: 11 }}>计算各档位相对最低价的涨幅</Text>
        {existingAvgCost > 0 && (
          <>
            <Text strong style={{ fontSize: 13, marginLeft: 16 }}>当前成本价：</Text>
            <Text style={{ fontSize: 13, color: '#1677ff', fontWeight: 600 }}>${existingAvgCost.toFixed(2)}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>（持仓均价）</Text>
          </>
        )}
      </div>
      <Table size="small" rowKey={(_, i) => String(i)} dataSource={data.map((r, i) => ({ ...r, key: i }))} columns={columns} pagination={false} locale={{ emptyText: '暂无数据，点击添加档位' }} />
    </Card>
  );
}
