'use client';

import { Alert, App, Button, Card, Col, Empty, Row, Statistic, Table, Tag, Typography } from 'antd';
import { ArrowRightOutlined, WalletOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import AuthGuard from '@/components/AuthGuard';
import { calculateAccountSummary } from '@/lib/cost-engine';
import { buildInvestmentAttentionItems, type InvestmentAttentionItem } from '@/lib/investment/attention';
import { buildPortfolioOverview } from '@/lib/investment/overview';
import InvestmentAttentionCard from './components/InvestmentAttentionCard';
import InvestmentMotto from './components/InvestmentMotto';
import MarketCycleSummaryCard from './components/MarketCycleSummaryCard';
import type { AccountSummary, Ticker, Transaction } from '@/types';
import type { InvestmentTask, MarketCycleProfile, WatchlistItem } from '@/types/life-os';

function dateAfter(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function taskInput(task: InvestmentTask, changes: Record<string, unknown>) {
  return {
    asset_name: task.asset_name, task_type: task.task_type, title: task.title,
    condition_note: task.condition_note, ticker_id: task.ticker_id, price: task.price, reminder_date: task.reminder_date,
    status: task.status, notes: task.notes, completed_at: task.completed_at,
    source_type: task.source_type, source_ref: task.source_ref,
    review_status: task.review_status, ...changes,
  };
}

export default function InvestmentOverviewPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [watchItems, setWatchItems] = useState<WatchlistItem[]>([]);
  const [tasks, setTasks] = useState<InvestmentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [attentionLoading, setAttentionLoading] = useState(true);
  const [error, setError] = useState('');
  const [attentionError, setAttentionError] = useState('');
  const { data: cycleProfiles = [], error: cycleError, isLoading: cycleLoading } = useSWR<MarketCycleProfile[]>('/api/investment/cycles');

  const loadAttention = useCallback(async () => {
    setAttentionLoading(true);
    try {
      const [watchResponse, taskResponse] = await Promise.all([
        fetch('/api/investment/watchlist'), fetch('/api/investment/tasks'),
      ]);
      const [watchData, taskData] = await Promise.all([watchResponse.json(), taskResponse.json()]);
      if (!watchResponse.ok) throw new Error(watchData.error || '观察列表加载失败');
      if (!taskResponse.ok) throw new Error(taskData.error || '投资待办加载失败');
      setWatchItems(watchData);
      setTasks(taskData);
      setAttentionError('');
    } catch (err) {
      setAttentionError(err instanceof Error ? err.message : '需要关注的事项加载失败');
    } finally {
      setAttentionLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/positions')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '持仓数据加载失败');
        const tickers = (data.tickers ?? []) as Ticker[];
        const transactions = (data.transactions ?? []) as Transaction[];
        const prices = Object.fromEntries(tickers.filter((item) => item.current_price !== null).map((item) => [item.id, item.current_price as number]));
        setSummary(calculateAccountSummary(transactions, tickers, prices));
      })
      .catch((err) => setError(err instanceof Error ? err.message : '持仓数据加载失败'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAttention(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAttention]);

  const overview = useMemo(() => summary ? buildPortfolioOverview(summary) : null, [summary]);
  const attentionItems = useMemo(() => buildInvestmentAttentionItems({ tasks, watchItems, limit: 6 }), [tasks, watchItems]);

  const updateAttentionItem = async (item: InvestmentAttentionItem, changes: Record<string, unknown>, success: string) => {
    const response = await fetch(item.source === 'watch' ? `/api/investment/watchlist/${item.sourceId}` : `/api/investment/tasks/${item.sourceId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes),
    });
    const data = await response.json();
    if (!response.ok) { message.error(data.error || '更新失败'); return; }
    message.success(success);
    await loadAttention();
  };

  const review = (item: InvestmentAttentionItem) => void updateAttentionItem(item, { next_check_at: null }, '已标记为本次复核完成');
  const snooze = (item: InvestmentAttentionItem) => void updateAttentionItem(item, item.source === 'watch' ? { next_check_at: dateAfter(7) } : taskInput(item.task!, { reminder_date: dateAfter(7) }), '将在7天后重新提醒');
  const complete = (item: InvestmentAttentionItem) => void updateAttentionItem(item, taskInput(item.task!, { status: 'completed', completed_at: new Date().toISOString() }), '投资待办已完成');

  return (
    <AuthGuard>
      <div className="page-heading">
        <div><div className="investment-overview-title-row"><Typography.Title level={2}>投资概览</Typography.Title><InvestmentMotto /></div><Typography.Text type="secondary">只汇总账户结果和需要注意的风险；交易明细仍在原持仓页面。</Typography.Text></div>
        <Button type="primary" icon={<WalletOutlined />} onClick={() => router.push('/cost')}>进入持仓</Button>
      </div>
      {error && <Alert type="error" showIcon message="持仓数据加载失败" description={error} style={{ marginBottom: 16 }} />}
      {attentionError && <Alert type="warning" showIcon message="需要关注的事项暂时无法加载" description={attentionError} style={{ marginBottom: 16 }} />}
      <InvestmentAttentionCard items={attentionItems} loading={attentionLoading} onReview={review} onSnooze={snooze} onComplete={complete} />
      <MarketCycleSummaryCard profiles={cycleProfiles} loading={cycleLoading} error={cycleError instanceof Error ? cycleError.message : cycleError ? '未知错误' : undefined} />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}><Card loading={loading}><Statistic title="总资产" value={summary?.totalAssets ?? 0} precision={2} prefix="$" /></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card loading={loading}><Statistic title="总盈亏" value={summary?.totalPnL ?? 0} precision={2} prefix="$" valueStyle={{ color: (summary?.totalPnL ?? 0) >= 0 ? '#12a06b' : '#cf1322' }} /></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card loading={loading}><Statistic title="账户收益率" value={summary?.pnlPercent ?? 0} precision={2} suffix="%" /></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card loading={loading}><Statistic title="现金比例" value={overview?.cashRatio ?? 0} precision={1} suffix="%" /></Card></Col>
        <Col xs={24} lg={8}>
          <Card title="当前主要风险" loading={loading}>
            <Alert type={overview?.primaryRiskLevel ?? 'success'} showIcon message={overview?.primaryRisk ?? '暂无数据'} />
            <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>这里仅提示组合结构，不生成买卖建议。</Typography.Paragraph>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="主要持仓" extra={<Button type="link" onClick={() => router.push('/cost')}>完整持仓 <ArrowRightOutlined /></Button>}>
            {!loading && overview?.topPositions.length === 0 ? <Empty description="暂无持仓" /> : (
              <Table loading={loading} pagination={false} rowKey={(item) => item.ticker.id} dataSource={overview?.topPositions ?? []} columns={[
                { title: '标的', render: (_, item) => <div><Typography.Text strong>{item.ticker.name}</Typography.Text><br /><Typography.Text type="secondary">{item.ticker.code}</Typography.Text></div> },
                { title: '市值', dataIndex: 'marketValue', render: (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
                { title: '仓位', dataIndex: 'allocPercent', render: (value: number) => `${value.toFixed(1)}%` },
                { title: '盈亏', render: (_, item) => <Tag color={item.pnl >= 0 ? 'green' : 'red'}>{item.pnlPercent >= 0 ? '+' : ''}{item.pnlPercent.toFixed(1)}%</Tag> },
              ]} />
            )}
          </Card>
        </Col>
      </Row>
    </AuthGuard>
  );
}
