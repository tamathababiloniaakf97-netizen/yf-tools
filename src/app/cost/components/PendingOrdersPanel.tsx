'use client';

import { useMemo, useState } from 'react';
import { App, Button, DatePicker, Modal, Popconfirm, Segmented, Select, Space, Table, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SwapOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { OptionPosition, PendingOrder, PendingOrderCategory, Ticker } from '@/types';
import PendingOrderModal from './PendingOrderModal';
import { calculatePendingOrderDeviation } from '@/lib/pending-orders';

interface Props {
  orders: PendingOrder[];
  tickers: Ticker[];
  openPositions: OptionPosition[];
  loading: boolean;
  selectedTickerId?: string;
  onSelectedTickerIdChange?: (tickerId?: string) => void;
  onRefresh: () => void;
}

export default function PendingOrdersPanel({ orders, tickers, openPositions, loading, selectedTickerId, onSelectedTickerIdChange, onRefresh }: Props) {
  const { message } = App.useApp();
  const [category, setCategory] = useState<PendingOrderCategory>('stock');
  const [internalTickerId, setInternalTickerId] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PendingOrder | null>(null);
  const [converting, setConverting] = useState<PendingOrder | null>(null);
  const [tradeDate, setTradeDate] = useState<Dayjs>(dayjs());
  const tickerId = selectedTickerId ?? internalTickerId;
  const setTickerId = onSelectedTickerIdChange ?? setInternalTickerId;

  const filtered = useMemo(() => orders.filter((order) => order.category === category && (!tickerId || order.ticker_id === tickerId)), [orders, category, tickerId]);
  const counts = { stock: orders.filter((item) => item.category === 'stock').length, option: orders.filter((item) => item.category === 'option').length };

  const remove = async (id: string) => {
    const response = await fetch(`/api/pending-orders/${id}`, { method: 'DELETE' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return message.error(result.error || '删除挂单失败');
    message.success('挂单已删除');
    onRefresh();
  };

  const convert = async () => {
    if (!converting) return;
    const response = await fetch(`/api/pending-orders/${converting.id}/convert`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trade_date: tradeDate.format('YYYY-MM-DD') }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return message.error(result.error || '成交转换失败');
    message.success('已转为交易流水');
    setConverting(null);
    onRefresh();
  };

  const actions = (_: unknown, order: PendingOrder) => (
    <Space size={0}>
      <Button type="link" size="small" icon={<SwapOutlined />} onClick={() => { setTradeDate(dayjs()); setConverting(order); }}>成交转流水</Button>
      <Button type="link" size="small" icon={<EditOutlined />} aria-label="修改挂单" onClick={() => { setEditing(order); setModalOpen(true); }} />
      <Popconfirm title="确定删除该挂单？" onConfirm={() => remove(order.id)}><Button type="link" danger size="small" aria-label="删除挂单" icon={<DeleteOutlined />} /></Popconfirm>
    </Space>
  );

  const stockColumns: ColumnsType<PendingOrder> = [
    { title: '标的', key: 'ticker', render: (_, row) => `${row.tickers?.name ?? ''} (${row.tickers?.code ?? ''})` },
    { title: '方向', dataIndex: 'side', render: (side) => <Tag color={side === 'buy' ? 'red' : 'green'}>{side === 'buy' ? '买入' : '卖出'}</Tag> },
    { title: '数量', dataIndex: 'quantity' },
    { title: '挂单价', dataIndex: 'price', render: (price: number) => `$${price.toFixed(4)}` },
    { title: '参考价格', dataIndex: 'reference_price', render: (price: number | null) => price == null ? '—' : `$${price.toFixed(4)}` },
    { title: '距参考价', key: 'deviation', render: (_, order) => { const value = calculatePendingOrderDeviation(order.price, order.reference_price); return value == null ? '—' : <Tag color={value > 0 ? 'red' : value < 0 ? 'green' : 'default'}>{value > 0 ? '+' : ''}{value.toFixed(2)}%</Tag>; } },
    { title: '挂单日期', dataIndex: 'order_date' },
    { title: '操作', key: 'actions', width: 260, render: actions },
  ];
  const optionColumns: ColumnsType<PendingOrder> = [
    { title: '标的', key: 'ticker', render: (_, row) => `${row.tickers?.name ?? ''} (${row.tickers?.code ?? ''})` },
    { title: '动作', dataIndex: 'option_action', render: (value) => value === 'open' ? '开仓' : '平仓' },
    { title: '方向', dataIndex: 'side', render: (side) => side.toUpperCase() },
    { title: 'CALL/PUT', dataIndex: 'option_type', render: (value) => value?.toUpperCase() },
    { title: '合约数', dataIndex: 'quantity' },
    { title: '实际权利金（已×100）', dataIndex: 'price', render: (price: number) => `$${price.toFixed(2)}` },
    { title: '行权价', dataIndex: 'strike_price', render: (price: number) => `$${price}` },
    { title: '到期日', dataIndex: 'expiration_date' },
    { title: '挂单日期', dataIndex: 'order_date' },
    { title: '操作', key: 'actions', width: 260, render: actions },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <Segmented value={category} onChange={(value) => setCategory(value as PendingOrderCategory)} options={[{ value: 'stock', label: `股票挂单 ${counts.stock}` }, { value: 'option', label: `期权挂单 ${counts.option}` }]} />
        <Space wrap>
          <Select allowClear aria-label="筛选标的" placeholder="全部标的" value={tickerId} onChange={setTickerId} style={{ width: 180 }} options={tickers.map((ticker) => ({ value: ticker.id, label: `${ticker.name} (${ticker.code})` }))} />
          <Button icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalOpen(true); }}>新增{category === 'stock' ? '股票' : '期权'}挂单</Button>
        </Space>
      </div>
      <Table rowKey="id" size="small" loading={loading} dataSource={filtered} columns={category === 'stock' ? stockColumns : optionColumns} pagination={false} scroll={{ x: category === 'option' ? 1200 : 1000 }} locale={{ emptyText: '暂无待成交挂单' }} />
      <PendingOrderModal open={modalOpen} category={category} order={editing} tickers={tickers} openPositions={openPositions} onClose={() => setModalOpen(false)} onSuccess={onRefresh} />
      <Modal title="确认成交" open={!!converting} onCancel={() => setConverting(null)} onOk={convert} okText="确认并转为流水">
        <p>成交日期默认今天；补录历史成交时可以修改。</p>
        <DatePicker aria-label="成交日期" value={tradeDate} onChange={(value) => value && setTradeDate(value)} style={{ width: '100%' }} />
      </Modal>
    </div>
  );
}
