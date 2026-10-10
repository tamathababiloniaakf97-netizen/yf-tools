'use client';

import React, { useMemo, useState } from 'react';
import { Table, Tag, Button, Input, InputNumber, Select, App, Tooltip, Space, Typography } from 'antd';
import { EyeOutlined, CloudSyncOutlined, EditOutlined } from '@ant-design/icons';
import type { Position, TickerStyle, TickerType } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import { filterPositions, summarizePositions } from './position-table-summary';

interface Props {
  positions: Position[];
  totalAssets: number;
  loading: boolean;
  onViewTransactions: (tickerId: string) => void;
  onViewPendingOrders: (tickerId: string) => void;
  onPriceChange: (tickerId: string, price: number) => void;
  onSyncPrices: () => Promise<void>;
  onRefresh: () => void;
  syncing: boolean;
  priceUpdatedAt: Record<string, string | null>;
}

const styleLabels: Record<TickerStyle, { label: string; color: string }> = {
  offensive: { label: '进攻', color: 'red' },
  balanced: { label: '平衡', color: 'blue' },
  defensive: { label: '防守', color: 'green' },
};

const styleSelectOptions = [
  { value: 'offensive', label: '进攻' },
  { value: 'balanced', label: '平衡' },
  { value: 'defensive', label: '防守' },
];

const typeLabels: Record<string, { label: string; color: string }> = {
  stock_us: { label: '美股', color: 'blue' },
  stock_hk: { label: '港股', color: 'cyan' },
  stock_a: { label: 'A股', color: 'red' },
  option: { label: '期权', color: 'purple' },
  crypto: { label: '加密', color: 'orange' },
};

const typeSelectOptions: Array<{ value: TickerType; label: string }> = [
  { value: 'stock_us', label: '美股' },
  { value: 'stock_hk', label: '港股' },
  { value: 'stock_a', label: 'A股' },
  { value: 'crypto', label: '加密' },
];

