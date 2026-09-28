'use client';

import { Alert, Button, Card, Empty, List, Space, Tag, Typography } from 'antd';
import { ArrowRightOutlined, WalletOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import WeeklyFocus from '@/app/plans/components/WeeklyFocus';
import { buildDashboard } from '@/lib/dashboard/build-dashboard';
import type { Contact, Plan, PlanInput, PlanStatus } from '@/types/life-os';

const domainLabels = { investment: '投资', annual_goal: '年度目标', life: '生活' } as const;

export default function HomePage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [planResponse, contactResponse] = await Promise.all([fetch('/api/plans'), fetch('/api/relationships')]);
      const [planData, contactData] = await Promise.all([planResponse.json(), contactResponse.json()]);
      if (!planResponse.ok) throw new Error(planData.error || '计划加载失败');
      setPlans(planData);
      if (contactResponse.ok) setContacts(contactData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '计划加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void loadPlans(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadPlans]);
  const dashboard = useMemo(() => buildDashboard(plans, contacts), [plans, contacts]);

  const updateStatus = async (id: string, status: PlanStatus) => {
    const plan = plans.find((item) => item.id === id);
    if (!plan) return;
    const payload: PlanInput = {
      title: plan.title, plan_type: plan.plan_type, domain: plan.domain,
      description: plan.description, project_id: plan.project_id,
      start_date: plan.start_date, due_date: plan.due_date,
      reminder_at: plan.reminder_at, recurrence_rule: plan.recurrence_rule,
      status, is_weekly_focus: plan.is_weekly_focus, notes: plan.notes,
      source_type: plan.source_type, source_ref: plan.source_ref,
      review_status: plan.review_status,
    };
    const response = await fetch(`/api/plans/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (response.ok) await loadPlans();
  };

  return (
    <AuthGuard>
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>本周工作台</Typography.Title>
          <Typography.Text type="secondary">不安排每天，只盯住最重要的三件事。</Typography.Text>
        </div>
        <Space>
          <Button icon={<WalletOutlined />} onClick={() => router.push('/cost')}>查看持仓</Button>
          <Button type="primary" onClick={() => router.push('/plans')}>管理计划</Button>
        </Space>
      </div>
      {error && <Alert type="warning" showIcon message="计划模块尚未连接" description="现有持仓仍可正常使用。计划功能需要先执行数据库迁移 003_life_os_core.sql。" style={{ marginBottom: 16 }} />}
      <WeeklyFocus plans={dashboard.weeklyFocus} onStatusChange={updateStatus} />
      <div className="dashboard-grid">
        <PlanSummaryCard title="需要处理" plans={dashboard.needsAttention} empty="目前没有延期事项" danger onOpenPlans={() => router.push('/plans')} />
        <RelationshipSummaryCard contacts={dashboard.relationshipAttention} onOpen={() => router.push('/relationships')} />
        <PlanSummaryCard title="正在推进" plans={dashboard.inProgress} empty={loading ? '正在加载' : '目前没有进行中的计划'} onOpenPlans={() => router.push('/plans')} />
        <PlanSummaryCard title="本周完成" plans={dashboard.completedThisWeek} empty="本周还没有完成记录" completed onOpenPlans={() => router.push('/plans')} />
      </div>
    </AuthGuard>
  );
}

function RelationshipSummaryCard({ contacts, onOpen }: { contacts: Contact[]; onOpen: () => void }) {
  return <Card title={`关系跟进 · ${contacts.length}`} extra={<Button type="link" size="small" onClick={onOpen}>查看 <ArrowRightOutlined /></Button>}>
    {contacts.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无需要联系的人" /> : <List dataSource={contacts.slice(0, 5)} renderItem={(contact) => <List.Item><List.Item.Meta title={contact.name} description={contact.next_action || `下次联系：${contact.next_contact_at}`} /><Tag color="orange">需联系</Tag></List.Item>} />}
  </Card>;
}

function PlanSummaryCard({ title, plans, empty, danger, completed, onOpenPlans }: {
  title: string; plans: Plan[]; empty: string; danger?: boolean; completed?: boolean; onOpenPlans: () => void;
}) {
  return (
    <Card title={`${title} · ${plans.length}`} extra={<Button type="link" size="small" onClick={onOpenPlans}>查看 <ArrowRightOutlined /></Button>}>
      {plans.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={empty} /> : (
        <List dataSource={plans.slice(0, 5)} renderItem={(plan) => (
          <List.Item>
            <List.Item.Meta title={plan.title} description={`${domainLabels[plan.domain]}${plan.due_date ? ` · ${plan.due_date}` : ''}`} />
            <Tag color={danger ? 'red' : completed ? 'green' : 'blue'}>{danger ? '需处理' : completed ? '已完成' : '进行中'}</Tag>
          </List.Item>
        )} />
      )}
    </Card>
  );
}
