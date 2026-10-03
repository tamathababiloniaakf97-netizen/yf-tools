import { Card, Progress, Space, Typography } from 'antd';

import type { TimeProgress } from '@/lib/dashboard/time-progress';

export default function TimeProgressCard({ progress }: { progress: TimeProgress }) {
  return (
    <Card className="workbench-insight-card" title="时间进度">
      <Space direction="vertical" size={18} style={{ width: '100%' }}>
        <div>
          <Space align="baseline" wrap>
            <Typography.Title level={4} style={{ margin: 0 }}>{progress.dateLabel}</Typography.Title>
            <Typography.Text type="secondary">{progress.weekdayLabel}</Typography.Text>
          </Space>
        </div>
        <div aria-label={`本年已过 ${progress.yearPercent}%`}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Typography.Text strong>{progress.year} 年</Typography.Text>
            <Typography.Text type="secondary">第 {progress.yearDay} / {progress.yearTotalDays} 天</Typography.Text>
          </Space>
          <Progress percent={progress.yearPercent} strokeColor="#a45b2a" />
          <Typography.Text type="secondary">距离年末还有 {progress.yearRemainingDays} 天</Typography.Text>
        </div>
        <div aria-label={`本月已过 ${progress.monthPercent}%`}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Typography.Text strong>{progress.month} 月</Typography.Text>
            <Typography.Text type="secondary">第 {progress.monthDay} / {progress.monthTotalDays} 天</Typography.Text>
          </Space>
          <Progress percent={progress.monthPercent} strokeColor="#24877f" />
          <Typography.Text type="secondary">本月剩余 {progress.monthRemainingDays} 天</Typography.Text>
        </div>
      </Space>
    </Card>
  );
}