function formatUsd(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatSignedUsd(value: number): string {
  if (value === 0) return '$0.00';
  return `${value > 0 ? '+' : '-'}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number | null, signed: boolean): string {
  if (value === null) return '—';
  return `${signed && value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export default function PositionTable({
  positions, totalAssets, loading, onViewTransactions, onViewPendingOrders,
  onPriceChange, onSyncPrices, onRefresh, syncing, priceUpdatedAt,
}: Props) {
  const { message } = App.useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number | null>(null);
  const [editingStyleId, setEditingStyleId] = useState<string | null>(null);
  const [styleFilter, setStyleFilter] = useState<TickerStyle | null>(null);
  const [typeFilter, setTypeFilter] = useState<TickerType | null>(null);
  const [query, setQuery] = useState('');

  const visiblePositions = useMemo(
    () => filterPositions(positions, { style: styleFilter, type: typeFilter, query }),
    [positions, styleFilter, typeFilter, query],
  );
  const filteredSummary = useMemo(
    () => summarizePositions(visiblePositions, positions.length, totalAssets),
    [visiblePositions, positions.length, totalAssets],
  );

  const startEdit = (record: Position) => {
    setEditingId(record.ticker.id);
    setEditValue(record.currentPrice || null);
  };

  const saveEdit = (tickerId: string) => {
    if (editValue !== null && editValue >= 0) {
      onPriceChange(tickerId, editValue);
    }
    setEditingId(null);
    setEditValue(null);
  };

  const saveStyle = async (tickerId: string, style: string | null) => {
    setEditingStyleId(null);
    const res = await fetch(`/api/tickers/${tickerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ style }),
    });
    if (!res.ok) {
      message.error('更新属性失败');
      return;
    }
    onRefresh();
  };

  const columns: ColumnsType<Position> = [
    {
      title: '属性',
      dataIndex: ['ticker', 'style'],
      key: 'style',
      render: (style: TickerStyle | null, record: Position) => {
        if (editingStyleId === record.ticker.id) {
          return (
            <Select
              size="small"
              style={{ width: 80 }}
              defaultValue={style}
              placeholder="选择"
              allowClear
              options={styleSelectOptions}
              onChange={(val) => saveStyle(record.ticker.id, val ?? null)}
              onBlur={() => setEditingStyleId(null)}
              autoFocus
              open
            />
          );
        }
        return (
          <span
            onClick={() => setEditingStyleId(record.ticker.id)}
            style={{ cursor: 'pointer' }}
          >
            {style ? (
              <Tag color={styleLabels[style].color}>{styleLabels[style].label}</Tag>
            ) : (
              <span style={{ color: '#bbb' }}>—</span>
            )}
          </span>
        );
      },
      width: 80,
    },
    {
      title: '标的',
      dataIndex: ['ticker', 'name'],
      key: 'name',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.ticker.name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{record.ticker.code}</div>
        </div>
      ),
      width: 160,
    },
    {
      title: '类型',
      dataIndex: ['ticker', 'type'],
      key: 'type',
      render: (type: string) => {
        const info = typeLabels[type] || { label: type, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
      width: 80,
    },
    {
      title: '持仓数量',
      dataIndex: 'totalShares',
      key: 'totalShares',
      render: (val: number) => val.toLocaleString(),
      width: 100,
    },
    {
      title: '持仓成本(USD)',
      dataIndex: 'costPerShare',
      key: 'costPerShare',
      render: (val: number, record: Position) => (
        <span style={{ color: record.isNegativeCost ? '#52c41a' : undefined }}>
          {record.isNegativeCost ? '负成本' : `$${val.toFixed(4)}`}
        </span>
      ),
      width: 130,
    },
    {
      title: '期权收益',
      dataIndex: 'optionPnl',
      key: 'optionPnl',
      width: 110,
      render: (val: number) => {
        if (!val && val !== 0) return <span style={{ color: '#bbb' }}>—</span>;
        return (
          <span style={{ color: val >= 0 ? '#f5222d' : '#52c41a', fontWeight: 500 }}>
            {val >= 0 ? '+' : ''}${val.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: '现价(USD)',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (val: number, record: Position) => {
        const isEditing = editingId === record.ticker.id;
        const updatedAt = priceUpdatedAt[record.ticker.id];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isEditing ? (
              <InputNumber
                value={editValue}
                onChange={(v) => setEditValue(v)}
                onPressEnter={() => saveEdit(record.ticker.id)}
                onBlur={() => saveEdit(record.ticker.id)}
                step={0.01}
                min={0}
                size="small"
                style={{ width: 100 }}
                autoFocus
              />
            ) : (
              <Tooltip title={updatedAt ? `更新于 ${updatedAt}` : '手动输入'}>
                <span
                  onClick={() => startEdit(record)}
                  style={{ cursor: 'pointer', borderBottom: '1px dashed #d9d9d9', minWidth: 70, display: 'inline-block' }}
                >
                  {val ? `$${val.toFixed(4)}` : <span style={{ color: '#bbb' }}>点击输入</span>}
                </span>
              </Tooltip>
            )}
            {!isEditing && (
              <EditOutlined
                onClick={() => startEdit(record)}
                style={{ color: '#999', cursor: 'pointer', fontSize: 12 }}
              />
            )}
          </div>
        );
      },
      width: 130,
    },
    {
      title: '市值(USD)',
      dataIndex: 'marketValue',
      key: 'marketValue',
      render: (val: number) => `$${val.toFixed(2)}`,
      width: 120,
    },
    {
      title: '盈亏(USD)',
      dataIndex: 'pnl',
      key: 'pnl',
      render: (val: number) => (
        <span style={{ color: val >= 0 ? '#f5222d' : '#52c41a' }}>
          {val >= 0 ? '+' : ''}${val.toFixed(2)}
        </span>
      ),
      width: 120,
    },
    {
      title: '盈亏比例',
      dataIndex: 'pnlPercent',
      key: 'pnlPercent',
      render: (val: number, record: Position) => {
        if (record.isNegativeCost) return <Tag color="green">负成本</Tag>;
        return (
          <span style={{ color: val >= 0 ? '#f5222d' : '#52c41a' }}>
            {val >= 0 ? '+' : ''}{val.toFixed(2)}%
          </span>
        );
      },
      width: 100,
    },
    {
      title: '仓位占比',
      dataIndex: 'allocPercent',
      key: 'allocPercent',
      render: (val: number) => `${val.toFixed(1)}%`,
      width: 90,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onViewTransactions(record.ticker.id)}>流水</Button>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onViewPendingOrders(record.ticker.id)}>挂单</Button>
        </Space>
      ),
      width: 140,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Space wrap>
          <Select<TickerStyle | 'all'>
            aria-label="属性筛选"
            value={styleFilter ?? 'all'}
            onChange={(value) => setStyleFilter(value === 'all' ? null : value)}
            style={{ width: 120 }}
            options={[{ value: 'all', label: '全部属性' }, ...styleSelectOptions]}
          />
          <Select<TickerType | 'all'>
            aria-label="类型筛选"
            value={typeFilter ?? 'all'}
            onChange={(value) => setTypeFilter(value === 'all' ? null : value)}
            style={{ width: 120 }}
            options={[{ value: 'all', label: '全部类型' }, ...typeSelectOptions]}
          />
          <Input.Search
            aria-label="搜索标的"
            type="search"
            allowClear
            placeholder="搜索名称或代码"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ width: 220 }}
          />
        </Space>
        <Button
          icon={<CloudSyncOutlined />}
          onClick={onSyncPrices}
          loading={syncing}
          size="small"
        >
          一键更新收盘价
        </Button>
      </div>
      <Space
        aria-label="筛选结果汇总"
        wrap
        size="large"
        style={{ width: '100%', marginBottom: 12, padding: '8px 12px', background: '#fafafa', borderRadius: 6 }}
      >
        <Typography.Text type="secondary">已显示 <Typography.Text strong>{filteredSummary.visibleCount} / {filteredSummary.totalCount}</Typography.Text></Typography.Text>
        <Typography.Text type="secondary">市值 <Typography.Text strong>{formatUsd(filteredSummary.marketValue)}</Typography.Text></Typography.Text>
        <Typography.Text type="secondary">浮盈亏 <Typography.Text strong type={filteredSummary.pnl > 0 ? 'danger' : filteredSummary.pnl < 0 ? 'success' : undefined}>{formatSignedUsd(filteredSummary.pnl)}</Typography.Text></Typography.Text>
        <Typography.Text type="secondary">收益率 <Typography.Text strong type={(filteredSummary.returnPercent ?? 0) > 0 ? 'danger' : (filteredSummary.returnPercent ?? 0) < 0 ? 'success' : undefined}>{formatPercent(filteredSummary.returnPercent, true)}</Typography.Text></Typography.Text>
        <Typography.Text type="secondary">占账户 <Typography.Text strong>{formatPercent(filteredSummary.accountPercent, false)}</Typography.Text></Typography.Text>
      </Space>
      <Table
        dataSource={visiblePositions}
        columns={columns}
        rowKey={(record) => record.ticker.id}
        loading={loading}
        pagination={false}
        size="small"
        scroll={{ x: 1150 }}
      />
    </div>
  );
}
