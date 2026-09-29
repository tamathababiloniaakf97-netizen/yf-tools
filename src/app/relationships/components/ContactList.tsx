'use client';

import { Button, Card, Empty, List, Space, Tag, Typography } from 'antd';
import type { Contact } from '@/types/life-os';

const labels = { family: '家庭', friend: '朋友', classmate: '同学', work: '工作', professional: '专业人士', other: '其他' } as const;
function ContactItems({ contacts, onEdit, onInteract }: { contacts: Contact[]; onEdit: (value: Contact) => void; onInteract: (value: Contact) => void }) {
  if (!contacts.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无记录" />;
  return <List dataSource={contacts} renderItem={(contact) => <List.Item actions={[<Button key="record" size="small" onClick={() => onInteract(contact)}>记录联系</Button>, <Button key="edit" type="link" size="small" onClick={() => onEdit(contact)}>编辑</Button>]}><List.Item.Meta title={<Space>{contact.name}<Tag>{labels[contact.relationship_type]}</Tag></Space>} description={[contact.role, contact.work_context || contact.family_context, contact.next_action && `下一步：${contact.next_action}`, contact.next_contact_at && `下次联系：${contact.next_contact_at}`].filter(Boolean).join(' · ')} /></List.Item>} />;
}
export default function ContactList({ contacts, today, onEdit, onInteract }: { contacts: Contact[]; today: string; onEdit: (value: Contact) => void; onInteract: (value: Contact) => void }) {
  const due = contacts.filter((item) => item.review_status === 'approved' && item.next_contact_at && item.next_contact_at <= today);
  const recent = contacts.filter((item) => item.last_contact_at).sort((a, b) => (b.last_contact_at ?? '').localeCompare(a.last_contact_at ?? '')).slice(0, 5);
  return <div className="relationships-grid">
    <Card><Typography.Title level={4}>需要跟进 · {due.length}</Typography.Title><ContactItems contacts={due} onEdit={onEdit} onInteract={onInteract} /></Card>
    <Card><Typography.Title level={4}>最近联系 · {recent.length}</Typography.Title><ContactItems contacts={recent} onEdit={onEdit} onInteract={onInteract} /></Card>
    <Card className="relationships-all"><Typography.Title level={4}>全部联系人 · {contacts.length}</Typography.Title><ContactItems contacts={contacts} onEdit={onEdit} onInteract={onInteract} /></Card>
  </div>;
}
