'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Alert, Button, Space, Card, App, Statistic, Tag } from 'antd';
import { PlusOutlined, SwapOutlined, ReloadOutlined, SettingOutlined, DatabaseOutlined } from '@ant-design/icons';
import AuthGuard from '@/components/AuthGuard';
import AccountSummaryCards from './components/AccountSummaryCards';
import PositionTable from './components/PositionTable';
import TransactionModal from './components/TransactionModal';
import TickerModal from './components/TickerModal';
import TickerManagerModal from './components/TickerManagerModal';
import TransactionPanel from './components/TransactionPanel';
import PendingOrdersPanel from './components/PendingOrdersPanel';
import PortfolioOpeningModal from './components/PortfolioOpeningModal';
import { calculateAccountSummary } from '@/lib/cost-engine';
import type { Ticker, Transaction, AccountSummary, PendingOrder, PortfolioOpening, PortfolioOpeningPosition, TickerStyle } from '@/types';

export default function CostPage() {
  const { message } = App.useApp();
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [pendingOrdersLoading, setPendingOrdersLoading] = useState(true);
  const [pendingOrderTickerId, setPendingOrderTickerId] = useState<string>();
  const [opening, setOpening] = useState<PortfolioOpening | null>(null);
  const [openingPositions, setOpeningPositions] = useState<PortfolioOpeningPosition[]>([]);

  // Modal state
  const [tickerModalOpen, setTickerModalOpen] = useState(false);
  const [tickerManagerOpen, setTickerManagerOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewTickerId, setViewTickerId] = useState<string | undefined>();
  const [openingModalOpen, setOpeningModalOpen] = useState(false);

  // NAV chart state
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [priceUpdatedAt, setPriceUpdatedAt] = useState<Record<string, string | null>>({});

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
      setTransactions(data.transactions || []);
      setOpening(data.opening ?? null);
      setOpeningPositions(data.openingPositions ?? []);

      // 从 tickers 恢复现价
      const { prices, updatedAt } = buildPricesFromTickers(tickersData);
      setCurrentPrices(prices);
      setPriceUpdatedAt(updatedAt);

      // 计算账户汇总
      const accountSummary = calculateAccountSummary(data.transactions || [], tickersData, prices,
        data.opening ? { opening: data.opening, positions: data.openingPositions || [] } : null);
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

  const loadPendingOrders = useCallback(async () => {
    setPendingOrdersLoading(true);
    try {
      const res = await fetch('/api/pending-orders');
      if (!res.ok) throw new Error('挂单加载失败');
      setPendingOrders(await res.json());
    } catch (err) {
      console.error(err);
      message.error('挂单加载失败');
    } finally {
      setPendingOrdersLoading(false);
    }
  }, [message]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void Promise.all([loadData(), loadTransactions(), loadPendingOrders()]);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadData, loadTransactions, loadPendingOrders]);

  // 保存现价（本地+服务器）
  const handlePriceChange = async (tickerId: string, price: number) => {
    const newPrices = { ...currentPrices, [tickerId]: price };
    setCurrentPrices(newPrices);
    localStorage.setItem('currentPrices', JSON.stringify(newPrices));

    // 重新计算汇总
    const newSummary = calculateAccountSummary(transactions, tickers, newPrices, opening ? { opening, positions: openingPositions } : null);
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
      const newSummary = calculateAccountSummary(transactions, tickers, newPrices, opening ? { opening, positions: openingPositions } : null);
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

  const earliestTransactionDate = transactions.length > 0
    ? transactions.reduce((earliest, transaction) => transaction.trade_date < earliest ? transaction.trade_date : earliest, transactions[0].trade_date)
    : null;
  const styleAllocation = React.useMemo(() => {
    if (!summary || summary.marketValue <= 0) return [];
    const labels: Record<TickerStyle, { label: string; color: string }> = { offensive: { label: '进攻', color: 'red' }, balanced: { label: '平衡', color: 'blue' }, defensive: { label: '防守', color: 'green' } };
    const values = new Map<TickerStyle, number>();
    summary.positions.forEach(position => { if (position.ticker.style) values.set(position.ticker.style, (values.get(position.ticker.style) ?? 0) + position.marketValue); });
    return [...values.entries()].map(([style, value]) => ({ ...labels[style], percent: value / summary.marketValue * 100 }));
  }, [summary]);

  return (
    <AuthGuard>
      {/* 顶部操作栏 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setTickerModalOpen(true)}>
            添加标的
          </Button>
          <Button icon={<SettingOutlined />} onClick={() => setTickerManagerOpen(true)}>
            管理标的
          </Button>
          <Button icon={<SwapOutlined />} onClick={() => { setEditingTransaction(null); setTxModalOpen(true); }}>
            录入交易
          </Button>
          <Button icon={<DatabaseOutlined />} onClick={() => setOpeningModalOpen(true)}>
            {opening ? '编辑期初账户' : '设置期初账户'}
          </Button>
        </Space>
        <Button icon={<ReloadOutlined />} onClick={() => { loadData(); loadTransactions(); }}>
          刷新数据
        </Button>
      </div>

      {/* 账户总览 */}
      {!opening && <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="请先设置期初账户" description="完成期初现金与期初持仓后，系统才能正确计算净入金、累计盈亏和 XIRR。" />}
      <AccountSummaryCards summary={summary} loading={loading} />

      {/* 持仓列表 */}
      <Card title="持仓明细" size="small" style={{ marginBottom: 16 }}>
        <Space wrap size="large" style={{ marginBottom: 12 }}>
          <Statistic title="股票敞口" value={summary?.stockExposurePercent ?? 0} precision={1} suffix="%" styles={{ content: { fontSize: 18 } }} />
          <Statistic title="融资倍数" value={summary?.leverageMultiple ?? 0} precision={2} suffix="x" styles={{ content: { fontSize: 18 } }} />
          {styleAllocation.length > 0 && <div><div style={{ color: 'rgba(0,0,0,0.45)', marginBottom: 6 }}>风格占比</div><Space size={4}>{styleAllocation.map(item => <Tag key={item.label} color={item.color}>{item.label} {item.percent.toFixed(0)}%</Tag>)}</Space></div>}
        </Space>
        <PositionTable
          positions={summary?.positions || []}
          loading={loading}
          onViewTransactions={(tickerId) => {
            setViewTickerId(tickerId);
            document.getElementById('transactions-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onViewPendingOrders={(tickerId) => {
            setPendingOrderTickerId(tickerId);
            document.getElementById('pending-orders-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onPriceChange={handlePriceChange}
          onSyncPrices={handleSyncPrices}
          onRefresh={loadData}
          syncing={syncing}
          priceUpdatedAt={priceUpdatedAt}
        />
      </Card>

      <Card title="历史绩效" size="small" style={{ marginBottom: 16 }}>
        <Alert type="info" showIcon message="历史净值暂未启用" description="目前只有当前价格，用它回填历史会产生错误的 TWR、年化收益率和最大回撤。待补齐每日历史价格后，再恢复净值曲线与标普500对比。" />
      </Card>

      {/* 待成交挂单：独立于交易流水，不参与持仓与净值计算 */}
      <div id="pending-orders-section" style={{ marginBottom: 16 }}>
        <Card title="待成交挂单" size="small">
          <PendingOrdersPanel
            orders={pendingOrders}
            tickers={tickers}
            openPositions={summary?.openOptions ?? []}
            loading={pendingOrdersLoading}
            selectedTickerId={pendingOrderTickerId}
            onSelectedTickerIdChange={setPendingOrderTickerId}
            onRefresh={async () => {
              await Promise.all([loadPendingOrders(), loadData(), loadTransactions()]);
            }}
          />
        </Card>
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
      <TickerManagerModal
        open={tickerManagerOpen}
        tickers={tickers}
        onClose={() => setTickerManagerOpen(false)}
        onDeleted={async () => {
          await Promise.all([loadData(), loadTransactions()]);
        }}
      />
      <TransactionModal
        open={txModalOpen}
        onClose={() => { setTxModalOpen(false); setEditingTransaction(null); }}
        onSuccess={() => { loadData(); loadTransactions(); setEditingTransaction(null); }}
        tickers={tickers}
        openPositions={summary?.openOptions ?? []}
        editingTransaction={editingTransaction}
      />
      <PortfolioOpeningModal
        open={openingModalOpen}
        tickers={tickers}
        opening={opening}
        positions={openingPositions}
        earliestTransactionDate={earliestTransactionDate}
        onClose={() => setOpeningModalOpen(false)}
        onSuccess={async () => { await Promise.all([loadData(), loadTransactions()]); }}
      />
    </AuthGuard>
  );
}
