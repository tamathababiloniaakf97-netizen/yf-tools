'use client';

import { Alert, App, Button, DatePicker, Empty, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import type { WatchlistInput, WatchlistItem } from '@/types/life-os';

const statusLabel = { watching: '观察中', near_condition: '接近条件', validating: '等待验证', paused: '暂缓' } as const;

function dateAfter(days: number) {
  return dayjs().add(days, 'day').format('YYYY-MM-DD');
}

function taskHref(item: WatchlistItem) {
  const params = new URLSearchParams({ new: '1', task_type: 'research', title: item.asset_name });
  if (item.reason) params.set('condition_note', item.reason);
  return `/investment/tasks?${params.toString()}`;
}

export default function WatchlistPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WatchlistItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/investment/watchlist');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '观察列表加载失败');
      setItems(data); setError('');
    } catch (err) { setError(err instanceof Error ? err.message : '观察列表加载失败'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const submit = async () => {
    const values = await form.validateFields();
    const input: WatchlistInput = { ...values, ticker_id: editing?.ticker_id ?? null, reason: values.reason ?? '', entry_condition: values.entry_condition ?? '', next_check_at: values.next_check_at?.format('YYYY-MM-DD') ?? null };
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/investment/watchlist/${editing.id}` : '/api/investment/watchlist', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '保存失败');
      message.success(editing ? '关注事项已更新' : '已加入观察列表'); setOpen(false); setEditing(null); form.resetFields(); await load();
    } catch (err) { message.error(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  const patch = async (item: WatchlistItem, changes: Partial<WatchlistInput>, success: string) => {
    const response = await fetch(`/api/investment/watchlist/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) });
    const data = await response.json();
    if (!response.ok) { message.error(data.error || '更新失败'); return; }
    message.success(success); await load();
  };

  const edit = (item: WatchlistItem) => {
    setEditing(item);
    form.setFieldsValue({ ...item, next_check_at: item.next_check_at ? dayjs(item.next_check_at) : null });
    setOpen(true);
  };

  const remove = async (id: string) => {
    const response = await fetch(`/api/investment/watchlist/${id}`, { method: 'DELETE' });
    if (response.ok) { message.success('已移出观察列表'); await load(); }
  };

  return (
    <AuthGuard>
      <div className="page-heading"><div><Typography.Title level={2}>观察列表</Typography.Title><Typography.Text type="secondary">记下不能忘、但暂时还没有明确下一步的投资关注事项；细节可以以后补充。</Typography.Text></div><Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); form.setFieldsValue({ status: 'watching' }); setOpen(true); }}>添加关注事项</Button></div>
      {error && <Alert type="warning" showIcon message="观察列表尚未连接" description="需要先执行数据库迁移 004_investment_research.sql。" style={{ marginBottom: 16 }} />}
      {items.length === 0 && !loading && !error ? <Empty description="暂无关注事项" /> : <Table loading={loading} rowKey="id" dataSource={items} pagination={false} scroll={{ x: 920 }} columns={[
        { title: '关注事项', dataIndex: 'asset_name', width: 155, ellipsis: true, render: (value: string) => <Typography.Text strong>{value}</Typography.Text> },
        { title: '关注原因', dataIndex: 'reason', width: 135, ellipsis: true, render: (value: string) => value || '—' },
        { title: '等待条件', dataIndex: 'entry_condition', width: 135, ellipsis: true, render: (value: string) => value || '—' },
        { title: '状态', dataIndex: 'status', width: 90, render: (value: WatchlistItem['status']) => <Tag color={value === 'near_condition' ? 'orange' : 'blue'}>{statusLabel[value]}</Tag> },
        { title: '下次提醒/复核', dataIndex: 'next_check_at', width: 125, render: (value: string | null) => value ?? '未设置' },
        { title: '操作', width: 280, render: (_, item) => <Space wrap size={0}><Button size="small" type="link" onClick={() => edit(item)}>编辑</Button><Button size="small" type="link" aria-label="已复核" onClick={() => void patch(item, { next_check_at: null }, '已完成本次复核')}>复核</Button><Button size="small" type="link" aria-label="7天后提醒" onClick={() => void patch(item, { next_check_at: dateAfter(7) }, '将在7天后重新提醒')}>7天后</Button><Link aria-label="转为待办" href={taskHref(item)}>待办</Link><Button size="small" type="link" danger onClick={() => void remove(item.id)}>移除</Button></Space> },
      ]} />}
      <Modal title={editing ? '编辑关注事项' : '添加关注事项'} open={open} okText="保存" cancelText="取消" confirmLoading={saving} onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }} onOk={submit}>
        <Form form={form} layout="vertical">
          <Form.Item name="asset_name" label="关注事项" rules={[{ required: true, message: '请填写关注事项' }]}><Input placeholder="例如：腾讯游戏收入增速、美国十年期国债利率" /></Form.Item>
          <Form.Item name="reason" label="为什么关注（可选）"><Input.TextArea rows={2} placeholder="它为什么值得继续留意" /></Form.Item>
          <Form.Item name="entry_condition" label="等待什么条件（可选）"><Input.TextArea rows={2} placeholder="出现什么变化时需要重新判断或采取行动" /></Form.Item>
          <Form.Item name="status" label="状态"><Select options={[{ value: 'watching', label: '观察中' }, { value: 'near_condition', label: '接近条件' }, { value: 'validating', label: '等待验证' }, { value: 'paused', label: '暂缓' }]} /></Form.Item>
          <Form.Item name="next_check_at" label="下次提醒/复核（可选）"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </AuthGuard>
  );
}
