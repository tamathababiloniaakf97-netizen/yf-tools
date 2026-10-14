'use client';

import React, { useState, useMemo } from 'react';
import { Table, Select, DatePicker, Tag, Button, Popconfirm, App, Segmented, Space, Tooltip } from 'antd';
import { DeleteOutlined, DownloadOutlined, FilterOutlined, EditOutlined } from '@ant-design/icons';
import { formatMoney, fromLegacyUSD } from '@/lib/exchange';
import * as XLSX from 'xlsx';
import type { Transaction, TransactionType } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import { flowClassName, formatFlowAmount, valueFlow } from '@/lib/household-finance/amount-presentation';

const { RangePicker } = DatePicker;

interface Props {
  transactions: Transaction[];
  tickerIdFilter?: string;
  loading: boolean;
  onRefresh: () => void;
  onFilterChange?: (filters: { type?: string; ticker_id?: string; date_from?: string; date_to?: string }) => void;
  onEdit?: (tx: Transaction) => void;
}

type TabKey = 'stock' | 'option';

const stockTypeLabels: Record<string, { label: string; color: string }> = {
  buy: { label: '买入', color: 'red' },
  sell: { label: '卖出', color: 'green' },
  dividend: { label: '分红', color: 'blue' },
  deposit: { label: '入金', color: 'orange' },
  withdraw: { label: '出金', color: 'volcano' },
};

const stockTypeOptions = Object.entries(stockTypeLabels).map(([value, info]) => ({
  value,
  label: info.label,
}));

const actionLabels: Record<string, string> = {
  open: '开仓',
  close: '平仓',
};

