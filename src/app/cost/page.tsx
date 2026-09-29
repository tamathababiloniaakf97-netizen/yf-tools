'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button, Space, Card, App } from 'antd';
import { PlusOutlined, SwapOutlined, ReloadOutlined } from '@ant-design/icons';
import AuthGuard from '@/components/AuthGuard';
import AccountSummaryCards from './components/AccountSummaryCards';
import PositionTable from './components/PositionTable';
import TransactionModal from './components/TransactionModal';
import TickerModal from './components/TickerModal';
import TransactionPanel from './components/TransactionPanel';
import NavChart from './components/NavChart';
import { calculateAccountSummary } from '@/lib/cost-engine';
import { calculateAllMetrics } from '@/lib/portfolio';
import type { Ticker, Transaction, AccountSummary } from '@/types';

export default function CostPage() {
  const { message } = App.useApp();
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Modal state
  const [tickerModalOpen, setTickerModalOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewTickerId, setViewTickerId] = useState<string | undefined>();

  // NAV chart state
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [priceUpdatedAt, setPriceUpdatedAt] = useState<Record<string, string | null>>({});
  const [spyNav, setSpyNav] = useState<{ date: string; nav: number }[]>([]);
  const [spyError, setSpyError] = useState<string | undefined>();

  // 从 tickers 构建 currentPrices（数据库中的 current_price 优先）
  const buildPricesFromTickers = useCallback((tickersData: Ticker[]) => {
    const prices: Record<string, number> = {};
    const updatedAt: Record<string, string | null> = {};
    // 先读 localStorage 作为旧数据兼容
    const savedPrices = localStorage.getItem('currentPrices');
    const localPrices: Record<string, number> = savedPrices ? JSON.parse(savedPrices) : {};

    for (const t of tickersData) {
      // 数据库价格优先
      if (t.current_price !== null && t.current_price > 0) {
        prices[t.id] = t.current_price;
      } else if (localPrices[t.id]) {
        prices[t.id] = localPrices[t.id];
      }
      updatedAt[t.id] = t.price_updated_at;
    }
    return { prices, updatedAt };
  }, []);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/positions');
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      const tickersData: Ticker[] = data.tickers || [];
      setTickers(tickersData);

      // 从 tickers 恢复现价
      const { prices, updatedAt } = buildPricesFromTickers(tickersData);
      setCurrentPrices(prices);
      setPriceUpdatedAt(updatedAt);

      // 计算账户汇总
      const accountSummary = calculateAccountSummary(
        data.transactions || [],
        tickersData,
        prices
      );
      setSummary(accountSummary);
    } catch (err) {
      console.error(err);
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  }, [message, buildPricesFromTickers]);

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const res = await fetch('/api/transactions');
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setTransactions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadTransactions();
  }, [loadData, loadTransactions]);

  // 保存现价（本地+服务器）
  const handlePriceChange = async (tickerId: string, price: number) => {
    const newPrices = { ...currentPrices, [tickerId]: price };
    setCurrentPrices(newPrices);
    localStorage.setItem('currentPrices', JSON.stringify(newPrices));

    // 重新计算汇总
    const newSummary = calculateAccountSummary(transactions, tickers, newPrices);
    setSummary(newSummary);

    // 保存到数据库
    try {
      const today = new Date().toISOString().split('T')[0];
      await fetch('/api/tickers/' + tickerId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_price: price }),
      });
      setPriceUpdatedAt((prev) => ({ ...prev, [tickerId]: today }));
    } catch {
      // 静默失败，localStorage 已有备份
    }
  };

  // 一键更新收盘价
  const handleSyncPrices = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/prices/sync', { method: 'POST' });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.error || '同步失败');
      }
      const data = await res.json();

      // 更新价格
      const newPrices = { ...currentPrices };
      const newUpdatedAt: Record<string, string | null> = { ...priceUpdatedAt };
      const failed: { code: string; error: string }[] = [];

      for (const r of data.results as Array<{
        id: string;
        code: string;
        status: 'updated' | 'failed';
        price: number | null;
        updated_at?: string;
        error?: string;
      }>) {
        if (r.status === 'updated' && r.price !== null && r.updated_at) {
          newPrices[r.id] = r.price;
          newUpdatedAt[r.id] = r.updated_at;
        } else {
          failed.push({ code: r.code, error: r.error || '未知错误' });
        }
      }

      setCurrentPrices(newPrices);
      setPriceUpdatedAt(newUpdatedAt);
      localStorage.setItem('currentPrices', JSON.stringify(newPrices));

      // 重新计算汇总
      const newSummary = calculateAccountSummary(transactions, tickers, newPrices);
      setSummary(newSummary);

      const count = data.summary?.updated ?? data.results.length - failed.length;
      if (failed.length === data.results.length) {
        message.error(`更新失败：${failed.map((item) => `${item.code}（${item.error}）`).join('；')}`);
      } else if (failed.length > 0) {
        message.warning(`已更新 ${count} 个，${failed.length} 个失败：${failed.map((item) => `${item.code}（${item.error}）`).join('；')}`);
      } else {
        message.success(`已更新 ${count} 个标的收盘价`);
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '同步失败，请稍后重试');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  // 统一计算所有指标（portfolio.ts）
  const portfolioMetrics = React.useMemo(() => {
    if (transactions.length === 0 || tickers.length === 0) {
      return { navSeries: [], twrReturn: null, annualizedReturn: null, maxDrawdown: 0, accountReturn: null };
    }
    return calculateAllMetrics(
      transactions,
      tickers,
      currentPrices,
      summary?.totalAssets ?? 0,
      summary?.totalInvested ?? 0,
      60 // 年化至少 60 天
    );
  }, [transactions, tickers, currentPrices, summary]);

  const userNav = portfolioMetrics.navSeries;
  const strategyReturnPercent = portfolioMetrics.twrReturn;
  const annualizedReturn = portfolioMetrics.annualizedReturn;
  const maxDrawdown = portfolioMetrics.maxDrawdown;
  const accountReturnPercent = portfolioMetrics.accountReturn;

  // 获取标普500数据
  useEffect(() => {
    if (userNav.length === 0) return;
    const startDate = userNav[0].date;

    fetch(`/api/spy?start=${startDate}`)
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error); });
        return res.json();
      })
      .then((data) => {
        setSpyNav(data.series || []);
        setSpyError(undefined);
      })
      .catch((err) => {
        console.error('SPY fetch error:', err);
        setSpyError(err.message || '基准数据暂时无法获取');
        setSpyNav([]);
      });
  }, [userNav]);

  return (
    <AuthGuard>
      {/* 顶部操作栏 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setTickerModalOpen(true)}>
            添加标的
          </Button>
          <Button icon={<SwapOutlined />} onClick={() => { setEditingTransaction(null); setTxModalOpen(true); }}>
            录入交易
          </Button>
        </Space>
        <Button icon={<ReloadOutlined />} onClick={() => { loadData(); loadTransactions(); }}>
          刷新数据
        </Button>
      </div>

      {/* 账户总览 */}
      <AccountSummaryCards
        summary={summary}
        loading={loading}
        strategyReturnPercent={strategyReturnPercent}
        accountReturnPercent={accountReturnPercent}
      />

      {/* 持仓列表 */}
      <Card title="持仓明细" size="small" style={{ marginBottom: 16 }}>
        <PositionTable
          positions={summary?.positions || []}
          loading={loading}
          onViewTransactions={(tickerId) => {
            setViewTickerId(tickerId);
            document.getElementById('transactions-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onPriceChange={handlePriceChange}
          onSyncPrices={handleSyncPrices}
          onRefresh={loadData}
          syncing={syncing}
          priceUpdatedAt={priceUpdatedAt}
        />
      </Card>

      {/* 净值曲线图 */}
      <div style={{ marginBottom: 16 }}>
        <NavChart
          userNav={userNav}
          spyNav={spyNav}
          loading={loading}
          spyError={spyError}
          metrics={userNav.length >= 2 ? {
            twrReturn: strategyReturnPercent ?? 0,
            annualizedReturn,
            maxDrawdown,
            spyReturn: spyNav.length >= 2
              ? ((spyNav[spyNav.length - 1].nav - spyNav[0].nav) / spyNav[0].nav) * 100
              : null,
            spyAnnual: spyNav.length >= 2
              ? (() => { const d = (new Date(spyNav[spyNav.length - 1].date).getTime() - new Date(spyNav[0].date).getTime()) / 86400000; return d >= 60 ? (Math.pow(spyNav[spyNav.length - 1].nav / spyNav[0].nav, 365 / d) - 1) * 100 : null; })()
              : null,
            spyMaxDd: (() => { if (spyNav.length === 0) return 0; let p = spyNav[0].nav; let m = 0; for (const s of spyNav) { if (s.nav > p) p = s.nav; const d = (p - s.nav) / p; if (d > m) m = d; } return m * 100; })(),
          } : null}
        />
      </div>

      {/* 交易流水 */}
      <div id="transactions-section">
        <Card title="交易流水" size="small">
          <TransactionPanel
            transactions={transactions}
            tickerIdFilter={viewTickerId}
            loading={txLoading}
            onRefresh={() => { loadData(); loadTransactions(); }}
            onFilterChange={() => {}}
            onEdit={(tx) => { setEditingTransaction(tx); setTxModalOpen(true); }}
          />
        </Card>
      </div>

      {/* Modals */}
      <TickerModal
        open={tickerModalOpen}
        onClose={() => setTickerModalOpen(false)}
        onSuccess={() => { loadData(); loadTransactions(); }}
      />
      <TransactionModal
        open={txModalOpen}
        onClose={() => { setTxModalOpen(false); setEditingTransaction(null); }}
        onSuccess={() => { loadData(); loadTransactions(); setEditingTransaction(null); }}
        tickers={tickers}
        openPositions={summary?.openOptions ?? []}
        editingTransaction={editingTransaction}
      />
    </AuthGuard>
  );
}
