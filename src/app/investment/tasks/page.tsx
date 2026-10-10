'use client';
import { Alert, App, Button, Segmented, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import InvestmentTaskEditor from './components/InvestmentTaskEditor';
import InvestmentTaskList from './components/InvestmentTaskList';
import type { InvestmentTask, InvestmentTaskInput, InvestmentTaskType } from '@/types/life-os';
import type { Ticker } from '@/types';
import { taskPrefillFromSearchParams } from '@/lib/investment/task-prefill';

type TaskFilter = 'active' | InvestmentTaskType | 'completed';

function toInput(task: InvestmentTask, changes: Partial<InvestmentTaskInput> = {}): InvestmentTaskInput {
  return { asset_name: task.asset_name, task_type: task.task_type, title: task.title, condition_note: task.condition_note, ticker_id: task.ticker_id, price: task.price, reminder_date: task.reminder_date, status: task.status, notes: task.notes, completed_at: task.completed_at, source_type: task.source_type, source_ref: task.source_ref, review_status: task.review_status, ...changes };
}

export default function InvestmentTasksPage() {
  const { message, modal } = App.useApp();
  const [tasks, setTasks] = useState<InvestmentTask[]>([]);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const [filter, setFilter] = useState<TaskFilter>('active'); const [editorOpen, setEditorOpen] = useState(false); const [editing, setEditing] = useState<InvestmentTask | null>(null);
  const [initialDraft, setInitialDraft] = useState<InvestmentTaskInput | null>(null);
  const initialTaskHandled = useRef(false);
  const load = useCallback(async () => { setLoading(true); setError(''); try { const [taskResponse, tickerResponse] = await Promise.all([fetch('/api/investment/tasks'), fetch('/api/tickers')]); const data = await taskResponse.json(); const tickerData = await tickerResponse.json(); if (!taskResponse.ok) throw new Error(data.error || '投资待办加载失败'); if (!tickerResponse.ok) throw new Error(tickerData.error || '标的加载失败'); setTasks(data); setTickers(tickerData); } catch (err) { setError(err instanceof Error ? err.message : '投资待办加载失败'); } finally { setLoading(false); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { if (initialTaskHandled.current || tasks.length === 0) return; initialTaskHandled.current = true; const id = new URLSearchParams(window.location.search).get('task'); const task = tasks.find((item) => item.id === id); if (task) { const timer = window.setTimeout(() => { setEditing(task); setEditorOpen(true); }, 0); return () => window.clearTimeout(timer); } }, [tasks]);
  useEffect(() => { const prefill = taskPrefillFromSearchParams(new URLSearchParams(window.location.search)); if (!prefill) return; const timer = window.setTimeout(() => { setEditing(null); setInitialDraft(prefill); setEditorOpen(true); }, 0); return () => window.clearTimeout(timer); }, []);

  const visibleTasks = useMemo(() => tasks.filter((task) => filter === 'active' ? ['pending', 'waiting'].includes(task.status) : filter === 'completed' ? task.status === 'completed' : task.task_type === filter), [filter, tasks]);
  const save = async (input: InvestmentTaskInput) => { setSaving(true); try { const response = await fetch(editing ? `/api/investment/tasks/${editing.id}` : '/api/investment/tasks', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '保存失败'); message.success(editing ? '投资待办已更新' : '投资待办已创建'); setEditorOpen(false); setEditing(null); setInitialDraft(null); window.history.replaceState(null, '', '/investment/tasks'); await load(); } catch (err) { message.error(err instanceof Error ? err.message : '保存失败'); } finally { setSaving(false); } };
  const patch = async (task: InvestmentTask, changes: Partial<InvestmentTaskInput>) => { const response = await fetch(`/api/investment/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toInput(task, changes)) }); const data = await response.json(); if (!response.ok) { message.error(data.error || '更新失败'); return; } message.success('投资待办已更新'); await load(); };
  const remove = (task: InvestmentTask) => modal.confirm({ title: '删除这项投资待办？', content: task.title, okText: '删除', okButtonProps: { danger: true }, cancelText: '取消', onOk: async () => { const response = await fetch(`/api/investment/tasks/${task.id}`, { method: 'DELETE' }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '删除失败'); message.success('投资待办已删除'); await load(); } });

  return <AuthGuard><div className="page-heading"><div><Typography.Title level={2}>投资待办</Typography.Title><Typography.Text type="secondary">记录价格位置、研究任务、验证条件和财报检查；条件需要人工判断。</Typography.Text></div><Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setInitialDraft(null); setEditorOpen(true); }}>新建投资待办</Button></div>
    {error && <Alert type="error" showIcon title="投资待办暂时不可用" description={`${error}。如尚未初始化数据库，请执行 009_investment_tasks.sql。`} style={{ marginBottom: 16 }} />}
    <div className="plan-filter-row"><Segmented value={filter} onChange={(value) => setFilter(value as TaskFilter)} options={[{ label: '待推进', value: 'active' }, { label: '价格计划', value: 'price' }, { label: '研究任务', value: 'research' }, { label: '等待验证', value: 'validation' }, { label: '财报跟踪', value: 'financial_report' }, { label: '其他', value: 'other' }, { label: '已完成', value: 'completed' }]} /></div>
    <InvestmentTaskList tasks={visibleTasks} loading={loading} onEdit={(task) => { setEditing(task); setEditorOpen(true); }} onComplete={(task) => void patch(task, { status: 'completed' })} onCancel={(task) => void patch(task, { status: 'cancelled' })} onDelete={remove} />
    <InvestmentTaskEditor open={editorOpen} initial={editing ?? initialDraft} saving={saving} tickers={tickers} onCancel={() => { setEditorOpen(false); setEditing(null); setInitialDraft(null); window.history.replaceState(null, '', '/investment/tasks'); }} onSubmit={save} />
  </AuthGuard>;
}
