'use client';

import React, { useEffect, useState } from 'react';
import { Alert, App, Button, DatePicker, Form, InputNumber, Modal, Select, Space, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { PortfolioOpening, PortfolioOpeningPosition, Ticker } from '@/types';

interface Props { open: boolean; tickers: Ticker[]; opening: PortfolioOpening | null; positions: PortfolioOpeningPosition[]; earliestTransactionDate: string | null; onClose: () => void; onSuccess: () => void; }
interface FormValues { opening_date: Dayjs; opening_cash: number; positions?: PortfolioOpeningPosition[]; }

export default function PortfolioOpeningModal({ open, tickers, opening, positions, earliestTransactionDate, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) form.setFieldsValue({ opening_date: dayjs(opening?.opening_date ?? earliestTransactionDate ?? undefined), opening_cash: opening?.opening_cash ?? 0, positions: positions.map(position => ({ ...position })) });
  }, [earliestTransactionDate, form, open, opening, positions]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const response = await fetch('/api/portfolio-opening', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opening_date: values.opening_date.format('YYYY-MM-DD'), opening_cash: values.opening_cash, positions: values.positions ?? [] }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || '保存失败');
      message.success('期初账户已保存'); onClose(); onSuccess();
    } catch (error) { if (error instanceof Error) message.error(error.message); }
    finally { setSaving(false); }
  };

  return <Modal title={opening ? '编辑期初账户' : '设置期初账户'} open={open} onCancel={onClose} onOk={handleSave} confirmLoading={saving} width={820} okText="保存" cancelText="取消">
    <Alert type="info" showIcon style={{ marginBottom: 16 }} message="期初数据是收益计算的起点" description={earliestTransactionDate ? `期初日期不能晚于 ${earliestTransactionDate}。历史总成本用于持仓盈亏，期初市场价值用于账户期初净资产，两者不要混用。` : '历史总成本用于持仓盈亏，期初市场价值用于账户期初净资产。'} />
    <Form form={form} layout="vertical">
      <Space align="start" size="large" wrap>
        <Form.Item name="opening_date" label="期初日期" rules={[{ required: true, message: '请选择期初日期' }]}><DatePicker disabledDate={current => Boolean(earliestTransactionDate && current.isAfter(dayjs(earliestTransactionDate), 'day'))} /></Form.Item>
        <Form.Item name="opening_cash" label="期初现金（USD）" rules={[{ required: true, message: '请输入期初现金' }]}><InputNumber precision={2} style={{ width: 200 }} /></Form.Item>
      </Space>
      <Typography.Title level={5}>期初持仓</Typography.Title>
      <Form.List name="positions">{(fields, { add, remove }) => <Space orientation="vertical" style={{ width: '100%' }}>
        {fields.map(field => <Space key={field.key} align="start" wrap>
          <Form.Item name={[field.name, 'ticker_id']} label="标的" rules={[{ required: true, message: '请选择标的' }]}><Select style={{ width: 180 }} options={tickers.map(ticker => ({ value: ticker.id, label: `${ticker.name} (${ticker.code})` }))} /></Form.Item>
          <Form.Item name={[field.name, 'quantity']} label="数量" rules={[{ required: true }]}><InputNumber min={0.00000001} /></Form.Item>
          <Form.Item name={[field.name, 'total_cost_usd']} label="历史总成本（USD）" rules={[{ required: true }]}><InputNumber min={0} precision={2} /></Form.Item>
          <Form.Item name={[field.name, 'opening_market_value_usd']} label="期初市场价值（USD）" rules={[{ required: true }]}><InputNumber min={0} precision={2} /></Form.Item>
          <Button danger type="text" aria-label="删除期初持仓" icon={<DeleteOutlined />} onClick={() => remove(field.name)} style={{ marginTop: 30 }} />
        </Space>)}
        <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()}>添加期初持仓</Button>
      </Space>}</Form.List>
    </Form>
  </Modal>;
}
