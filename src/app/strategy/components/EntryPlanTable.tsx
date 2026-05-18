'use client';

import React from 'react';
import { Card, Table, Input, InputNumber, Select, Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface EntryRow {
  tier: number;
  priceRange: string;
  shares: number;
  allocPercent?: string;
  cumulativeAlloc?: string;
  model: string;
  trigger: string;
}

interface Props {
  data: EntryRow[];
  onChange: (data: EntryRow[]) => void;
  referenceHigh: number;
  onReferenceHighChange: (v: number) => void;
  totalCash: number;
  existingShares: number;
  existingCost: number;
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

function calcDecline(refHigh: number, priceStr: string): string {
  if (!refHigh || !priceStr) return '-';
  const price = parsePrice(priceStr);
  if (!price) return '-';
  const decline = ((refHigh - price) / refHigh) * 100;
  return `${decline >= 0 ? '+' : ''}${decline.toFixed(1)}%`;
}

export default function EntryPlanTable({ data, onChange, referenceHigh, onReferenceHighChange, totalCash, existingShares, existingCost }: Props) {
  const update = (index: number, field: keyof EntryRow, value: unknown) => {
    const updated = data.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    onChange(updated);
  };

  const add = () => {
    onChange([...data, { tier: data.length + 1, priceRange: '', shares: 0, model: '金字塔', trigger: '价格触及' }]);
  };

  const remove = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  // 实时计算仓位占比（基于总现金）
  const computedAllocs: { alloc: string; cum: string }[] = [];
  let cumSum = 0;
  for (const row of data) {
    const price = parsePrice(row.priceRange || '');
    const cost = price * (row.shares || 0);
    const alloc = totalCash > 0 ? ((cost / totalCash) * 100).toFixed(1) + '%' : '-';
    cumSum += totalCash > 0 ? (cost / totalCash) * 100 : 0;
    const cum = totalCash > 0 ? cumSum.toFixed(1) + '%' : '-';
    computedAllocs.push({ alloc, cum });
  }

  // 最终成本价 =（已有成本 + 计划买入成本）/（已有股数 + 计划买入股数）
  const plannedCost = data.reduce((sum, row) => sum + parsePrice(row.priceRange || '') * (row.shares || 0), 0);
  const plannedShares = data.reduce((sum, row) => sum + (row.shares || 0), 0);
  const totalSharesAfter = existingShares + plannedShares;
  const totalCostAfter = existingCost + plannedCost;
  const finalAvgCost = totalSharesAfter > 0 ? totalCostAfter / totalSharesAfter : 0;

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
          placeholder="385"
          prefix="$"
        />
      ),
    },
    {
      title: '买入股数', dataIndex: 'shares', width: 90,
      render: (_: unknown, __: unknown, i: number) => (
        <InputNumber size="small" min={0} style={{ width: 70 }} value={data[i]?.shares} onChange={(v) => update(i, 'shares', v || 0)} />
      ),
    },
    {
      title: '仓位占比', dataIndex: 'allocPercent', width: 80,
      render: (_: unknown, __: unknown, i: number) => (
        <span style={{ fontSize: 12 }}>{computedAllocs[i]?.alloc || '-'}</span>
      ),
    },
    {
      title: '累计仓位', dataIndex: 'cumulativeAlloc', width: 80,
      render: (_: unknown, __: unknown, i: number) => (
        <span style={{ fontSize: 12 }}>{computedAllocs[i]?.cum || '-'}</span>
      ),
    },
    {
      title: '加仓模型', dataIndex: 'model', width: 100,
      render: (_: unknown, __: unknown, i: number) => (
        <Select size="small" value={data[i]?.model} style={{ width: 90 }} onChange={(v) => update(i, 'model', v)}
          options={[
            { value: '金字塔', label: '金字塔' },
            { value: '等份', label: '等份' },
            { value: '菱形', label: '菱形' },
          ]}
        />
      ),
    },
    {
      title: '触发条件', dataIndex: 'trigger', width: 120,
      render: (_: unknown, __: unknown, i: number) => (
        <Input size="small" value={data[i]?.trigger} onChange={(e) => update(i, 'trigger', e.target.value)} placeholder="价格触及" />
      ),
    },
    {
      title: '跌幅', dataIndex: 'decline', width: 80,
      render: (_: unknown, __: unknown, i: number) => (
        <span style={{ fontSize: 12, color: referenceHigh ? '#ff4d4f' : undefined }}>
          {calcDecline(referenceHigh, data[i]?.priceRange)}
        </span>
      ),
    },
    {
      title: '', width: 40,
      render: (_: unknown, __: unknown, i: number) => <Button type="link" size="small" danger onClick={() => remove(i)}>删</Button>,
    },
  ];

  return (
    <Card size="small" title="建仓/加仓方案" style={{ marginBottom: 12 }}
      extra={<Button size="small" icon={<PlusOutlined />} onClick={add}>添加档位</Button>}
    >
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Text strong style={{ fontSize: 13 }}>现价：</Text>
        <InputNumber
          size="small"
          min={0}
          value={referenceHigh || undefined}
          onChange={(v) => onReferenceHighChange(v || 0)}
          placeholder="如 385"
          style={{ width: 100 }}
          prefix="$"
        />
        <Text type="secondary" style={{ fontSize: 11 }}>计算各档位相对现价的跌幅</Text>
        {finalAvgCost > 0 && (
          <>
            <Text strong style={{ fontSize: 13, marginLeft: 16 }}>最终成本价：</Text>
            <Text style={{ fontSize: 13, color: '#1677ff', fontWeight: 600 }}>${finalAvgCost.toFixed(2)}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>（执行后摊薄均价）</Text>
          </>
        )}
      </div>
      <Table size="small" rowKey={(_, i) => String(i)} dataSource={data.map((r, i) => ({ ...r, key: i }))} columns={columns} pagination={false} locale={{ emptyText: '暂无数据，点击添加档位' }} />
    </Card>
  );
}
