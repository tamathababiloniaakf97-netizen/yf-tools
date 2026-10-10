'use client';

import { Alert, Card, Skeleton, Tag, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { buildCycleAlerts, describeCycleLoadError, mergeCycleProfiles } from '@/lib/investment/cycles';
import type { MarketCycleProfile } from '@/types/life-os';

const confidenceLabels = { low: '低确信', medium: '中等确信', high: '高确信' } as const;

export default function MarketCycleSummaryCard({ profiles, loading, error }: { profiles: MarketCycleProfile[]; loading: boolean; error?: string }) {
  const items = mergeCycleProfiles(profiles);
  return <Card className="market-cycle-summary" title="周期观察" extra={<Link href="/investment/cycles">进入周期复核 <ArrowRightOutlined /></Link>}>
    {error && <Alert type="warning" showIcon message="周期观察暂时无法加载" description={describeCycleLoadError(error)} style={{ marginBottom: 12 }} />}
    {loading ? <Skeleton active paragraph={{ rows: 2 }} /> : <div className="market-cycle-summary-grid">
      {items.map((item) => {
        const alerts = buildCycleAlerts(item);
        return <div className="market-cycle-summary-item" key={item.cycle_key}>
          <div className="market-cycle-summary-head"><Typography.Text strong>{item.name}</Typography.Text>{alerts.length ? <Tag color="orange">{alerts[0].title}</Tag> : <Tag>{item.id ? '无需提醒' : '待建立判断'}</Tag>}</div>
          <Typography.Text>{item.current_phase || '未判断阶段'}</Typography.Text>
          <Typography.Text type="secondary">{item.confidence ? confidenceLabels[item.confidence] : '未评估确信度'} · {item.next_review_at ? `下次 ${item.next_review_at}` : '尚未安排复核'}</Typography.Text>
        </div>;
      })}
    </div>}
    <Typography.Paragraph type="secondary" style={{ margin: '12px 0 0' }}>这里只提醒你重新思考，不连接仓位，也不生成买卖建议。</Typography.Paragraph>
  </Card>;
}
