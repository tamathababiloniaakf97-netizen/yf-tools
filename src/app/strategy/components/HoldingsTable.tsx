'use client';

import React from 'react';
import { Table, Button, Input, Select, InputNumber, Checkbox, Space } from 'antd';
import { PlusOutlined, ImportOutlined } from '@ant-design/icons';
import type { StrategyHolding } from '@/types';

interface Props {
  holdings: StrategyHolding[];
  onChange: (holdings: StrategyHolding[]) => void;
  onImport: () => void;
  importing: boolean;
}

export default function HoldingsTable({ holdings, onChange, onImport, importing }: Props) {
  const addRow = () => {
    onChange([...holdings, { ticker: '', type: '股票', quantity: 0, costPrice: 0, currentPrice: 0, isFirstOrOnly: false }]);
  };

  const updateRow = (index: number, field: keyof StrategyHolding, value: unknown) => {
    const updated = holdings.map((h, i) => (i === index ? { ...h, [field]: value } : h));
    onChange(updated);
  };

  const removeRow = (index: number) => {
    onChange(holdings.filter((_, i) => i !== index));
  };

  const columns = [
    {
      title: '标的',
      dataIndex: 'ticker',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => (
        <Input
          size="small"
          placeholder="QQQ"
          value={holdings[index].ticker}
          onChange={(e) => updateRow(index, 'ticker', e.target.value)}
        />
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => (
        <Select
          size="small"
          value={holdings[index].type}
          style={{ width: 80 }}
          onChange={(v) => updateRow(index, 'type', v)}
          options={[
            { value: '股票', label: '股票' },
            { value: '期权', label: '期权' },
          ]}
        />
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => (
        <InputNumber
          size="small"
          min={0}
          style={{ width: 70 }}
          value={holdings[index].quantity}
          onChange={(v) => updateRow(index, 'quantity', v || 0)}
        />
      ),
    },
    {
      title: '成本价',
      dataIndex: 'costPrice',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => (
        <InputNumber
          size="small"
          min={0}
          style={{ width: 70 }}
          value={holdings[index].costPrice}
          onChange={(v) => updateRow(index, 'costPrice', v || 0)}
        />
      ),
    },
    {
      title: '现价',
      dataIndex: 'currentPrice',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => (
        <InputNumber
          size="small"
          min={0}
          style={{ width: 70 }}
          value={holdings[index].currentPrice}
          onChange={(v) => updateRow(index, 'currentPrice', v || undefined)}
        />
      ),
    },
    {
      title: '第一/唯一',
      dataIndex: 'isFirstOrOnly',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => (
        <Checkbox
          checked={holdings[index].isFirstOrOnly}
          onChange={(e) => updateRow(index, 'isFirstOrOnly', e.target.checked)}
        />
      ),
    },
    {
      title: '',
      width: 40,
      render: (_: unknown, __: unknown, index: number) => (
        <Button type="link" size="small" danger onClick={() => removeRow(index)}>删</Button>
      ),
    },
  ];

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Space>
          <Button size="small" icon={<PlusOutlined />} onClick={addRow}>添加行</Button>
        </Space>
        <Button size="small" icon={<ImportOutlined />} loading={importing} onClick={onImport}>
          从成本记录导入
        </Button>
      </div>
      <Table
        size="small"
        rowKey={(_, i) => String(i)}
        dataSource={holdings.map((h, i) => ({ ...h, key: i }))}
        columns={columns}
        pagination={false}
        locale={{ emptyText: '暂无持仓，点击"添加行"或"从成本记录导入"' }}
      />
    </div>
  );
}
