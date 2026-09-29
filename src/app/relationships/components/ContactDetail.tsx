'use client';
import { Alert, Button, Descriptions, Drawer, Empty, Space, Spin, Tag, Timeline, Typography } from 'antd';
import type { Contact, ContactInteraction } from '@/types/life-os';
import { interactionLabels } from './InteractionEditor';

const lunarMonths = ['', '正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '腊月'];
const lunarDays = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

function birthdayText(contact: Contact) {
  if (!contact.birthday_calendar || contact.birthday_month == null || contact.birthday_day == null) return '未记录';
  const year = contact.birthday_year ? `${contact.birthday_year}年` : '';
  if (contact.birthday_calendar === 'solar') return `公历${year}${contact.birthday_month}月${contact.birthday_day}日`;
  return `农历${year}${contact.birthday_is_leap_month ? '闰' : ''}${lunarMonths[contact.birthday_month]}${lunarDays[contact.birthday_day]}`;
}

export default function ContactDetail({ open, contact, interactions, loading, error, onClose, onRetry }: { open: boolean; contact: Contact | null; interactions: ContactInteraction[]; loading: boolean; error: string; onClose: () => void; onRetry: () => void }) {
  const history = [...interactions].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.created_at.localeCompare(a.created_at));
  return <Drawer title={contact?.name ?? '联系人详情'} open={open} width={600} onClose={onClose}>
    {!contact ? null : <>
      <Typography.Title level={4}>当前档案</Typography.Title>
      <Descriptions column={1} size="small" bordered items={[
        { key: 'role', label: '职业或角色', children: contact.role || '未记录' },
        { key: 'met', label: '认识背景', children: contact.met_context || '未记录' },
        { key: 'birthday', label: '生日', children: birthdayText(contact) },
        { key: 'family', label: '家庭近况', children: contact.family_context || '未记录' },
        { key: 'work', label: '工作近况', children: contact.work_context || '未记录' },
        { key: 'observations', label: '观察与相处提示', children: contact.important_notes || '未记录' },
        { key: 'action', label: '我的下一步行动', children: contact.next_action || '无' },
        { key: 'next', label: '计划联系日期', children: contact.next_contact_at || '未安排' },
      ]} />
      <Typography.Title level={4} style={{ marginTop: 24 }}>往来历史</Typography.Title>
      {loading ? <Spin /> : error ? <Alert type="error" showIcon title="往来历史加载失败" description={error} action={<Button size="small" onClick={onRetry}>重试</Button>} /> : history.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无往来记录" /> : <Timeline items={history.map((item) => ({
        key: item.id,
        children: <div><Space wrap><Typography.Text>{item.occurred_at}</Typography.Text><Tag>{interactionLabels[item.interaction_type]}</Tag></Space><Typography.Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{item.summary}</Typography.Paragraph>{item.next_action && <Typography.Text type="secondary">后续：{item.next_action}</Typography.Text>}</div>,
      }))} />}
    </>}
  </Drawer>;
}
