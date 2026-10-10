'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Spin } from 'antd';
import type { NavHistory } from '@/types';
import { calculateAnnualizedReturn, calculateMaxDrawdown, calculateTWR } from '@/lib/portfolio';
import NavChart from './NavChart';

const explanation = (
  <Alert
    type="info"
    showIcon
    message="收益指标口径"
    description={<span>TWR排除入金、出金影响，用于评价投资表现；XIRR考虑每笔资金投入时间，用于评价个人资金回报。</span>}
    style={{ marginBottom: 12 }}
  />
);

export default function PortfolioHistoryPanel() {
  const [history, setHistory] = useState<NavHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    const userNav = history.map((item) => ({ date: item.date, nav: Number(item.nav) }));
    const benchmarkRows = history.filter((item) => item.benchmark_nav != null && Number(item.benchmark_nav) > 0);
    const benchmarkBase = benchmarkRows.length > 0 ? Number(benchmarkRows[0].benchmark_nav) : null;
    const spyNav = benchmarkBase
      ? benchmarkRows.map((item) => ({ date: item.date, nav: Number(item.benchmark_nav) / benchmarkBase }))
      : [];
    const partial = history.some((item) => item.valuation_status === 'partial');
    return {
      userNav,
      spyNav,
      warning: partial ? '部分日期使用最后有效价格，净值可能在行情补齐后调整。' : undefined,
      metrics: {
        twrReturn: calculateTWR(userNav) ?? 0,
        annualizedReturn: calculateAnnualizedReturn(userNav),
        maxDrawdown: calculateMaxDrawdown(userNav),
        spyReturn: calculateTWR(spyNav),
        spyAnnual: calculateAnnualizedReturn(spyNav),
        spyMaxDd: calculateMaxDrawdown(spyNav),
      },
    };
  }, [history]);

  if (loading) return <Card title="历史绩效" size="small" style={{ marginBottom: 16 }}><div style={{ textAlign: 'center', padding: 36 }}><Spin /></div></Card>;
  if (error) return <Card title="历史绩效" size="small" style={{ marginBottom: 16 }}><Alert type="error" showIcon message={error} /></Card>;
  if (history.length < 2) return <Card title="历史绩效" size="small" style={{ marginBottom: 16 }}>{explanation}<Alert type="info" showIcon message="历史数据正在积累" description="至少保存两个不同日期的每日快照后，才会显示净值曲线和绩效指标。" /></Card>;

  return <div style={{ marginBottom: 16 }}>
    {explanation}
    <NavChart userNav={view.userNav} spyNav={view.spyNav} loading={false} metrics={view.metrics} warning={view.warning} />
  </div>;
}
