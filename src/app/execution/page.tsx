'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Typography, App, Spin } from 'antd';
import AuthGuard from '@/components/AuthGuard';
import ColumnSelector from './components/ColumnSelector';
import ExecutionColumn from './components/ExecutionColumn';
import { calculateAccountSummary } from '@/lib/cost-engine';
import type { StrategySummary, Transaction, Ticker } from '@/types';

const { Title, Text } = Typography;

interface StrategyOption {
  id: string;
  title: string;
  status: string;
}

interface PositionInfo {
  code: string;
  currentPrice: number | null;
  costPerShare: number | null;
  pnlPercent: number | null;
}

interface ColumnState {
  strategyId: string | null;
  strategyTitle: string;
  strategyStatus: string;
  playbook: Record<string, unknown> | null;
  positionInfo: PositionInfo | null;
  loading: boolean;
}

const INITIAL_COLUMN: ColumnState = {
  strategyId: null,
  strategyTitle: '',
  strategyStatus: '规划中',
  playbook: null,
  positionInfo: null,
  loading: false,
};

export default function ExecutionPage() {
  const { message } = App.useApp();
  const [strategies, setStrategies] = useState<StrategyOption[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [columns, setColumns] = useState<ColumnState[]>([
    { ...INITIAL_COLUMN },
    { ...INITIAL_COLUMN },
    { ...INITIAL_COLUMN },
  ]);

  // Load strategy list
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/strategies');
        if (res.ok) {
          const data = await res.json();
          setStrategies(
            data.map((s: StrategySummary) => ({
              id: s.id,
              title: s.title,
              status: s.status,
            }))
          );
        }
      } catch {
        // silent
      } finally {
        setPageLoading(false);
      }
    })();
  }, []);

  // Cache for positions data to avoid repeated fetches
  const positionsCacheRef = React.useRef<{ tickers: Ticker[]; transactions: Transaction[] } | null>(null);

  // Fetch position info for a ticker (with caching)
  const fetchPositionInfo = useCallback(async (code: string): Promise<PositionInfo | null> => {
    try {
      if (!positionsCacheRef.current) {
        const res = await fetch('/api/positions');
        if (!res.ok) return null;
        const data = await res.json();
        positionsCacheRef.current = {
          tickers: data.tickers || [],
          transactions: data.transactions || [],
        };
      }
      const { tickers, transactions } = positionsCacheRef.current;
      const ticker = tickers.find(
        (t: Ticker) => t.code?.toUpperCase() === code?.toUpperCase()
      );
      if (!ticker) return { code, currentPrice: null, costPerShare: null, pnlPercent: null };

      const currentPrice = ticker.current_price ?? null;
      const pricesMap: Record<string, number> = {};
      if (currentPrice != null) pricesMap[ticker.id] = currentPrice;

      const summary = calculateAccountSummary(transactions, tickers, pricesMap);
      const pos = summary.positions.find((p) => p.ticker.code?.toUpperCase() === code?.toUpperCase());

      return {
        code: ticker.code,
        currentPrice,
        costPerShare: pos?.costPerShare ?? null,
        pnlPercent: pos?.pnlPercent ?? null,
      };
    } catch {
      return null;
    }
  }, []);

  // Load full strategy data for a column
  const loadStrategyData = useCallback(
    async (columnIndex: number, strategyId: string | null) => {
      setColumns((prev) => {
        const next = [...prev];
        if (!strategyId) {
          next[columnIndex] = { ...INITIAL_COLUMN };
          return next;
        }
        next[columnIndex] = { ...next[columnIndex], loading: true };
        return next;
      });

      if (!strategyId) return;

      try {
        const res = await fetch(`/api/strategies/${strategyId}`);
        if (!res.ok) throw new Error('加载失败');
        const s = await res.json();

        const playbook =
          s.edited_playbook && typeof s.edited_playbook === 'object'
            ? (s.edited_playbook as Record<string, unknown>)
            : null;

        // Determine ticker from overview or first holding
        const overview = playbook?.overview as Record<string, unknown> | undefined;
        const tickerFromOverview = overview?.target as string | undefined;
        const holdings = Array.isArray(s.holdings) ? s.holdings : [];
        const ticker = tickerFromOverview || holdings[0]?.ticker || '—';

        // Fetch live position info
        const positionInfo = await fetchPositionInfo(ticker);

        setColumns((prev) => {
          const next = [...prev];
          next[columnIndex] = {
            strategyId,
            strategyTitle: s.title || '未命名策略',
            strategyStatus: s.status || '规划中',
            playbook,
            positionInfo: positionInfo || { code: ticker, currentPrice: null, costPerShare: null, pnlPercent: null },
            loading: false,
          };
          return next;
        });
      } catch {
        message.error('加载策略失败');
        setColumns((prev) => {
          const next = [...prev];
          next[columnIndex] = { ...INITIAL_COLUMN };
          return next;
        });
      }
    },
    [fetchPositionInfo, message]
  );

  // Handle strategy selection
  const handleSelect = useCallback(
    (columnIndex: number, strategyId: string | null) => {
      // Check for duplicate
      if (strategyId) {
        const otherIdx = columns.findIndex(
          (c, i) => i !== columnIndex && c.strategyId === strategyId
        );
        if (otherIdx >= 0) {
          message.warning('同一策略不能同时显示在两列中');
          return;
        }
      }
      loadStrategyData(columnIndex, strategyId);
    },
    [columns, loadStrategyData, message]
  );

  // Handle playbook change (mark execution / save reflection)
  const handlePlaybookChange = useCallback(
    async (columnIndex: number, playbook: Record<string, unknown>) => {
      const col = columns[columnIndex];
      if (!col.strategyId) return;

      // Optimistic update
      setColumns((prev) => {
        const next = [...prev];
        next[columnIndex] = { ...next[columnIndex], playbook };
        return next;
      });

      try {
        const res = await fetch(`/api/strategies/${col.strategyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ edited_playbook: playbook }),
        });
        if (!res.ok) throw new Error('保存失败');
      } catch {
        message.error('保存失败，请重试');
      }
    },
    [columns, message]
  );

  const selectedIds = columns.map((c) => c.strategyId);

  if (pageLoading) {
    return (
      <AuthGuard>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      {/* Page Title */}
      <div className="yf-page-title" style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          策略执行
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 400, marginLeft: 12 }}>
            不预测，只应对 — 执行中反思，反思中迭代
          </Text>
        </Title>
      </div>

      {/* Strategy Selectors */}
      <ColumnSelector
        strategies={strategies}
        selectedIds={selectedIds}
        onSelect={handleSelect}
      />

      {/* Three Columns */}
      <div className="yf-execution-columns">
        {columns.map((col, i) => (
          <ExecutionColumn
            key={i}
            strategyId={col.strategyId}
            strategyTitle={col.strategyTitle}
            strategyStatus={col.strategyStatus}
            playbook={col.playbook}
            positionInfo={col.positionInfo}
            loading={col.loading}
            onPlaybookChange={(playbook) => handlePlaybookChange(i, playbook)}
          />
        ))}
      </div>
    </AuthGuard>
  );
}
