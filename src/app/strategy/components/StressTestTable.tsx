'use client';

import React from 'react';
import { Card, Table, Input, InputNumber, Button, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface StressRow {
  scenario: string;
  priceChange: string;
  stockPnL?: string;
  optionPnL?: string;
  netPnL?: string;
  vsBenchmark?: string;
  marginPressure?: string;
}

interface Props {
  data: StressRow[];
  onChange: (data: StressRow[]) => void;
  entryPlan: { priceRange?: string; shares?: number }[];
  optionsPlan: { costIncome?: number; direction?: string }[];
}

const defaultScenarios: StressRow[] = [
  { scenario: '牛市+30%', priceChange: '+30%' },
  { scenario: '震荡横盘', priceChange: '0%' },
  { scenario: '熊市-30%', priceChange: '-30%' },
  { scenario: '黑天鹅-50%', priceChange: '-50%' },
];

export default function StressTestTable({ data, onChange, entryPlan, optionsPlan }: Props) {
  // Use defaults if empty
  const rows = data.length > 0 ? data : defaultScenarios;

  // 计算总持仓成本和期权净收入
  function parsePrice(pr: string) { if (!pr) return 0; const c = pr.replace(/[$,]/g, ''); const n = c.split('-').map(Number); if (n.length >= 2 && !n.slice(0,2).some(isNaN)) return (n[0]+n[1])/2; return Number(c)||0; }
  const totalStockCost = entryPlan.reduce((sum, r) => sum + parsePrice(r.priceRange || '') * (r.shares || 0), 0);
  const totalOptionPremium = optionsPlan.reduce((sum, r) => sum + (r.costIncome || 0), 0);

  // 实时计算各情景 PnL
  const computedPnL = rows.map((row) => {
    const pct = parseFloat(row.priceChange) || 0;
    const stockPnL = totalStockCost * (pct / 100);
    // 简化期权 PnL：卖方（正 premium）在暴跌时受损，买方（负 premium）在暴跌时受益
    const optionPnL = pct < -10 ? -Math.abs(totalOptionPremium) * 2 * Math.abs(pct / 100)
      : pct > 10 ? totalOptionPremium * 1.5 * (pct / 100)
      : totalOptionPremium * 0.3 * (pct / 100);
    const netPnL = stockPnL + optionPnL;
    return {
      stock: stockPnL !== 0 ? '$' + (stockPnL >= 0 ? '+' : '') + stockPnL.toFixed(0) : '$0',
      option: optionPnL !== 0 ? '$' + (optionPnL >= 0 ? '+' : '') + optionPnL.toFixed(0) : '$0',
      net: netPnL !== 0 ? '$' + (netPnL >= 0 ? '+' : '') + netPnL.toFixed(0) : '$0',
    };
  });

  const update = (index: number, field: keyof StressRow, value: unknown) => {
    const updated = rows.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    onChange(updated);
  };

  const add = () => {
    onChange([...rows, { scenario: '', priceChange: '' }]);
  };

  const remove = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const columns = [
    {
      title: '市场情景', dataIndex: 'scenario', width: 130,
      render: (_: unknown, __: unknown, i: number) => (
        <Input size="small" value={rows[i]?.scenario} onChange={(e) => update(i, 'scenario', e.target.value)} placeholder="自定义情景" />
      ),
    },
    {
      title: '价格变动', dataIndex: 'priceChange', width: 90,
      render: (_: unknown, __: unknown, i: number) => (
        <Input size="small" value={rows[i]?.priceChange} onChange={(e) => update(i, 'priceChange', e.target.value)} placeholder="±X%" />
      ),
    },
    {
      title: '现货盈亏', dataIndex: 'stockPnL', width: 90,
      render: (_: unknown, __: unknown, i: number) => (
        <span style={{ fontSize: 12, color: computedPnL[i]?.stock.startsWith('$+') ? '#52c41a' : computedPnL[i]?.stock.startsWith('$-') ? '#ff4d4f' : undefined }}>
          {computedPnL[i]?.stock || '-'}
        </span>
      ),
    },
    {
      title: '期权盈亏', dataIndex: 'optionPnL', width: 90,
      render: (_: unknown, __: unknown, i: number) => (
        <span style={{ fontSize: 12, color: computedPnL[i]?.option.startsWith('$+') ? '#52c41a' : computedPnL[i]?.option.startsWith('$-') ? '#ff4d4f' : undefined }}>
          {computedPnL[i]?.option || '-'}
        </span>
      ),
    },
    {
      title: '组合净盈亏', dataIndex: 'netPnL', width: 100,
      render: (_: unknown, __: unknown, i: number) => (
        <span style={{ fontSize: 12, fontWeight: 600, color: computedPnL[i]?.net.startsWith('$+') ? '#52c41a' : computedPnL[i]?.net.startsWith('$-') ? '#ff4d4f' : undefined }}>
          {computedPnL[i]?.net || '-'}
        </span>
      ),
    },
    {
      title: 'vs 基准(标普)', dataIndex: 'vsBenchmark', width: 110,
      render: (_: unknown, __: unknown, i: number) => <span style={{ fontSize: 12 }}>{rows[i]?.vsBenchmark || '-'}</span>,
    },
    {
      title: '保证金压力', dataIndex: 'marginPressure', width: 90,
      render: (_: unknown, __: unknown, i: number) => <span style={{ fontSize: 12 }}>{rows[i]?.marginPressure || '无'}</span>,
    },
    {
      title: '', width: 40,
      render: (_: unknown, __: unknown, i: number) => <Button type="link" size="small" danger onClick={() => remove(i)}>删</Button>,
    },
  ];

  return (
    <Card size="small" title="压力测试" style={{ marginBottom: 12 }}
      extra={<Button size="small" icon={<PlusOutlined />} onClick={add}>添加情景</Button>}
    >
      <Table size="small" rowKey={(_, i) => String(i)} dataSource={rows.map((r, i) => ({ ...r, key: i }))} columns={columns} pagination={false} />
    </Card>
  );
}
