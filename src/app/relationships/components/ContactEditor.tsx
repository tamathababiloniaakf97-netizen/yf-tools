'use client';
import { Form, Input, Modal, Select } from 'antd';
import { useEffect } from 'react';
import type { Contact, ContactInput } from '@/types/life-os';
export default function ContactEditor({ open, initial, saving, onCancel, onSubmit }: { open: boolean; initial: Contact | null; saving: boolean; onCancel: () => void; onSubmit: (value: ContactInput) => Promise<void> }) {
  const [form] = Form.useForm<ContactInput>();
  useEffect(() => { if (open) { form.resetFields(); form.setFieldsValue(initial ?? { relationship_type: 'friend' }); } }, [form, initial, open]);
  return <Modal title={initial ? '编辑联系人' : '新建联系人'} open={open} confirmLoading={saving} onCancel={onCancel} onOk={() => form.validateFields().then(onSubmit)}><Form form={form} layout="vertical">
    <div className="plan-form-grid"><Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="relationship_type" label="关系类型" rules={[{ required: true }]}><Select options={[{ value: 'family', label: '家庭' }, { value: 'friend', label: '朋友' }, { value: 'work', label: '工作' }, { value: 'professional', label: '专业人士' }, { value: 'other', label: '其他' }]} /></Form.Item></div>
    <div className="plan-form-grid"><Form.Item name="role" label="职业或角色"><Input /></Form.Item><Form.Item name="met_context" label="认识背景"><Input /></Form.Item></div>
    <Form.Item name="family_context" label="家庭近况"><Input.TextArea rows={2} /></Form.Item><Form.Item name="work_context" label="工作近况"><Input.TextArea rows={2} /></Form.Item><Form.Item name="important_notes" label="重要事项"><Input.TextArea rows={2} /></Form.Item>
    <div className="plan-form-grid"><Form.Item name="last_contact_at" label="最近联系"><Input type="date" /></Form.Item><Form.Item name="next_contact_at" label="下次联系"><Input type="date" /></Form.Item></div>
    <Form.Item name="next_action" label="下一步行动"><Input /></Form.Item><Form.Item name="notes" label="备注"><Input.TextArea rows={2} placeholder="只记录维护关系所必需的信息，不保存高敏感隐私。" /></Form.Item>
  </Form></Modal>;
}
