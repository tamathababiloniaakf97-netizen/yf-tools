'use client';
import { Form, Input, InputNumber, Modal, Select, Switch } from 'antd';
import { useEffect } from 'react';
import type { Contact, ContactInput } from '@/types/life-os';

const relationshipOptions = [
  { value: 'family', label: '家庭' }, { value: 'friend', label: '朋友' }, { value: 'classmate', label: '同学' },
  { value: 'work', label: '工作' }, { value: 'professional', label: '专业人士' }, { value: 'other', label: '其他' },
];

export default function ContactEditor({ open, initial, saving, onCancel, onSubmit }: { open: boolean; initial: Contact | null; saving: boolean; onCancel: () => void; onSubmit: (value: ContactInput) => Promise<void> }) {
  const [form] = Form.useForm<ContactInput>();
  const calendar = Form.useWatch('birthday_calendar', form);
  useEffect(() => { if (open) { form.resetFields(); form.setFieldsValue(initial ?? { relationship_type: 'friend', birthday_is_leap_month: false, birthday_reminder_enabled: true }); } }, [form, initial, open]);
  return <Modal title={initial ? '编辑联系人' : '新建联系人'} open={open} width={620} confirmLoading={saving} onCancel={onCancel} onOk={() => form.validateFields().then(onSubmit)}><Form form={form} layout="vertical">
    <div className="plan-form-grid"><Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="relationship_type" label="关系类型" rules={[{ required: true }]}><Select options={relationshipOptions} /></Form.Item></div>
    <div className="plan-form-grid"><Form.Item name="role" label="职业或角色"><Input /></Form.Item><Form.Item name="met_context" label="认识背景" extra="在哪里、通过谁、因为什么认识。"><Input /></Form.Item></div>
    <div className="plan-form-grid"><Form.Item name="birthday_calendar" label="生日历法"><Select allowClear options={[{ value: 'solar', label: '公历' }, { value: 'lunar', label: '农历' }]} /></Form.Item><Form.Item name="birthday_year" label="出生年份（可选）"><InputNumber min={1900} max={2100} style={{ width: '100%' }} /></Form.Item></div>
    <div className="plan-form-grid"><Form.Item name="birthday_month" label="生日月份"><InputNumber min={1} max={12} style={{ width: '100%' }} /></Form.Item><Form.Item name="birthday_day" label="生日日期"><InputNumber min={1} max={calendar === 'lunar' ? 30 : 31} style={{ width: '100%' }} /></Form.Item></div>
    {calendar === 'lunar' && <Form.Item name="birthday_is_leap_month" label="闰月" valuePropName="checked"><Switch /></Form.Item>}
    <Form.Item name="birthday_reminder_enabled" label="生日提醒" valuePropName="checked" extra="生日前7天和当天提醒。"><Switch /></Form.Item>
    <Form.Item name="family_context" label="家庭近况"><Input.TextArea rows={2} /></Form.Item><Form.Item name="work_context" label="工作近况"><Input.TextArea rows={2} /></Form.Item>
    <Form.Item name="important_notes" label="观察与相处提示" extra="记录具体事实：性格表现、如何对待承诺和他人、核心关注或利益关系、沟通偏好、边界与风险。避免只写主观标签。"><Input.TextArea rows={3} /></Form.Item>
    <div className="plan-form-grid"><Form.Item name="last_contact_at" label="最近联系日期"><Input type="date" /></Form.Item><Form.Item name="next_contact_at" label="计划联系日期"><Input type="date" /></Form.Item></div>
    <Form.Item name="next_action" label="我的下一步行动" extra="写你准备做的具体动作，例如：周五把合同资料发给他。"><Input /></Form.Item>
    <Form.Item name="notes" label="其他备注" extra="记录不属于以上分类、但以后需要查阅的信息；不要保存高敏感隐私。"><Input.TextArea rows={2} /></Form.Item>
  </Form></Modal>;
}
