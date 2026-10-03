'use client';

import { BellOutlined } from '@ant-design/icons';
import { Badge, Button, Empty, List, Popover, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DueReminder, DueReminderKind } from '@/lib/reminders/types';

const kindLabels: Record<DueReminderKind, string> = {
  relationship_overdue: '联系已延期', relationship_today: '今天联系', relationship_holiday: '节日联系',
  birthday_upcoming: '生日将近', birthday_today: '今天生日',
  investment_task_overdue: '投资待办已延期', investment_task_today: '今天检查',
  finance_entry_review: '财务录入检查',
  goal_action_overdue: '目标行动已过期', goal_action_today: '今日目标行动',
};

export default function ReminderCenter({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<DueReminder[]>([]);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetch('/api/reminders/due').then(async (response) => response.ok ? response.json() : []).then((data) => { if (active) setItems(data); });
    return () => { active = false; };
  }, [enabled]);

  const content = <div style={{ width: 340 }}>
    <Typography.Title level={5}>到期提醒 · {items.length}</Typography.Title>
    {items.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无到期提醒" /> : <List size="small" dataSource={items} renderItem={(item) => <List.Item onClick={() => router.push(item.href)} style={{ cursor: 'pointer' }}><List.Item.Meta title={item.title} description={[item.description,item.due_date??'周期事项'].filter(Boolean).join(' · ')} /><Tag color={item.kind.includes('overdue') || Boolean(item.due_date && item.due_date < today) ? 'red' : 'blue'}>{kindLabels[item.kind]}</Tag></List.Item>} />}
  </div>;

  return <Popover trigger="click" placement="bottomRight" content={content}><Badge count={items.length} size="small"><Button type="text" aria-label="提醒" icon={<BellOutlined />} /></Badge></Popover>;
}
