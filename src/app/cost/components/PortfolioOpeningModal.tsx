'use client';

import React, { useEffect, useState } from 'react';
import { Alert, App, Button, DatePicker, Form, InputNumber, Modal, Select, Space, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { PortfolioOpening, PortfolioOpeningPosition, Ticker } from '@/types';
import { calculateOpeningPositionAmounts, deriveOpeningUnitCost } from '@/lib/portfolio-opening';

interface Props { open: boolean; tickers: Ticker[]; opening: PortfolioOpening | null; positions: PortfolioOpeningPosition[]; earliestTransactionDate: string | null; onClose: () => void; onSuccess: () => void; }
interface OpeningPositionFormValue { ticker_id: string; quantity: number; unit_cost: number; }
interface FormValues { opening_date: Dayjs; opening_cash: number; positions?: OpeningPositionFormValue[]; }

const usd = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PortfolioOpeningModal({ open, tickers, opening, positions, earliestTransactionDate, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);
  const watchedPositions = Form.useWatch('positions', form) ?? [];
  useEffect(() => {
    if (open) form.setFieldsValue({
      opening_date: dayjs(opening?.opening_date ?? earliestTransactionDate ?? undefined),
      opening_cash: opening?.opening_cash ?? 0,
      positions: positions.map(position => {
        const ticker = tickers.find(item => item.id === position.ticker_id);
        return {
          ticker_id: position.ticker_id,
          quantity: position.quantity,
          unit_cost: ticker ? deriveOpeningUnitCost(position.total_cost_usd, position.quantity, ticker.currency) : 0,
        };
      }),
    });
  }, [earliestTransactionDate, form, open, opening, positions, tickers]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const convertedPositions = (values.positions ?? []).map(position => {
        const ticker = tickers.find(item => item.id === position.ticker_id);
        if (!ticker) throw new Error('期初持仓标的不存在');
        const amounts = calculateOpeningPositionAmounts(position.quantity, position.unit_cost, ticker.currency, ticker.current_price);
        if (!amounts) throw new Error(`${ticker.name}：请先更新当前价格`);
        return { ticker_id: position.ticker_id, quantity: position.quantity, ...amounts };
      });
      setSaving(true);
      const response = await fetch('/api/portfolio-opening', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opening_date: values.opening_date.format('YYYY-MM-DD'), opening_cash: values.opening_cash, positions: convertedPositions }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || '保存失败');
      message.success('期初账户已保存'); onClose(); onSuccess();
    } catch (error) { if (error instanceof Error) message.error(error.message); }
    finally { setSaving(false); }
  };

  return <Modal title={opening ? '编辑期初账户' : '设置期初账户'} open={open} onCancel={onClose} onOk={handleSave} confirmLoading={saving} width={820} okText="保存" cancelText="取消">
    <Alert type="info" showIcon style={{ marginBottom: 16 }} title="期初数据是收益计算的起点" description={earliestTransactionDate ? `期初日期不能晚于 ${earliestTransactionDate}。填写原币每股成本价后，系统会自动换算总成本和期初市场价值。` : '填写原币每股成本价后，系统会自动换算总成本和期初市场价值。'} />
    <Form form={form} layout="vertical">
      <Space align="start" size="large" wrap>
        <Form.Item name="opening_date" label="期初日期" rules={[{ required: true, message: '请选择期初日期' }]}><DatePicker disabledDate={current => Boolean(earliestTransactionDate && current.isAfter(dayjs(earliestTransactionDate), 'day'))} /></Form.Item>
        <Form.Item name="opening_cash" label="期初现金（USD）" rules={[{ required: true, message: '请输入期初现金' }]}><InputNumber precision={2} style={{ width: 200 }} /></Form.Item>
      </Space>
      <Typography.Title level={5}>期初持仓</Typography.Title>
      <Form.List name="positions">{(fields, { add, remove }) => <Space orientation="vertical" style={{ width: '100%' }}>
        {fields.map(field => {
          const position = watchedPositions[field.name];
          const ticker = tickers.find(item => item.id === position?.ticker_id);
          const amounts = ticker && position
            ? calculateOpeningPositionAmounts(position.quantity, position.unit_cost, ticker.currency, ticker.current_price)
            : null;
          return <Space key={field.key} align="start" wrap>
            <Form.Item name={[field.name, 'ticker_id']} label="标的" rules={[{ required: true, message: '请选择标的' }]}><Select style={{ width: 180 }} options={tickers.map(item => ({ value: item.id, label: `${item.name} (${item.code})` }))} /></Form.Item>
            <Form.Item name={[field.name, 'quantity']} label="数量" rules={[{ required: true, message: '请输入数量' }]}><InputNumber min={0.00000001} /></Form.Item>
            <Form.Item name={[field.name, 'unit_cost']} label={`每股成本价（${ticker?.currency ?? '原币'}）`} rules={[{ required: true, message: '请输入每股成本价' }]}><InputNumber min={0.00000001} precision={4} /></Form.Item>
            <div style={{ minWidth: 130, paddingTop: 5 }}><Typography.Text type="secondary">总成本（USD）</Typography.Text><div>{amounts ? usd(amounts.total_cost_usd) : '—'}</div></div>
            <div style={{ minWidth: 150, paddingTop: 5 }}><Typography.Text type="secondary">期初市场价值（USD）</Typography.Text><div>{amounts ? usd(amounts.opening_market_value_usd) : ticker && !ticker.current_price ? <Typography.Text type="danger">请先更新当前价格</Typography.Text> : '—'}</div></div>
            <Button danger type="text" aria-label="删除期初持仓" icon={<DeleteOutlined />} onClick={() => remove(field.name)} style={{ marginTop: 30 }} />
          </Space>;
        })}
        <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()}>添加期初持仓</Button>
      </Space>}</Form.List>
    </Form>
  </Modal>;
}
