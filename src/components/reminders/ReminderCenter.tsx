'use client';

import { BellOutlined } from '@ant-design/icons';
import { Badge, Button, Empty, List, Popover, Space, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DueReminder, DueReminderKind } from '@/lib/reminders/types';

const kindLabels: Record<DueReminderKind, string> = {
  relationship_overdue: '联系已延期', relationship_today: '今天联系', relationship_holiday: '节日联系',
  birthday_upcoming: '生日将近', birthday_today: '今天生日',
  investment_task_overdue: '投资待办已延期', investment_task_today: '今天检查',
  investment_task_price: '价格关注',
  finance_entry_review: '财务录入检查',
  goal_action_overdue: '目标行动已过期', goal_action_today: '今日目标行动',
};

export default function ReminderCenter({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<DueReminder[]>([]);
  const [quotes, setQuotes] = useState<Record<string, { loading?: boolean; text?: string; error?: string }>>({});
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetch('/api/reminders/due').then(async (response) => response.ok ? response.json() : []).then((data) => { if (active) setItems(data); });
    return () => { active = false; };
  }, [enabled]);

  const loadPreviousClose = async (item: DueReminder) => {
    if (!item.ticker_id) return;
    setQuotes((current) => ({ ...current, [item.id]: { loading: true } }));
    try {
      const response = await fetch(`/api/prices/previous-close?ticker_id=${encodeURIComponent(item.ticker_id)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '获取失败');
      setQuotes((current) => ({ ...current, [item.id]: { text: `前一日收盘：${data.price} ${data.currency ?? ''}`.trim() } }));
    } catch (error) {
      setQuotes((current) => ({ ...current, [item.id]: { error: error instanceof Error ? error.message : '获取失败' } }));
    }
  };

  const content = <div style={{ width: 380 }}>
    <Typography.Title level={5}>提醒 · {items.length}</Typography.Title>
    {items.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无提醒" /> : <List size="small" dataSource={items} renderItem={(item) => <List.Item onClick={() => router.push(item.href)} style={{ cursor: 'pointer' }}><List.Item.Meta title={item.title} description={<Space orientation="vertical" size={2}>{item.reference_price != null && <span>参考价：{item.reference_price} {item.currency ?? ''}</span>}{item.due_date && <span>提醒日期：{item.due_date}</span>}{quotes[item.id]?.text && <span>{quotes[item.id].text}</span>}{quotes[item.id]?.error && <Typography.Text type="danger">{quotes[item.id].error}</Typography.Text>}{item.ticker_id && <Button size="small" loading={quotes[item.id]?.loading} onClick={(event) => { event.stopPropagation(); void loadPreviousClose(item); }}>获取前一日收盘价</Button>}</Space>} /><Tag color={item.kind.includes('overdue') || Boolean(item.due_date && item.due_date < today) ? 'red' : 'blue'}>{kindLabels[item.kind]}</Tag></List.Item>} />}
  </div>;

  return <Popover trigger="click" placement="bottomRight" content={content}><Badge count={items.length} size="small"><Button type="text" aria-label="提醒" icon={<BellOutlined />} /></Badge></Popover>;
}
