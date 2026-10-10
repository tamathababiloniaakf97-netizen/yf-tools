'use client';
import { Form, Input, InputNumber, Modal, Select } from 'antd';
import { useEffect } from 'react';
import type { InvestmentTask, InvestmentTaskInput } from '@/types/life-os';
import type { Currency } from '@/types';
import { taskStatusLabels, taskTypeLabels } from './InvestmentTaskList';

type TickerOption = { id: string; name: string; code: string; currency: Currency | string };

export default function InvestmentTaskEditor({ open, initial, saving, onCancel, onSubmit, tickers }: { open: boolean; initial: InvestmentTask | InvestmentTaskInput | null; saving: boolean; onCancel: () => void; onSubmit: (input: InvestmentTaskInput) => Promise<void>; tickers: TickerOption[] }) {
  const [form] = Form.useForm<InvestmentTaskInput>();
  useEffect(() => { if (open) { form.resetFields(); form.setFieldsValue(initial ?? { task_type: 'research', status: 'pending' }); } }, [form, initial, open]);
  return <Modal title={'id' in (initial ?? {}) ? '编辑投资待办' : '新建投资待办'} open={open} width={620} confirmLoading={saving} onCancel={onCancel} onOk={() => form.validateFields().then(onSubmit)}><Form form={form} layout="vertical">
    <div className="plan-form-grid"><Form.Item name="asset_name" label="标的、行业或组合（可选）"><Input placeholder="例如：腾讯、机器人行业" /></Form.Item><Form.Item name="task_type" label="待办类型" rules={[{ required: true }]}><Select options={Object.entries(taskTypeLabels).map(([value, label]) => ({ value, label }))} /></Form.Item></div>
    <Form.Item name="title" label="待办事项" rules={[{ required: true }]}><Input placeholder="例如：320元附近重新评估是否买入" /></Form.Item>
    <div className="plan-form-grid"><Form.Item name="ticker_id" label="关联标的"><Select allowClear showSearch optionFilterProp="label" placeholder="选择行情标的" options={tickers.map((ticker) => ({ value: ticker.id, label: `${ticker.name} · ${ticker.code}` }))} /></Form.Item><Form.Item name="price" label="价格" dependencies={['ticker_id']} rules={[{ validator: (_, value) => value == null || value === '' || value > 0 ? Promise.resolve() : Promise.reject(new Error('价格必须大于 0')) }, ({ getFieldValue }) => ({ validator: (_, value) => value == null || value === '' || getFieldValue('ticker_id') ? Promise.resolve() : Promise.reject(new Error('填写价格时请选择关联标的')) })]}><InputNumber min={0.0001} precision={4} style={{ width: '100%' }} placeholder="填写后常驻提醒面板" /></Form.Item></div>
    <Form.Item name="condition_note" label="条件或关注点" extra="只作记录，系统暂不自动读取价格或判断条件。"><Input.TextArea rows={3} /></Form.Item>
    <div className="plan-form-grid"><Form.Item name="reminder_date" label="提醒日期"><Input type="date" /></Form.Item><Form.Item name="status" label="状态" rules={[{ required: true }]}><Select options={Object.entries(taskStatusLabels).map(([value, label]) => ({ value, label }))} /></Form.Item></div>
    <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
  </Form></Modal>;
}
