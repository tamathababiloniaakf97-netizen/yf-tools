'use client';

import { Alert, App, Button, Card, Empty, Form, Input, List, Modal, Select, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { filterMethodologyItems, type MethodologyCategoryFilter } from '@/lib/investment/methodology-search';
import type { MethodologyInput, MethodologyItem } from '@/types/life-os';
import MethodologyFilters from './components/MethodologyFilters';

const categoryLabels = { selection: '选股', valuation: '估值', position: '仓位', discipline: '纪律', review: '复盘' } as const;

export default function MethodologyPage() {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [items, setItems] = useState<MethodologyItem[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<MethodologyCategoryFilter>('all');

  const filteredItems = useMemo(
    () => filterMethodologyItems(items, { keyword, category }),
    [items, keyword, category],
  );

  const load = useCallback(async () => {
    try { const response = await fetch('/api/investment/methodology'); const data = await response.json(); if (!response.ok) throw new Error(data.error || '方法论加载失败'); setItems(data); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : '方法论加载失败'); }
  }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const save = async () => {
    const values = await form.validateFields() as MethodologyInput;
    const response = await fetch('/api/investment/methodology', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, source_type: 'manual' }) });
    const data = await response.json(); if (!response.ok) return message.error(data.error || '保存失败');
    message.success('方法已保存'); setOpen(false); form.resetFields(); await load();
  };
  const remove = (item: MethodologyItem) => modal.confirm({ title: '删除这条方法？', content: item.title, okText: '删除', okButtonProps: { danger: true }, cancelText: '取消', onOk: async () => { const response = await fetch(`/api/investment/methodology/${item.id}`, { method: 'DELETE' }); if (!response.ok) throw new Error('删除失败'); await load(); } });

  const clearFilters = () => {
    setKeyword('');
    setCategory('all');
  };

  return <AuthGuard>
    <div className="page-heading"><div><Typography.Title level={2}>投资方法论</Typography.Title><Typography.Text type="secondary">只沉淀经过实际复盘得到的规则，不收集空泛金句。</Typography.Text></div><Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>添加方法</Button></div>
    {error && <Alert type="warning" showIcon message="方法论尚未连接" description={`${error}。请执行迁移 005_investment_reviews.sql。`} style={{ marginBottom: 16 }} />}
    {items.length === 0 ? <Card><Empty description="暂无方法。建议从一条已被真实经历验证的规则开始。" /></Card> : <>
      <Card style={{ marginBottom: 16 }}>
        <MethodologyFilters keyword={keyword} category={category} onKeywordChange={setKeyword} onCategoryChange={setCategory} />
      </Card>
      {filteredItems.length === 0
        ? <Card><Empty description="没有匹配的方法"><Button onClick={clearFilters}>清除筛选</Button></Empty></Card>
        : <List grid={{ gutter: 16, column: 3, xs: 1, md: 2 }} dataSource={filteredItems} renderItem={(item) => <List.Item><Card title={item.title} extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(item)} />}><Space style={{ marginBottom: 12 }}><Tag>{categoryLabels[item.category]}</Tag>{item.review_status === 'pending' && <Tag color="orange">待确认</Tag>}</Space><Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>{item.content}</Typography.Paragraph></Card></List.Item>} />}
    </>}
    <Modal title="添加投资方法" open={open} okText="保存" cancelText="取消" onCancel={() => setOpen(false)} onOk={save}><Form form={form} layout="vertical" initialValues={{ category: 'discipline' }}><Form.Item name="title" label="方法标题" rules={[{ required: true }]}><Input placeholder="例如：达到什么条件才增加仓位" /></Form.Item><Form.Item name="category" label="分类" rules={[{ required: true }]}><Select options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))} /></Form.Item><Form.Item name="content" label="规则内容" rules={[{ required: true }]}><Input.TextArea rows={5} placeholder="写清适用条件、执行方式和例外情况" /></Form.Item></Form></Modal>
  </AuthGuard>;
}
