'use client';

import React from 'react';
import { Card, Table, Input, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export interface MemoRow {
  key: string;
  value: string;
}

interface Props {
  data: MemoRow[];
  onChange: (data: MemoRow[]) => void;
}

export default function OperationMemo({ data, onChange }: Props) {
  const update = (index: number, field: keyof MemoRow, val: string) => {
    const updated = data.map((r, i) => (i === index ? { ...r, [field]: val } : r));
    onChange(updated);
  };

  const add = () => {
    onChange([...data, { key: '', value: '' }]);
  };

  const remove = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const columns = [
    {
      title: '事项', dataIndex: 'key', width: 160,
      render: (_: unknown, __: unknown, i: number) => (
        <Input size="small" value={data[i]?.key} onChange={(e) => update(i, 'key', e.target.value)} placeholder="下次Review / 近期到期" />
      ),
    },
    {
      title: '内容', dataIndex: 'value',
      render: (_: unknown, __: unknown, i: number) => (
        <Input size="small" value={data[i]?.value} onChange={(e) => update(i, 'value', e.target.value)} placeholder="具体日期或备注" />
      ),
    },
    {
      title: '', width: 40,
      render: (_: unknown, __: unknown, i: number) => <Button type="link" size="small" danger onClick={() => remove(i)}>删</Button>,
    },
  ];

  return (
    <Card size="small" title="操作备忘" style={{ marginBottom: 12 }}
      extra={<Button size="small" icon={<PlusOutlined />} onClick={add}>添加备忘</Button>}
    >
      <Table size="small" rowKey={(_, i) => String(i)} dataSource={data.map((r, i) => ({ ...r, key: i }))} columns={columns} pagination={false} locale={{ emptyText: '暂无备忘' }} />
    </Card>
  );
}
