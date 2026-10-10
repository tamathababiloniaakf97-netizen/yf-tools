'use client';

import { Button, Card, Empty, List, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useState } from 'react';
import type { InvestmentAttentionItem } from '@/lib/investment/attention';

type Props = {
  items: InvestmentAttentionItem[];
  loading: boolean;
  onReview: (item: InvestmentAttentionItem) => void;
  onSnooze: (item: InvestmentAttentionItem) => void;
  onComplete: (item: InvestmentAttentionItem) => void;
};

export function formatPlannedPriceGap(plannedPrice: number | null | undefined, currentPrice: number | null | undefined) {
  if (typeof plannedPrice !== 'number' || !Number.isFinite(plannedPrice)) return null;
  if (typeof currentPrice !== 'number' || !Number.isFinite(currentPrice) || currentPrice <= 0) return null;
  const percentage = ((plannedPrice - currentPrice) / currentPrice) * 100;
  return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
}

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
  const [quotes, setQuotes] = useState<Record<string, { loading?: boolean; price?: number; text?: string; error?: string }>>({});
  const [updatingAll, setUpdatingAll] = useState(false);
  const loadCurrentPrice = async (item: InvestmentAttentionItem) => {
    const tickerId = item.task?.ticker_id;
    if (!tickerId) return;
    setQuotes((current) => ({ ...current, [item.id]: { loading: true } }));
    try {
      const response = await fetch(`/api/prices/current?ticker_id=${encodeURIComponent(tickerId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '获取失败');
      setQuotes((current) => ({ ...current, [item.id]: { price: Number(data.price), text: `当前价：${data.price} ${data.currency ?? ''}`.trim() } }));
    } catch (error) {
      setQuotes((current) => ({ ...current, [item.id]: { error: error instanceof Error ? error.message : '获取失败' } }));
    }
  };
  const priceItems = items.filter((item) => item.reason === '价格关注' && item.task?.ticker_id);
  const updateAllPrices = async () => {
    setUpdatingAll(true);
    try {
      await Promise.all(priceItems.map(loadCurrentPrice));
    } finally {
      setUpdatingAll(false);
    }
  };
  return (
    <Card
      title="今日需要关注"
      extra={<Space>{priceItems.length > 0 && <Button size="small" type="link" loading={updatingAll} onClick={() => void updateAllPrices()}>一键更新价格</Button>}<Link href="/investment/watchlist">观察列表</Link><Link href="/investment/tasks">投资待办</Link></Space>}
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
                ...(item.reason === '价格关注' ? [<Button key="quote" size="small" type="link" loading={quotes[item.id]?.loading} onClick={() => void loadCurrentPrice(item)}>获取当前价</Button>] : [<Button key="snooze" size="small" type="link" onClick={() => onSnooze(item)}>7天后提醒</Button>]),
                ...(item.source === 'watch'
                  ? [<Link key="task" href={taskHref(item)}>转为待办</Link>]
                  : []),
                <Link key="open" href={item.href}>查看</Link>,
              ]}
            >
              <List.Item.Meta
                title={item.reason === '价格关注' ? <Space data-testid="price-attention-line" wrap size={12}><Typography.Text strong>{item.title}</Typography.Text><Tag color="blue">价格关注</Tag><Typography.Text>{item.detail || '投资待办'}</Typography.Text>{item.task?.price != null && <Typography.Text type="secondary">计划买入价：{item.task.price}</Typography.Text>}{quotes[item.id]?.text && <Typography.Text type="secondary">{quotes[item.id].text}</Typography.Text>}{formatPlannedPriceGap(item.task?.price, quotes[item.id]?.price) && <Typography.Text type="secondary">计划价距当前价：{formatPlannedPriceGap(item.task?.price, quotes[item.id]?.price)}</Typography.Text>}{quotes[item.id]?.error && <Typography.Text type="danger">{quotes[item.id].error}</Typography.Text>}</Space> : <Space wrap><Typography.Text strong>{item.title}</Typography.Text><Tag color={item.reason === '已逾期' ? 'red' : item.reason === '今天提醒' ? 'orange' : 'default'}>{item.reason}</Tag></Space>}
                description={item.reason === '价格关注' ? undefined : <Space orientation="vertical" size={2}><span>{item.detail || (item.source === 'watch' ? '观察事项' : '投资待办')}</span></Space>}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
