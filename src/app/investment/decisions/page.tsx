'use client';
import { Alert, App, Button, Card, Segmented, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DecisionList from './components/DecisionList';
import type { InvestmentDecision, InvestmentDecisionStatus } from '@/types/life-os';

type Filter = 'all' | InvestmentDecisionStatus;
export default function InvestmentDecisionsPage() {
  const { message, modal } = App.useApp(); const [items, setItems] = useState<InvestmentDecision[]>([]); const [filter, setFilter] = useState<Filter>('all'); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); try { const query = filter === 'all' ? '' : `?status=${filter}`; const response = await fetch(`/api/investment/decisions${query}`); const data = await response.json(); if (!response.ok) throw new Error(data.error || '投资决策加载失败'); setItems(data); setError(''); } catch (err) { setError(err instanceof Error ? err.message : '投资决策加载失败'); } finally { setLoading(false); } }, [filter]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const remove = (item: InvestmentDecision) => modal.confirm({ title: `删除${item.status === 'finalized' ? '已定稿的历史决策' : '决策草稿'}？`, content: `${item.asset_name} · ${item.final_reason || '未完成'}`, okText: '删除', okButtonProps: { danger: true }, cancelText: '取消', onOk: async () => { const response = await fetch(`/api/investment/decisions/${item.id}`, { method: 'DELETE' }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '删除失败'); message.success('投资决策已删除'); await load(); } });
  return <AuthGuard><div className="page-heading"><div><Typography.Title level={2}>投资决策</Typography.Title><Typography.Text type="secondary">行动前完整想明白；定稿后保留当时的真实判断。</Typography.Text></div><Link href="/investment/decisions/new"><Button type="primary" icon={<PlusOutlined />}>新建投资决策</Button></Link></div>
    {error && <Alert type="error" showIcon message="投资决策暂时不可用" description={`${error}。请执行数据库迁移 010。`} style={{ marginBottom: 16 }} />}
    <Card><Segmented value={filter} onChange={(value) => setFilter(value as Filter)} options={[{ label: '全部', value: 'all' }, { label: '草稿', value: 'draft' }, { label: '已定稿', value: 'finalized' }]} style={{ marginBottom: 16 }} /><DecisionList items={items} loading={loading} onDelete={remove} /></Card>
  </AuthGuard>;
}
