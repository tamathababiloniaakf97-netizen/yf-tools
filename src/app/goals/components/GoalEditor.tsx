'use client';

import { Form, Input, InputNumber, Modal, Select } from 'antd';
import { useEffect } from 'react';
import type { Goal, GoalInput } from '@/types/life-os';

export default function GoalEditor({ open, initial, saving, onCancel, onSubmit }: { open: boolean; initial: Goal | null; saving: boolean; onCancel: () => void; onSubmit: (value: GoalInput) => Promise<void> }) {
  const [form] = Form.useForm<GoalInput>();
  const goalType = Form.useWatch('goal_type', form);
  useEffect(() => { if (open) form.setFieldsValue(initial ?? { year: new Date().getFullYear(), goal_type: 'project', status: 'active', current_value: 0, habit_completed_count: 0 }); }, [form, initial, open]);
  return <Modal title={initial ? '编辑年度目标' : '新建年度目标'} open={open} confirmLoading={saving} okText="保存" cancelText="取消" onCancel={onCancel} onOk={() => form.validateFields().then(onSubmit)}>
    <Form form={form} layout="vertical">
      <Form.Item name="title" label="目标" rules={[{ required: true }]}><Input maxLength={100} /></Form.Item>
      <div className="plan-form-grid"><Form.Item name="year" label="年份" rules={[{ required: true }]}><InputNumber min={2020} max={2100} style={{ width: '100%' }} /></Form.Item><Form.Item name="goal_type" label="目标类型" rules={[{ required: true }]}><Select options={[{ value: 'result', label: '结果型' }, { value: 'project', label: '项目型' }, { value: 'habit', label: '习惯型' }, { value: 'direction', label: '方向型' }]} /></Form.Item></div>
      <Form.Item name="completion_criteria" label="完成标准" rules={[{ required: true }]}><Input.TextArea rows={2} maxLength={500} /></Form.Item>
      {goalType === 'result' && <div className="plan-form-grid"><Form.Item name="current_value" label="当前值" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item><Form.Item name="target_value" label="目标值" rules={[{ required: true }]}><InputNumber min={0.000001} style={{ width: '100%' }} /></Form.Item><Form.Item name="value_unit" label="单位" rules={[{ required: true }]}><Input /></Form.Item></div>}
      {goalType === 'project' && <Form.Item name="current_milestone" label="当前里程碑" rules={[{ required: true }]}><Input maxLength={200} /></Form.Item>}
      {goalType === 'habit' && <div className="plan-form-grid"><Form.Item name="habit_completed_count" label="已完成次数" rules={[{ required: true }]}><InputNumber min={0} precision={0} style={{ width: '100%' }} /></Form.Item><Form.Item name="habit_target_count" label="计划次数" rules={[{ required: true }]}><InputNumber min={1} precision={0} style={{ width: '100%' }} /></Form.Item><Form.Item name="habit_period" label="统计周期" rules={[{ required: true }]}><Select options={[{ value: 'weekly', label: '每周' }, { value: 'monthly', label: '每月' }, { value: 'quarterly', label: '每季度' }]} /></Form.Item></div>}
      {goalType === 'direction' && <Form.Item name="current_state" label="当前判断或状态"><Input.TextArea rows={2} maxLength={500} /></Form.Item>}
      <Form.Item name="next_action" label="下一步行动" rules={[{ required: true }]}><Input maxLength={200} /></Form.Item>
      <Form.Item name="description" label="为什么重要"><Input.TextArea rows={2} maxLength={500} /></Form.Item>
      <Form.Item name="status" label="状态"><Select options={[{ value: 'active', label: '进行中' }, { value: 'completed', label: '已完成' }, { value: 'paused', label: '暂停' }, { value: 'cancelled', label: '取消' }]} /></Form.Item>
    </Form>
  </Modal>;
}
