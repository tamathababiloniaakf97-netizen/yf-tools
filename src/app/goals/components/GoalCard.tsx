'use client';

import { Button, Card, Progress, Space, Tag, Typography } from 'antd';
import { buildGoalProgress, getStagnation } from '@/lib/goals/progress';
import type { Goal } from '@/types/life-os';
import { goalCategoryLabels } from '@/lib/goals/categories';

const typeLabels = { result: '结果型', project: '项目型', habit: '习惯型', direction: '方向型' } as const;
const periodLabels = { weekly: '本周', monthly: '本月', quarterly: '本季度' } as const;

export default function GoalCard({ goal, now = new Date(), onEdit, onProgress }: { goal: Goal; now?: Date; onEdit: (goal: Goal) => void; onProgress?: (goal: Goal) => void }) {
  const progress = buildGoalProgress(goal);
  const stagnation = getStagnation(goal, now);
  return <Card title={goal.title} extra={<Space wrap>{goal.category ? <Tag color="purple">{goalCategoryLabels[goal.category]}</Tag> : <Tag>未分类</Tag>}<Tag color="blue">{typeLabels[goal.goal_type]}</Tag>{stagnation && <Tag color={stagnation === 'stalled' ? 'red' : 'orange'}>{stagnation === 'stalled' ? '已停滞' : '需要检查'}</Tag>}{onProgress ? <Button type="primary" size="small" onClick={() => onProgress(goal)}>更新进展</Button> : null}<Button type="link" size="small" onClick={() => onEdit(goal)}>编辑</Button></Space>}>
    {goal.description && <Typography.Paragraph type="secondary">{goal.description}</Typography.Paragraph>}
    {progress.kind === 'value' && <><Typography.Paragraph>{progress.current ?? 0} / {progress.target ?? '-'} {progress.unit}</Typography.Paragraph>{progress.percent !== null && <Progress percent={progress.percent} size="small" />}</>}
    {progress.kind === 'milestone' && <Typography.Paragraph>当前里程碑：{progress.milestone || '尚未填写'}</Typography.Paragraph>}
    {progress.kind === 'habit' && <Typography.Paragraph>{progress.period ? periodLabels[progress.period] : '本周期'}：{progress.completed ?? 0} / {progress.target ?? '-'} 次</Typography.Paragraph>}
    {progress.kind === 'direction' && <Typography.Paragraph>当前状态：{progress.currentState || '尚未填写'}</Typography.Paragraph>}
    <Typography.Paragraph>完成标准：{goal.completion_criteria}</Typography.Paragraph>
    <Typography.Paragraph strong>下一步：{goal.next_action}</Typography.Paragraph>
    <Typography.Paragraph type={goal.next_action_due_at ? undefined : 'secondary'}>截止：{goal.next_action_due_at || '未设置'}</Typography.Paragraph>
  </Card>;
}
