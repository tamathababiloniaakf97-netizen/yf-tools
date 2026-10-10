'use client';
import { Button, Card, Empty, List, Space, Tag, Typography } from 'antd';
import type { InvestmentTask, InvestmentTaskStatus, InvestmentTaskType } from '@/types/life-os';

export const taskTypeLabels: Record<InvestmentTaskType, string> = { price: '价格计划', research: '研究任务', validation: '等待验证', financial_report: '财报跟踪', other: '其他' };
export const taskStatusLabels: Record<InvestmentTaskStatus, string> = { pending: '待处理', waiting: '等待中', completed: '已完成', cancelled: '已取消' };

export default function InvestmentTaskList({ tasks, loading, onEdit, onComplete, onCancel, onDelete }: { tasks: InvestmentTask[]; loading: boolean; onEdit: (task: InvestmentTask) => void; onComplete: (task: InvestmentTask) => void; onCancel: (task: InvestmentTask) => void; onDelete: (task: InvestmentTask) => void }) {
  if (!loading && tasks.length === 0) return <Card><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有投资待办" /></Card>;
  return <List loading={loading} grid={{ gutter: 16, column: 2, xs: 1 }} dataSource={tasks} renderItem={(task) => <List.Item><Card title={<Space wrap>{task.asset_name && <Typography.Text strong>{task.asset_name}</Typography.Text>}<Tag color="blue">{taskTypeLabels[task.task_type]}</Tag><Tag>{taskStatusLabels[task.status]}</Tag></Space>}>
    <Typography.Title level={5}>{task.title}</Typography.Title>
    {task.condition_note && <Typography.Paragraph><Typography.Text type="secondary">条件或关注点：</Typography.Text>{task.condition_note}</Typography.Paragraph>}
    {task.price != null && <Typography.Paragraph><Typography.Text type="secondary">提醒价格：</Typography.Text>{task.price}</Typography.Paragraph>}
    <Typography.Text type="secondary">{task.reminder_date ? `提醒日期：${task.reminder_date}` : '未设置提醒日期'}</Typography.Text>
    {task.notes && <Typography.Paragraph style={{ marginTop: 8 }}>{task.notes}</Typography.Paragraph>}
    <Space wrap style={{ marginTop: 16 }}><Button size="small" onClick={() => onEdit(task)}>编辑</Button>{!['completed', 'cancelled'].includes(task.status) && <><Button size="small" type="primary" onClick={() => onComplete(task)}>完成</Button><Button size="small" onClick={() => onCancel(task)}>取消</Button></>}<Button size="small" danger onClick={() => onDelete(task)}>删除</Button></Space>
  </Card></List.Item>} />;
}
