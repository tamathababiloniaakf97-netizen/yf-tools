'use client';

import { Alert, Button, Card, Empty, List, Skeleton, Space, Tag, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DailyThoughtCard from '@/app/components/DailyThoughtCard';
import TimeProgressCard from '@/app/components/TimeProgressCard';
import { buildDashboardActions, type DashboardActionSource, type DashboardActionUrgency } from '@/lib/dashboard/build-dashboard';
import { selectDailyThought } from '@/lib/dashboard/daily-thought';
import { buildTimeProgress } from '@/lib/dashboard/time-progress';
import { buildEntryReviewReminder } from '@/lib/household-finance/entry-review-reminder';
import { actionDeadlineLabel } from '@/lib/dashboard/action-deadline-label';
import type { HouseholdEntryReview } from '@/types/household-finance';
import type { Contact, Goal, InvestmentTask } from '@/types/life-os';

const sourceLabels: Record<DashboardActionSource, string> = { investment: '投资', goal: '年度目标', relationship: '人际关系', finance: '家庭财务' };
const urgencyColors: Record<DashboardActionUrgency, string> = { overdue: 'red', today: 'orange', upcoming: 'blue', undated: 'default' };

function shanghaiDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

async function loadSource<T>(url: string, fallback: string): Promise<T[]> {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || fallback);
  return data;
}

interface EntryReviewStatus {
  enabled: boolean;
  startedMonth: string | null;
  reviews: HouseholdEntryReview[];
  closedMonths: string[];
}

async function loadEntryReviewStatus(): Promise<EntryReviewStatus> {
  const response = await fetch('/api/household-finance/entry-reviews');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '财务检查状态加载失败');
  return data;
}

export default function HomePage() {
  const [tasks, setTasks] = useState<InvestmentTask[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [entryReviewStatus, setEntryReviewStatus] = useState<EntryReviewStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    const nowTimer = window.setTimeout(() => {
      if (active) setNow(new Date());
    }, 0);
    const load = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        loadSource<InvestmentTask>('/api/investment/tasks', '投资待办加载失败'),
        loadSource<Goal>('/api/goals', '年度目标加载失败'),
        loadSource<Contact>('/api/relationships', '人际关系加载失败'),
        loadEntryReviewStatus(),
      ]);
      if (!active) return;
      if (results[0].status === 'fulfilled') setTasks(results[0].value);
      if (results[1].status === 'fulfilled') setGoals(results[1].value);
      if (results[2].status === 'fulfilled') setContacts(results[2].value);
      if (results[3].status === 'fulfilled') setEntryReviewStatus(results[3].value);
      setErrors(results.flatMap((result) => result.status === 'rejected' ? [result.reason instanceof Error ? result.reason.message : '数据加载失败'] : []));
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
      window.clearTimeout(nowTimer);
    };
  }, []);

  const financeReminder = useMemo(() => now && entryReviewStatus?.enabled
    ? buildEntryReviewReminder(now, entryReviewStatus.startedMonth, entryReviewStatus.reviews, entryReviewStatus.closedMonths)
    : null, [entryReviewStatus, now]);
  const actions = useMemo(() => buildDashboardActions({ tasks, goals, contacts, financeReminder }, now ?? new Date()), [contacts, financeReminder, goals, now, tasks]);
  const today = useMemo(() => shanghaiDate(now ?? new Date()), [now]);
  const timeProgress = useMemo(() => now ? buildTimeProgress(now) : null, [now]);
  const dailyThought = useMemo(() => now ? selectDailyThought(now) : null, [now]);

  return (
    <AuthGuard>
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>行动工作台</Typography.Title>
          <Typography.Text type="secondary">汇总各领域需要推进的事，具体处理回到原模块完成。</Typography.Text>
        </div>
      </div>
      <div className="workbench-insight-grid">
        {timeProgress && dailyThought ? (
          <>
            <TimeProgressCard progress={timeProgress} />
            <DailyThoughtCard thought={dailyThought} />
          </>
        ) : (
          <>
            <Card className="workbench-insight-card" aria-label="时间进度加载中"><Skeleton active paragraph={{ rows: 4 }} /></Card>
            <Card className="workbench-insight-card" aria-label="每日一念加载中"><Skeleton active paragraph={{ rows: 4 }} /></Card>
          </>
        )}
      </div>
      {errors.map((error) => <Alert key={error} type="warning" showIcon message={error} style={{ marginBottom: 12 }} />)}
      <Card title={`待推进行动 · ${actions.length}`}>
        {!loading && actions.length === 0 ? <Empty description="暂无待推进行动" /> : (
          <List loading={loading} dataSource={actions} renderItem={(action) => (
            <List.Item actions={[
              <Link key="open" href={action.href} aria-label={`去处理 ${action.title}`}>
                <Button type="link">去处理 <ArrowRightOutlined /></Button>
              </Link>,
            ]}>
              <List.Item.Meta
                title={<Space wrap><Typography.Text strong>{action.title}</Typography.Text><Tag>{sourceLabels[action.source]}</Tag><Tag color={urgencyColors[action.urgency]}>{action.statusLabel ?? actionDeadlineLabel(action.dueDate, today)}</Tag></Space>}
                description={[action.context, action.dueDate].filter(Boolean).join(' · ')}
              />
            </List.Item>
          )} />
        )}
      </Card>
    </AuthGuard>
  );
}
