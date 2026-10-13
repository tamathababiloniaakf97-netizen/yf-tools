'use client';

import { Alert, App, Button, Empty, Form, Input, Modal, Popconfirm, Select, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import LightweightFormattedText from '@/components/LightweightFormattedText';
import LightweightTextEditor from '@/components/LightweightTextEditor';
import ResizableSplitPane from '@/components/ResizableSplitPane';
import { filterMethodologyItems, type MethodologyCategoryFilter } from '@/lib/investment/methodology-search';
import { stripLightweightFormatting } from '@/lib/lightweight-formatting';
import type { MethodologyInput, MethodologyItem } from '@/types/life-os';
import MethodologyFilters from './components/MethodologyFilters';

const categoryLabels = { selection: '选股', valuation: '估值', position: '仓位', discipline: '纪律', review: '复盘' } as const;

export default function MethodologyPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [items, setItems] = useState<MethodologyItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [editing, setEditing] = useState<MethodologyItem | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<MethodologyCategoryFilter>('all');

  const filteredItems = useMemo(() => filterMethodologyItems(items, { keyword, category }), [items, keyword, category]);
  const selected = filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0] ?? null;

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/investment/methodology');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '方法论加载失败');
      setItems(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '方法论加载失败');
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const startCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ category: 'discipline' });
    setOpen(true);
  };

  const startEdit = (item: MethodologyItem) => {
    setEditing(item);
    form.setFieldsValue({ title: item.title, category: item.category, content: item.content });
    setOpen(true);
  };

  const save = async () => {
    const values = await form.validateFields() as MethodologyInput;
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/investment/methodology/${editing.id}` : '/api/investment/methodology', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          status: editing?.status,
          source_type: editing?.source_type ?? 'manual',
          source_ref: editing?.source_ref ?? null,
          review_status: editing?.review_status,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '保存失败');
      await load();
      setSelectedId(data.id);
      setOpen(false);
      setEditing(null);
      form.resetFields();
      message.success(editing ? '方法已更新' : '方法已保存');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: MethodologyItem) => {
    const response = await fetch(`/api/investment/methodology/${item.id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) return message.error(data.error || '删除失败');
    if (selectedId === item.id) setSelectedId(undefined);
    await load();
    message.success('方法已删除');
  };

  const clearFilters = () => { setKeyword(''); setCategory('all'); };

  return <AuthGuard>
    <div className="page-heading"><div><Typography.Title level={2}>投资方法论</Typography.Title><Typography.Text type="secondary">只沉淀经过实际复盘得到的规则，不收集空泛金句。</Typography.Text></div><Button type="primary" icon={<PlusOutlined />} onClick={startCreate}>添加方法</Button></div>
    {error && <Alert type="warning" showIcon message="方法论尚未连接" description={`${error}。请执行迁移 005_investment_reviews.sql。`} style={{ marginBottom: 16 }} />}
    {items.length === 0 ? <div className="methodology-empty"><Empty description="暂无方法。建议从一条已被真实经历验证的规则开始。" /></div> :
      <ResizableSplitPane className="methodology-shell" storageKey="life-os:investment-methodology:left-width" defaultLeftWidth={340}>
        <aside className="methodology-list"><div className="methodology-tools"><MethodologyFilters keyword={keyword} category={category} onKeywordChange={setKeyword} onCategoryChange={setCategory} /></div><div className="methodology-feed">
          {filteredItems.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的方法"><Button onClick={clearFilters}>清除筛选</Button></Empty> : filteredItems.map((item) => <button type="button" key={item.id} className={`methodology-row ${selected?.id === item.id ? 'is-selected' : ''}`} onClick={() => setSelectedId(item.id)}><span className="methodology-row-meta"><Tag>{categoryLabels[item.category]}</Tag>{item.review_status === 'pending' && <Tag color="orange">待确认</Tag>}</span><strong>{item.title}</strong><span className="methodology-excerpt">{stripLightweightFormatting(item.content)}</span></button>)}
        </div></aside>
        <main className="methodology-reader">{!selected ? <Empty description="选择一条方法查看详情" /> : <article><header className="methodology-article-head"><div><Tag>{categoryLabels[selected.category]}</Tag>{selected.review_status === 'pending' && <Tag color="orange">待确认</Tag>}</div><Typography.Title level={2}>{selected.title}</Typography.Title><div className="methodology-actions"><Button icon={<EditOutlined />} onClick={() => startEdit(selected)}>编辑</Button><Popconfirm title="删除这条方法？" description={selected.title} okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => void remove(selected)}><Button danger icon={<DeleteOutlined />}>删除</Button></Popconfirm></div></header><LightweightFormattedText className="methodology-body" value={selected.content}/></article>}</main>
      </ResizableSplitPane>}
    <Modal title={editing ? '编辑投资方法' : '添加投资方法'} open={open} okText="保存" cancelText="取消" confirmLoading={saving} onCancel={() => { setOpen(false); setEditing(null); }} onOk={() => void save()}><Form form={form} layout="vertical"><Form.Item name="title" label="方法标题" rules={[{ required: true, message: '请填写方法标题' }]}><Input placeholder="例如：达到什么条件才增加仓位" /></Form.Item><Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}><Select options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))} /></Form.Item><Form.Item name="content" label="规则内容" rules={[{ required: true, message: '请填写规则内容' }]}><LightweightTextEditor ariaLabel="规则内容" autoSize={{ minRows: 7, maxRows: 14 }} placeholder="写清适用条件、执行方式和例外情况" /></Form.Item></Form></Modal>
  </AuthGuard>;
}
