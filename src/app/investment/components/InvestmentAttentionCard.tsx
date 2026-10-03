'use client';

import { Button, Card, Empty, List, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import type { InvestmentAttentionItem } from '@/lib/investment/attention';

type Props = {
  items: InvestmentAttentionItem[];
  loading: boolean;
  onReview: (item: InvestmentAttentionItem) => void;
  onSnooze: (item: InvestmentAttentionItem) => void;
  onComplete: (item: InvestmentAttentionItem) => void;
};

function taskHref(item: InvestmentAttentionItem) {
  const watch = item.watchItem;
  const params = new URLSearchParams({
    new: '1',
    task_type: 'research',
    title: watch?.asset_name ?? item.title,
  });
  if (watch?.reason) params.set('condition_note', watch.reason);
  return `/investment/tasks?${params.toString()}`;
}

export default function InvestmentAttentionCard({ items, loading, onReview, onSnooze, onComplete }: Props) {
  return (
    <Card
      title="今日需要关注"
      extra={<Space><Link href="/investment/watchlist">观察列表</Link><Link href="/investment/tasks">投资待办</Link></Space>}
      style={{ marginBottom: 16 }}
    >
      {!loading && items.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="目前没有到期或长期未处理的事项" />
      ) : (
        <List
          loading={loading}
          dataSource={items}
          renderItem={(item) => (
            <List.Item
              actions={[
                ...(item.source === 'watch'
                  ? [<Button key="review" size="small" type="link" onClick={() => onReview(item)}>已复核</Button>]
                  : [<Button key="complete" size="small" type="link" onClick={() => onComplete(item)}>完成</Button>]),
                <Button key="snooze" size="small" type="link" onClick={() => onSnooze(item)}>7天后提醒</Button>,
                ...(item.source === 'watch'
                  ? [<Link key="task" href={taskHref(item)}>转为待办</Link>]
                  : []),
                <Link key="open" href={item.href}>查看</Link>,
              ]}
            >
              <List.Item.Meta
                title={<Space wrap><Typography.Text strong>{item.title}</Typography.Text><Tag color={item.reason === '已逾期' ? 'red' : item.reason === '今天提醒' ? 'orange' : 'blue'}>{item.reason}</Tag></Space>}
                description={item.detail || (item.source === 'watch' ? '观察事项' : '投资待办')}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