function downloadExcel(columns: ColumnsType<Transaction>, data: Transaction[], filename: string) {
  const headers = columns
    .filter((c) => c.key !== 'action' && c.key !== 'option_action')
    .map((c) => (typeof c.title === 'string' ? c.title : c.key));
  const rows = data.map((record) => {
    return columns
      .filter((c) => c.key !== 'action' && c.key !== 'option_action')
      .map((c) => {
        if (c.key === 'type') return stockTypeLabels[record.type]?.label || record.type;
        if (c.key === 'direction') return record.option_detail?.direction === 'sell' ? 'SELL' : 'BUY';
        if (c.key === 'callput') return record.option_detail?.type?.toUpperCase() ?? '—';
        if (c.key === 'opt_action') return actionLabels[record.option_detail?.action ?? ''] ?? '—';
        if (c.key === 'quantity') {
          if (record.type === 'option_income') return record.option_detail?.quantity ?? '—';
          return record.quantity?.toLocaleString() ?? '—';
        }
        if (c.key === 'price') {
          if (record.type === 'option_income') return record.option_detail?.price ?? '—';
          return record.price == null ? '—' : formatMoney(record.price, record.currency, 4);
        }
        if (c.key === 'amount_orig') {
          const amount = record.amount_orig ?? (record.amount_usd == null ? null : fromLegacyUSD(record.amount_usd, record.currency));
          return amount == null ? '—' : formatMoney((record.type === 'buy' || record.type === 'withdraw' ? -1 : 1) * Math.abs(amount), record.currency, 2, true);
        }
        if (c.key === 'trade_date') return record.trade_date;
        if (c.key === 'amount_usd') return record.amount_usd ?? '—';
        if (c.key === 'strike_price') return record.option_detail?.strike_price ?? '—';
        if (c.key === 'expiration_date') return record.option_detail?.expiration_date ?? '—';
        if (c.key === 'note') return record.note || '—';
        const tickerData = record as Transaction & { tickers?: { name: string; code: string } };
        if (c.key === 'ticker') return tickerData.tickers ? `${tickerData.tickers.name} (${tickerData.tickers.code})` : '—';
        return '';
      });
  });

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export default function TransactionPanel({
  transactions,
  tickerIdFilter,
  loading,
  onRefresh,
  onFilterChange,
  onEdit,
}: Props) {
  const { message } = App.useApp();
  const [tab, setTab] = useState<TabKey>('stock');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  // Option filters
  const [optDirFilter, setOptDirFilter] = useState<string | undefined>();
  const [optTypeFilter, setOptTypeFilter] = useState<string | undefined>();
  const [optActionFilter, setOptActionFilter] = useState<string | undefined>();

  const filtered = useMemo(() => {
    let data = tickerIdFilter
      ? transactions.filter((t) => t.ticker_id === tickerIdFilter)
      : transactions;

    if (tab === 'stock') {
      data = data.filter((t) => t.type !== 'option_income');
      if (typeFilter) data = data.filter((t) => t.type === typeFilter);
    } else {
      data = data.filter((t) => t.type === 'option_income');
      if (optDirFilter) data = data.filter((t) => t.option_detail?.direction === optDirFilter);
      if (optTypeFilter) data = data.filter((t) => t.option_detail?.type === optTypeFilter);
      if (optActionFilter) data = data.filter((t) => t.option_detail?.action === optActionFilter);
    }
    return data;
  }, [transactions, tickerIdFilter, tab, typeFilter, optDirFilter, optTypeFilter, optActionFilter]);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      message.error('删除失败');
      return;
    }
    message.success('已删除');
    onRefresh();
  };

  // ============================================================
  // 股票流水列
  // ============================================================
  const stockColumns: ColumnsType<Transaction> = [
    {
      title: '日期',
      dataIndex: 'trade_date',
      key: 'trade_date',
      width: 100,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: TransactionType) => {
        const info = stockTypeLabels[type] || { label: type, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '标的',
      key: 'ticker',
      width: 140,
      render: (_: unknown, record: Transaction) => {
        const tickerData = record as Transaction & { tickers?: { name: string; code: string } };
        return tickerData.tickers ? `${tickerData.tickers.name} (${tickerData.tickers.code})` : '—';
      },
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (val: number | null) => val?.toLocaleString() ?? '—',
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (val: number | null, record) => val == null ? '—' : formatMoney(val, record.currency, 4),
    },
    {
      title: '金额（原币）',
      dataIndex: 'amount_orig',
      key: 'amount_orig',
      width: 160,
      render: (val: number | null, record: Transaction) => {
        const amount = val ?? (record.amount_usd == null ? null : fromLegacyUSD(record.amount_usd, record.currency));
        if (amount === null) return '—';
        const displayVal = (record.type === 'buy' || record.type === 'withdraw' ? -1 : 1) * Math.abs(amount);
        return (
          <Tooltip title={record.amount_usd == null ? undefined : `记录时折算：${formatMoney(record.amount_usd, 'USD')}`}>
            <span className={flowClassName(valueFlow(displayVal))}>{formatMoney(displayVal, record.currency, 2, true)}</span>
          </Tooltip>
        );
      },
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Transaction) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit?.(record)} />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ============================================================
  // 期权流水列
  // ============================================================
  const optionColumns: ColumnsType<Transaction> = [
    {
      title: '成交日期',
      dataIndex: 'trade_date',
      key: 'trade_date',
      width: 100,
    },
    {
      title: '类型',
      key: 'type',
      width: 80,
      render: (_: unknown, record: Transaction) => {
        const d = record.option_detail?.direction;
        const a = record.option_detail?.action;
        if (d === 'sell' && a === 'open') return <Tag color="green">卖出开仓</Tag>;
        if (d === 'buy' && a === 'open') return <Tag color="red">买入开仓</Tag>;
        if (d === 'buy' && a === 'close') return <Tag color="red">买入平仓</Tag>;
        if (d === 'sell' && a === 'close') return <Tag color="green">卖出平仓</Tag>;
        return <Tag color="purple">期权</Tag>;
      },
    },
    {
      title: '标的',
      key: 'ticker',
      width: 140,
      render: (_: unknown, record: Transaction) => {
        const tickerData = record as Transaction & { tickers?: { name: string; code: string } };
        return tickerData.tickers ? `${tickerData.tickers.name} (${tickerData.tickers.code})` : '—';
      },
    },
    {
      title: '方向',
      key: 'direction',
      width: 70,
      render: (_: unknown, record: Transaction) => {
        const d = record.option_detail?.direction;
        if (!d) return '—';
        return <Tag color={d === 'sell' ? 'green' : 'red'}>{d === 'sell' ? 'SELL' : 'BUY'}</Tag>;
      },
    },
    {
      title: 'CALL/PUT',
      key: 'callput',
      width: 80,
      render: (_: unknown, record: Transaction) => {
        const t = record.option_detail?.type;
        if (!t) return '—';
        return <Tag color="blue">{t.toUpperCase()}</Tag>;
      },
    },
    {
      title: '动作',
      key: 'opt_action',
      width: 70,
      render: (_: unknown, record: Transaction) => {
        const a = record.option_detail?.action;
        if (!a) return '—';
        return <Tag>{actionLabels[a]}</Tag>;
      },
    },
    {
      title: '合约数',
      key: 'quantity',
      width: 70,
      render: (_: unknown, record: Transaction) =>
        record.option_detail?.quantity ?? '—',
    },
    {
      title: '权利金(USD)',
      key: 'price',
      width: 110,
      render: (_: unknown, record: Transaction) => {
        const p = record.option_detail?.price;
        return p ? formatMoney(p, 'USD') : '—';
      },
    },
    {
      title: '金额(USD)',
      dataIndex: 'amount_usd',
      key: 'amount_usd',
      width: 110,
      render: (val: number | null) => {
        if (val === null || val === undefined) return '—';
        const flow = valueFlow(val);
        return (
          <span className={flowClassName(flow)}>
            {formatFlowAmount(val, flow, 'USD')}
          </span>
        );
      },
    },
    {
      title: '行权价',
      key: 'strike_price',
      width: 90,
      render: (_: unknown, record: Transaction) => {
        const s = record.option_detail?.strike_price;
        return s ? formatMoney(s, 'USD', 4) : '—';
      },
    },
    {
      title: '到期日',
      key: 'expiration_date',
      width: 100,
      render: (_: unknown, record: Transaction) =>
        record.option_detail?.expiration_date ?? '—',
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Transaction) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit?.(record)} />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const currentColumns = tab === 'stock' ? stockColumns : optionColumns;

  const handleExport = () => {
    const fn = tab === 'stock' ? '股票流水' : '期权流水';
    downloadExcel(currentColumns, filtered, fn);
  };

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <Space align="center" wrap>
          <Segmented
            value={tab}
            onChange={(val) => {
              setTab(val as TabKey);
              setTypeFilter(undefined);
              setOptDirFilter(undefined);
              setOptTypeFilter(undefined);
              setOptActionFilter(undefined);
              onFilterChange?.({});
            }}
            options={[
              { label: '股票流水', value: 'stock' },
              { label: '期权流水', value: 'option' },
            ]}
          />
          <span style={{ fontWeight: 500 }}>
            <FilterOutlined /> 筛选：
          </span>
          {tab === 'stock' ? (
            <Select
              allowClear
              placeholder="交易类型"
              style={{ width: 120 }}
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                onFilterChange?.({ type: val });
              }}
              options={stockTypeOptions}
            />
          ) : (
            <>
              <Select
                allowClear
                placeholder="方向"
                style={{ width: 100 }}
                value={optDirFilter}
                onChange={setOptDirFilter}
                options={[
                  { value: 'sell', label: 'SELL' },
                  { value: 'buy', label: 'BUY' },
                ]}
              />
              <Select
                allowClear
                placeholder="CALL/PUT"
                style={{ width: 100 }}
                value={optTypeFilter}
                onChange={setOptTypeFilter}
                options={[
                  { value: 'call', label: 'CALL' },
                  { value: 'put', label: 'PUT' },
                ]}
              />
              <Select
                allowClear
                placeholder="动作"
                style={{ width: 100 }}
                value={optActionFilter}
                onChange={setOptActionFilter}
                options={[
                  { value: 'open', label: '开仓' },
                  { value: 'close', label: '平仓' },
                ]}
              />
            </>
          )}
          <RangePicker
            onChange={(dates) => {
              onFilterChange?.({
                date_from: dates?.[0]?.format('YYYY-MM-DD'),
                date_to: dates?.[1]?.format('YYYY-MM-DD'),
              });
            }}
          />
        </Space>
        <Button icon={<DownloadOutlined />} onClick={handleExport} size="small">
          导出 Excel
        </Button>
      </div>
      <Table
        dataSource={filtered}
        columns={currentColumns}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: tab === 'option' ? 1300 : 800 }}
      />
    </div>
  );
}
