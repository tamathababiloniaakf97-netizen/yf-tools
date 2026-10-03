import { Card, Divider, Space, Tag, Typography } from 'antd';

import {
  dailyThoughtThemeLabels,
  type DailyThought,
} from '@/lib/dashboard/daily-thoughts';

export default function DailyThoughtCard({ thought }: { thought: DailyThought }) {
  return (
    <Card
      className="workbench-insight-card daily-thought-card"
      title="每日一念"
      extra={<Tag color="gold">{dailyThoughtThemeLabels[thought.theme]}</Tag>}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Paragraph className="daily-thought-text">
          {thought.text}
        </Typography.Paragraph>
        <Typography.Text type="secondary">{thought.attribution}</Typography.Text>
        <Divider style={{ margin: '4px 0' }} />
        <Typography.Text strong>今日自问</Typography.Text>
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          {thought.reflection}
        </Typography.Paragraph>
      </Space>
    </Card>
  );
}
