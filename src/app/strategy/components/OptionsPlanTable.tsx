'use client';

import React from 'react';
import { Card, Table, Input, InputNumber, Select, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export interface OptionsRow {
  layer: string;
  tool: string;
  applicableState: string;
  direction: string;
  quantity: number;
  strike: string;
  expiry: string;
  costIncome: number;
  function: string;
}

interface Props {
  data: OptionsRow[];
  onChange: (data: OptionsRow[]) => void;
}

export default function OptionsPlanTable({ data, onChange }: Props) {
  const update = (index: number, field: keyof OptionsRow, value: unknown) => {
    const updated = data.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    onChange(updated);
  };

  const add = () => {
    onChange([...data, { layer: '', tool: 'Short Put', applicableState: '始终', direction: 'SELL', quantity: 1, strike: '', expiry: '', costIncome: 0, function: '' }]);
  };

  const remove = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const columns = [
    {
      title: '层级', dataIndex: 'layer', width: 90,
      render: (_: unknown, __: unknown, i: number) => (
        <Select size="small" value={data[i]?.layer} style={{ width: 80 }} onChange={(v) => update(i, 'layer', v)}
          options={[
            { value: '现金流层', label: '现金流层' },
            { value: '保护层', label: '保护层' },
            { value: '进攻层', label: '进攻层' },
            { value: '对冲层', label: '对冲层' },
            { value: '防踏空层', label: '防踏空层' },
          ]}
        />
      ),
    },
    {
      title: '工具', dataIndex: 'tool', width: 90,
      render: (_: unknown, __: unknown, i: number) => (
        <Select size="small" value={data[i]?.tool} style={{ width: 85 }} onChange={(v) => update(i, 'tool', v)}
          options={[
            { value: 'Short Put', label: 'Short Put' },
            { value: 'Long Put', label: 'Long Put' },
            { value: 'Long Call', label: 'Long Call' },
            { value: 'Short Call', label: 'Short Call' },
          ]}
        />
      ),
    },
    {
      title: '适用状态', dataIndex: 'applicableState', width: 85,
      render: (_: unknown, __: unknown, i: number) => (
        <Select size="small" value={data[i]?.applicableState || '始终'} style={{ width: 75 }} onChange={(v) => update(i, 'applicableState', v)}
          options={[
            { value: '未持货', label: '未持货' },
            { value: '已持货', label: '已持货' },
            { value: '始终', label: '始终' },
          ]}
        />
      ),
    },
    {
      title: '方向', dataIndex: 'direction', width: 65,
      render: (_: unknown, __: unknown, i: number) => <span style={{ fontSize: 12 }}>{data[i]?.direction}</span>,
    },
    {
      title: '数量', dataIndex: 'quantity', width: 65,
      render: (_: unknown, __: unknown, i: number) => (
        <InputNumber size="small" min={0} style={{ width: 55 }} value={data[i]?.quantity} onChange={(v) => update(i, 'quantity', v || 0)} />
      ),
    },
    {
      title: '行权价', dataIndex: 'strike', width: 85,
      render: (_: unknown, __: unknown, i: number) => (
        <Input size="small" value={data[i]?.strike} onChange={(e) => update(i, 'strike', e.target.value)} placeholder="450" />
      ),
    },
    {
      title: '到期日', dataIndex: 'expiry', width: 100,
      render: (_: unknown, __: unknown, i: number) => (
        <Input size="small" value={data[i]?.expiry} onChange={(e) => update(i, 'expiry', e.target.value)} placeholder="2026-06-15" />
      ),
    },
    {
      title: '预估成本/收入', dataIndex: 'costIncome', width: 120,
      render: (_: unknown, __: unknown, i: number) => (
        <InputNumber size="small" style={{ width: 90 }} value={data[i]?.costIncome} onChange={(v) => update(i, 'costIncome', v || 0)} />
      ),
    },
    {
      title: '核心功能', dataIndex: 'function', width: 80,
      render: (_: unknown, __: unknown, i: number) => <span style={{ fontSize: 12 }}>{data[i]?.function}</span>,
    },
    {
      title: '', width: 40,
      render: (_: unknown, __: unknown, i: number) => <Button type="link" size="small" danger onClick={() => remove(i)}>删</Button>,
    },
  ];

  const netTheta = data.reduce((sum, r) => sum + (r.costIncome || 0), 0);

  return (
    <Card size="small" title={`期权组合方案（净Theta: ${netTheta >= 0 ? '+' : ''}${netTheta}）`} style={{ marginBottom: 12 }}
      extra={<Button size="small" icon={<PlusOutlined />} onClick={add}>添加期权</Button>}
    >
      <Table size="small" rowKey={(_, i) => String(i)} dataSource={data.map((r, i) => ({ ...r, key: i }))} columns={columns} pagination={false} locale={{ emptyText: '暂无期权，点击添加' }} />
    </Card>
  );
}
