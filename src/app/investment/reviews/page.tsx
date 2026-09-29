'use client';

import { Alert, App, Button, Card, DatePicker, Empty, Form, Input, List, Modal, Select, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import type { InvestmentDecision, InvestmentReview, InvestmentReviewInput, InvestmentReviewDecisionType } from '@/types/life-os';

const decisionLabels = { buy: '买入', sell: '卖出', hold: '持有', skip: '放弃' } as const;

export default function InvestmentReviewsPage() {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [items, setItems] = useState<InvestmentReview[]>([]);
  const [decisions, setDecisions] = useState<InvestmentDecision[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [response, decisionResponse] = await Promise.all([fetch('/api/investment/reviews'), fetch('/api/investment/decisions?status=finalized')]);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '复盘加载失败');
      setItems(data); if (decisionResponse.ok) setDecisions(await decisionResponse.json()); setError('');
    } catch (err) { setError(err instanceof Error ? err.message : '复盘加载失败'); }
  }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const save = async () => {
    const values = await form.validateFields();
    const input: InvestmentReviewInput = { ...values, review_date: values.review_date.format('YYYY-MM-DD'), source_type: 'manual' };
    const response = await fetch('/api/investment/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    const data = await response.json();
    if (!response.ok) return message.error(data.error || '保存失败');
    message.success('复盘已保存'); setOpen(false); form.resetFields(); await load();
  };

  const remove = (item: InvestmentReview) => modal.confirm({
    title: '删除这条复盘？', content: `${item.asset_name} · ${item.review_date}`, okText: '删除', okButtonProps: { danger: true }, cancelText: '取消',
    onOk: async () => { const response = await fetch(`/api/investment/reviews/${item.id}`, { method: 'DELETE' }); if (!response.ok) throw new Error('删除失败'); await load(); },
  });

  const selectDecision = (decisionId: string | undefined) => {
    const decision = decisions.find((item) => item.id === decisionId);
    if (!decision) return;
    const mapped: InvestmentReviewDecisionType = decision.decision_type === 'buy' || decision.decision_type === 'add' ? 'buy' : decision.decision_type === 'sell' || decision.decision_type === 'reduce' ? 'sell' : decision.decision_type === 'skip' ? 'skip' : 'hold';
    form.setFieldsValue({ asset_name: decision.asset_name, decision_type: mapped, original_reason: decision.final_reason });
  };

  return <AuthGuard>
    <div className="page-heading"><div><Typography.Title level={2}>投资复盘</Typography.Title><Typography.Text type="secondary">记录当初为什么判断、后来发生了什么，以及下次如何改进。</Typography.Text></div><Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新建复盘</Button></div>
    {error && <Alert type="warning" showIcon message="投资复盘尚未连接" description={`${error}。请执行迁移 005_investment_reviews.sql。`} style={{ marginBottom: 16 }} />}
    {items.length === 0 ? <Card><Empty description="还没有复盘。先从一次真实买卖或一次放弃开始。" /></Card> : <List grid={{ gutter: 16, column: 2, xs: 1 }} dataSource={items} renderItem={(item) => <List.Item><Card title={<Space><span>{item.asset_name}</span><Tag>{decisionLabels[item.decision_type]}</Tag></Space>} extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(item)} />}><Typography.Text type="secondary">{item.review_date}</Typography.Text><ReviewField title="当初依据" value={item.original_reason} /><ReviewField title="实际结果" value={item.actual_result} /><ReviewField title="做对了" value={item.correct_points} /><ReviewField title="需要改进" value={item.mistake_points} /><ReviewField title="复盘结论" value={item.lesson} strong /></Card></List.Item>} />}
    <Modal title="新建投资复盘" open={open} okText="保存" cancelText="取消" onCancel={() => setOpen(false)} onOk={save} width={680}><Form form={form} layout="vertical"><Form.Item name="decision_id" label="关联原始决策（可选）" extra="选择后会带出公司、决策类型和当时理由，你仍可补充复盘内容。"><Select allowClear showSearch optionFilterProp="label" onChange={selectDecision} options={decisions.map((item) => ({ value: item.id, label: `${item.asset_name} · ${item.decision_date ?? '未注明日期'} · ${item.final_reason}` }))} /></Form.Item><div className="plan-form-grid"><Form.Item name="asset_name" label="标的" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="review_date" label="复盘日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item><Form.Item name="decision_type" label="当时决策" rules={[{ required: true }]}><Select options={[{ value: 'buy', label: '买入' }, { value: 'sell', label: '卖出' }, { value: 'hold', label: '持有' }, { value: 'skip', label: '放弃' }]} /></Form.Item></div><Form.Item name="original_reason" label="当初的判断依据" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item><Form.Item name="actual_result" label="后来发生了什么"><Input.TextArea rows={2} /></Form.Item><Form.Item name="correct_points" label="哪些判断正确"><Input.TextArea rows={2} /></Form.Item><Form.Item name="mistake_points" label="哪些判断错误或遗漏"><Input.TextArea rows={2} /></Form.Item><Form.Item name="lesson" label="以后如何改进" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item></Form></Modal>
  </AuthGuard>;
}

function ReviewField({ title, value, strong = false }: { title: string; value?: string; strong?: boolean }) {
  if (!value) return null;
  return <div style={{ marginTop: 12 }}><Typography.Text type="secondary">{title}</Typography.Text><Typography.Paragraph strong={strong} style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0' }}>{value}</Typography.Paragraph></div>;
}
