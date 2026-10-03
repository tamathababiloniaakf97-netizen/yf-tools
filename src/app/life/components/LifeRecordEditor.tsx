'use client';

import { DatePicker, Form, Input, Modal, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect } from 'react';
import type { LifeTrainingRecord, LifeTrainingRecordInput } from '@/types/life-os';

type FormValue = Omit<LifeTrainingRecordInput, 'trained_on'> & { trained_on: Dayjs };
type Props = {
  open: boolean;
  initial: LifeTrainingRecord | null;
  stages: string[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (value: LifeTrainingRecordInput) => Promise<void>;
};

export default function LifeRecordEditor({ open, initial, stages, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValue>();
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(initial ? {
      trained_on: dayjs(initial.trained_on), stage_name: initial.stage_name,
      session_goal: initial.session_goal, activity: initial.activity, result_notes: initial.result_notes,
    } : { trained_on: dayjs(), stage_name: stages[0] ?? '', session_goal: '', activity: '', result_notes: '' });
  }, [form, initial, open, stages]);

  const submit = async (value: FormValue) => onSubmit({ ...value, trained_on: value.trained_on.format('YYYY-MM-DD') });
  return <Modal title={initial ? '编辑训练记录' : '记录训练'} open={open} confirmLoading={saving}
    okText="保存" cancelText="取消" onCancel={onCancel} onOk={() => form.validateFields().then(submit)}>
    <Form form={form} layout="vertical">
      <Form.Item name="trained_on" label="日期" rules={[{ required: true, message: '请选择日期' }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
      <Form.Item name="stage_name" label="当时的训练阶段"><Select allowClear options={stages.map((stage) => ({ value: stage, label: stage }))} /></Form.Item>
      <Form.Item name="session_goal" label="本次目标"><Input.TextArea rows={2} maxLength={1000} /></Form.Item>
      <Form.Item name="activity" label="做了什么" rules={[{ required: true, whitespace: true, message: '请填写做了什么' }]}>
        <Input.TextArea rows={4} maxLength={3000} />
      </Form.Item>
      <Form.Item name="result_notes" label="结果或感受"><Input.TextArea rows={3} maxLength={3000} /></Form.Item>
    </Form>
  </Modal>;
}
