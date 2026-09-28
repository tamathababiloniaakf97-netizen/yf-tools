'use client';
import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import type { Contact, ContactInteractionInput } from '@/types/life-os';
export default function InteractionEditor({ contact, saving, onCancel, onSubmit }: { contact: Contact | null; saving: boolean; onCancel: () => void; onSubmit: (value: ContactInteractionInput) => Promise<void> }) {
  const [form] = Form.useForm<ContactInteractionInput>();
  useEffect(() => { if (contact) { form.resetFields(); form.setFieldsValue({ occurred_at: new Date().toISOString().slice(0, 10), next_action: contact.next_action, next_contact_at: contact.next_contact_at }); } }, [contact, form]);
  return <Modal title={contact ? `记录联系 · ${contact.name}` : '记录联系'} open={!!contact} confirmLoading={saving} onCancel={onCancel} onOk={() => form.validateFields().then(onSubmit)}><Form form={form} layout="vertical"><Form.Item name="occurred_at" label="联系日期" rules={[{ required: true }]}><Input type="date" /></Form.Item><Form.Item name="summary" label="联系摘要" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item><Form.Item name="next_action" label="下一步行动"><Input /></Form.Item><Form.Item name="next_contact_at" label="下次联系"><Input type="date" /></Form.Item></Form></Modal>;
}
