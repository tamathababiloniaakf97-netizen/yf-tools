'use client';

import React from 'react';
import { Modal, Form, Input, Select, App } from 'antd';
import type { TickerType, Currency } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const typeOptions: { value: TickerType; label: string }[] = [
  { value: 'stock_us', label: '美股' },
  { value: 'stock_hk', label: '港股' },
  { value: 'stock_a', label: 'A股' },
  { value: 'option', label: '期权' },
  { value: 'crypto', label: '加密' },
];

const currencyOptions: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD' },
  { value: 'HKD', label: 'HKD' },
  { value: 'CNY', label: 'CNY' },
];

export default function TickerModal({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const res = await fetch('/api/tickers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      message.success('标的添加成功');
      form.resetFields();
      onClose();
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    }
  };

  return (
    <Modal
      title="添加标的"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="确认添加"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="标的名称" rules={[{ required: true, message: '请输入标的名称' }]}>
          <Input placeholder="如：SPY 标普500ETF" />
        </Form.Item>
        <Form.Item
          name="code"
          label="代码"
          rules={[{ required: true, message: '请输入代码' }]}
          extra={<span style={{ color: '#999', fontSize: 12 }}>美股用 ticker（AAPL），港股用数字（00700），A股用代码（600519），加密用简称（BTC）</span>}
        >
          <Input placeholder="如：AAPL" />
        </Form.Item>
        <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
          <Select options={typeOptions} placeholder="选择标的类型" />
        </Form.Item>
        <Form.Item name="currency" label="原始币种" rules={[{ required: true, message: '请选择币种' }]}>
          <Select options={currencyOptions} placeholder="选择币种" />
        </Form.Item>
        <Form.Item name="style" label="属性">
          <Select
            allowClear
            placeholder="选择属性（可选）"
            options={[
              { value: 'offensive', label: '进攻' },
              { value: 'balanced', label: '平衡' },
              { value: 'defensive', label: '防守' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
