'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Segmented, Space, Spin, Typography } from 'antd';
import type { NavHistory } from '@/types';
import { calculateAnnualizedReturn, calculateMaxDrawdown, calculateTWR } from '@/lib/portfolio';
import NavChart from './NavChart';
import { buildPeriodView, periodOptions, type PeriodKey } from './portfolio-period';

const explanation = (
  <Alert
    type="info"
    showIcon
    title="收益指标口径"
    description={<span>TWR排除入金、出金影响，用于评价投资表现；XIRR考虑每笔资金投入时间，用于评价个人资金回报。</span>}
    style={{ marginBottom: 12 }}
  />
);

export default function PortfolioHistoryPanel() {
  const [history, setHistory] = useState<NavHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<PeriodKey>('all');

  useEffect(() => {
    let active = true;
    void fetch('/api/nav').then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || '历史绩效加载失败');
      if (active) setHistory(body);
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : '历史绩效加载失败');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const view = useMemo(() => {
    const periodView = buildPeriodView(history, period);
    const { userNav, spyNav } = periodView;
    const partial = periodView.rows.some((item) => item.valuation_status === 'partial');
    const twrReturn = calculateTWR(userNav) ?? 0;
    const spyReturn = calculateTWR(spyNav);
    return {
      ...periodView,
      warning: partial ? '部分日期使用最后有效价格，净值可能在行情补齐后调整。' : undefined,
      metrics: {
        twrReturn,
        annualizedReturn: calculateAnnualizedReturn(userNav),
        maxDrawdown: calculateMaxDrawdown(userNav),
        spyReturn,
        spyAnnual: calculateAnnualizedReturn(spyNav),
        spyMaxDd: calculateMaxDrawdown(spyNav),
        excessReturn: spyReturn === null ? null : twrReturn - spyReturn,
      },
    };
  }, [history, period]);

  const periodLabel = periodOptions.find((item) => item.value === period)?.label ?? '期初以来';
  const selector = <Space wrap style={{ marginBottom: 12 }}>
    <Typography.Text type="secondary">查看区间</Typography.Text>
    <Segmented options={periodOptions} value={period} onChange={(value) => setPeriod(value as PeriodKey)} />
  </Space>;

  if (loading) return <Card title="历史绩效" size="small" style={{ marginBottom: 16 }}><div style={{ textAlign: 'center', padding: 36 }}><Spin /></div></Card>;
  if (error) return <Card title="历史绩效" size="small" style={{ marginBottom: 16 }}><Alert type="error" showIcon title={error} /></Card>;
  if (history.length < 2) return <Card title="历史绩效" size="small" style={{ marginBottom: 16 }}>{explanation}<Alert type="info" showIcon title="历史数据正在积累" description="至少保存两个不同日期的每日快照后，才会显示净值曲线和绩效指标。" /></Card>;

  return <div style={{ marginBottom: 16 }}>
    {explanation}
    {selector}
    {view.shortened && <Alert type="info" showIcon title="历史数据仍在自然积累" description={`${periodLabel}目标起点为 ${view.requestedStart}，目前实际从 ${view.actualStart} 起算。`} style={{ marginBottom: 12 }} />}
    {!view.hasEnoughData
      ? <Card title={`净值走势图 · ${periodLabel}`} size="small"><Alert type="info" showIcon title="所选区间数据正在积累" description={`当前只有 ${view.userNav.length} 个每日快照，至少需要 2 个不同日期才能计算区间收益。`} /></Card>
      : <NavChart userNav={view.userNav} spyNav={view.spyNav} loading={false} metrics={view.metrics} warning={view.warning} periodLabel={periodLabel} />}
  </div>;
}
