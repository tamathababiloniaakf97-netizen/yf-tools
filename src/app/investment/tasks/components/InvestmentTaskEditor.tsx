'use client';
import { Form, Input, Modal, Select } from 'antd';
import { useEffect } from 'react';
import type { InvestmentTask, InvestmentTaskInput } from '@/types/life-os';
import { taskStatusLabels, taskTypeLabels } from './InvestmentTaskList';

export default function InvestmentTaskEditor({ open, initial, saving, onCancel, onSubmit }: { open: boolean; initial: InvestmentTask | InvestmentTaskInput | null; saving: boolean; onCancel: () => void; onSubmit: (input: InvestmentTaskInput) => Promise<void> }) {
  const [form] = Form.useForm<InvestmentTaskInput>();
  useEffect(() => { if (open) { form.resetFields(); form.setFieldsValue(initial ?? { task_type: 'research', status: 'pending' }); } }, [form, initial, open]);
  return <Modal title={'id' in (initial ?? {}) ? '编辑投资待办' : '新建投资待办'} open={open} width={620} confirmLoading={saving} onCancel={onCancel} onOk={() => form.validateFields().then(onSubmit)}><Form form={form} layout="vertical">
    <div className="plan-form-grid"><Form.Item name="asset_name" label="标的、行业或组合（可选）"><Input placeholder="例如：腾讯、机器人行业" /></Form.Item><Form.Item name="task_type" label="待办类型" rules={[{ required: true }]}><Select options={Object.entries(taskTypeLabels).map(([value, label]) => ({ value, label }))} /></Form.Item></div>
    <Form.Item name="title" label="待办事项" rules={[{ required: true }]}><Input placeholder="例如：320元附近重新评估是否买入" /></Form.Item>
    <Form.Item name="condition_note" label="条件或关注点" extra="只作记录，系统暂不自动读取价格或判断条件。"><Input.TextArea rows={3} /></Form.Item>
    <div className="plan-form-grid"><Form.Item name="reminder_date" label="提醒日期"><Input type="date" /></Form.Item><Form.Item name="status" label="状态" rules={[{ required: true }]}><Select options={Object.entries(taskStatusLabels).map(([value, label]) => ({ value, label }))} /></Form.Item></div>
    <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
  </Form></Modal>;
}
