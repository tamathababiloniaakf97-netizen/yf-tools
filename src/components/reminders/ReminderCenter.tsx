'use client';

import { BellOutlined } from '@ant-design/icons';
import { Badge, Button, Empty, List, Popover, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DueReminder, DueReminderKind } from '@/lib/reminders/due-reminders';

const kindLabels: Record<DueReminderKind, string> = {
  overdue: '已延期', due_today: '今天到期', scheduled: '提醒时间已到', recurring: '周期提醒',
  relationship_overdue: '联系已延期', relationship_today: '今天联系',
};

export default function ReminderCenter({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<DueReminder[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetch('/api/reminders/due').then(async (response) => response.ok ? response.json() : []).then((data) => { if (active) setItems(data); });
    return () => { active = false; };
  }, [enabled]);

  const content = <div style={{ width: 340 }}>
    <Typography.Title level={5}>需要处理 · {items.length}</Typography.Title>
    {items.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无到期提醒" /> : <List size="small" dataSource={items} renderItem={(item) => <List.Item onClick={() => router.push(item.href)} style={{ cursor: 'pointer' }}><List.Item.Meta title={item.title} description={item.due_date ?? '周期事项'} /><Tag color={item.kind.includes('overdue') ? 'red' : 'blue'}>{kindLabels[item.kind]}</Tag></List.Item>} />}
  </div>;

  return <Popover trigger="click" placement="bottomRight" content={content}><Badge count={items.length} size="small"><Button type="text" aria-label="提醒" icon={<BellOutlined />} /></Badge></Popover>;
}
