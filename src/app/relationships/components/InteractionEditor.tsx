'use client';
import { Form, Input, Modal, Select } from 'antd';
import { useEffect } from 'react';
import type { Contact, ContactInteractionInput, InteractionType } from '@/types/life-os';

export const interactionLabels: Record<InteractionType, string> = {
  contact: '联系或见面', gift_given: '我送礼/表达感谢', gift_received: '对方送礼', advice_received: '我向对方请教', advice_given: '对方向我请教', help_received: '对方帮助我', help_given: '我帮助对方', other: '其他',
};
const placeholders: Record<InteractionType, string> = {
  contact: '记录谈了什么、对方近期变化，以及对后续相处有用的具体事实。', gift_given: '记录事由、礼物、对方回应、偏好或忌讳。', gift_received: '记录事由、礼物、你的回应和后续是否需要致谢。', advice_received: '记录请教事项、关键建议、是否需要反馈结果或致谢。', advice_given: '记录对方请教的事项、你给出的建议和后续。', help_received: '记录对方提供的帮助、结果和后续致谢。', help_given: '记录你提供的帮助、结果和后续。', other: '记录这次重要往来的事实和结果。',
};
function todayInShanghai() { const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()); const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''; return `${get('year')}-${get('month')}-${get('day')}`; }

export default function InteractionEditor({ contact, saving, onCancel, onSubmit }: { contact: Contact | null; saving: boolean; onCancel: () => void; onSubmit: (value: ContactInteractionInput) => Promise<void> }) {
  const [form] = Form.useForm<ContactInteractionInput>();
  const interactionType = Form.useWatch('interaction_type', form) ?? 'contact';
  useEffect(() => { if (contact) { form.resetFields(); form.setFieldsValue({ occurred_at: todayInShanghai(), interaction_type: 'contact', next_action: '', next_contact_at: null }); } }, [contact, form]);
  return <Modal title={contact ? `记录往来 · ${contact.name}` : '记录往来'} open={!!contact} confirmLoading={saving} onCancel={onCancel} onOk={() => form.validateFields().then(onSubmit)}><Form form={form} layout="vertical">
    <Form.Item name="interaction_type" label="往来类型" rules={[{ required: true }]}><Select options={Object.entries(interactionLabels).map(([value, label]) => ({ value, label }))} /></Form.Item>
    <Form.Item name="occurred_at" label="往来日期" rules={[{ required: true }]}><Input type="date" /></Form.Item><Form.Item name="summary" label="往来内容" rules={[{ required: true }]}><Input.TextArea rows={4} placeholder={placeholders[interactionType]} /></Form.Item>
    <Form.Item name="next_action" label="我的下一步行动"><Input placeholder="例如：10月10日前反馈处理结果并致谢" /></Form.Item><Form.Item name="next_contact_at" label="计划联系日期"><Input type="date" /></Form.Item>
  </Form></Modal>;
}
