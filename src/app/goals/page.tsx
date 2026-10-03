'use client';

import { Alert, App, Button, Card, Empty, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import GoalCard from './components/GoalCard';
import GoalEditor from './components/GoalEditor';
import GoalProgressModal from './components/GoalProgressModal';
import type { Goal, GoalCategory, GoalInput } from '@/types/life-os';

export default function GoalsPage() {
  const { message } = App.useApp();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/goals');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '目标加载失败');
      setGoals(data); setError('');
    } catch (err) { setError(err instanceof Error ? err.message : '目标加载失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void loadGoals(), 0); return () => window.clearTimeout(timer); }, [loadGoals]);

  const submit = async (input: GoalInput) => {
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/goals/${editing.id}` : '/api/goals', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '保存失败');
      message.success(editing ? '目标已更新' : '目标已创建');
      setOpen(false); setEditing(null); await loadGoals();
    } catch (err) { message.error(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  return <AuthGuard>
    <div className="page-heading"><div><Typography.Title level={2}>年度目标</Typography.Title><Typography.Text type="secondary">按目标类型展示真实进展，不用统一百分比掩盖停滞。</Typography.Text></div><Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setOpen(true); }}>新建目标</Button></div>
    {error && <Alert type="warning" showIcon title="年度目标尚未连接" description="请执行数据库迁移 007_goals_relationships.sql。" style={{ marginBottom: 16 }} />}
    <div className="goal-grid">{goals.map((goal) => <GoalCard key={goal.id} goal={goal} onEdit={(value) => { setEditing(value); setOpen(true); }} onProgress={setProgressGoal} />)}</div>
    {!loading && goals.length === 0 && !error && <Card><Empty description="还没有年度目标。第四季度最多保留三个核心突破。" /></Card>}
    <GoalEditor open={open} initial={editing} saving={saving} coveredCategories={goals.filter(goal => goal.year === (editing?.year ?? new Date().getFullYear())).map(goal => goal.category).filter((category): category is GoalCategory => Boolean(category))} onCancel={() => { setOpen(false); setEditing(null); }} onSubmit={submit} />
    <GoalProgressModal open={!!progressGoal} goal={progressGoal} onClose={() => setProgressGoal(null)} onSaved={() => void loadGoals()} />
  </AuthGuard>;
}
