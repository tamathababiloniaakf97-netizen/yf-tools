'use client';
import { Alert, Button, Card, Form, Input, Select, Space, Tag, Typography } from 'antd';
import { useEffect } from 'react';
import type { InvestmentDecision, InvestmentDecisionInput, ResearchSnapshot } from '@/types/life-os';

const decisionOptions = [
  ['buy', '买入'], ['add', '加仓'], ['hold', '持有'], ['reduce', '减仓'], ['sell', '卖出'], ['watch', '继续观察'], ['skip', '放弃'],
].map(([value, label]) => ({ value, label }));

export default function DecisionEditor({ decision, snapshots, saving, onSave, onFinalize }: { decision: InvestmentDecision; snapshots: ResearchSnapshot[]; saving: boolean; onSave: (input: InvestmentDecisionInput) => void | Promise<void>; onFinalize: (input: InvestmentDecisionInput) => void | Promise<void> }) {
  const [form] = Form.useForm<InvestmentDecisionInput>(); const finalized = decision.status === 'finalized';
  useEffect(() => { form.setFieldsValue(decision); }, [decision, form]);
  const values = () => form.validateFields();
  return <Form form={form} layout="vertical" disabled={finalized}><Space orientation="vertical" size={16} style={{ width: '100%' }}>
    {finalized && <Alert type="success" showIcon message="已定稿，只读" description="观点变化时请新建决策，不要覆盖历史。" />}
    <Card title="研究依据"><Form.Item name="research_snapshot_id" label="关联研究快照（定稿必选）"><Select allowClear placeholder="选择当时的研究快照" options={snapshots.map((item) => ({ value: item.id, label: `版本 ${item.snapshot_version} · ${new Date(item.created_at).toLocaleDateString('zh-CN')}` }))} /></Form.Item></Card>
    <Card title="市场预期"><Form.Item name="market_expectation" label="市场当前主要相信什么？"><Input.TextArea rows={2} /></Form.Item><Form.Item name="personal_divergence" label="我的判断与市场的关键分歧"><Input.TextArea rows={2} /></Form.Item></Card>
    <Card title="估值"><Form.Item name="valuation_conclusion" label="估值结论"><Input.TextArea rows={2} placeholder="可以写区间或定性判断，不强迫精确数字" /></Form.Item><Form.Item name="valuation_assumptions" label="关键假设"><Input.TextArea rows={2} /></Form.Item></Card>
    <Card title="安全边际"><Form.Item name="safety_margin" label="安全边际是否足够，为什么？"><Input.TextArea rows={3} /></Form.Item></Card>
    <Card title="投资计划"><Form.Item name="investment_plan" label="仓位上限、资金安排和分批原则（可选）" extra="价格和日期提醒请转到投资待办。"><Input.TextArea rows={3} /></Form.Item></Card>
    <Card title="如果错了怎么办"><Form.Item name="error_signals" label="哪些事实说明判断错了？"><Input.TextArea rows={2} /></Form.Item><Form.Item name="error_response" label="错了以后如何处理？"><Input.TextArea rows={2} /></Form.Item></Card>
    <Card title="不为清单"><Form.Item name="do_not_list" label="本次明确不能做什么（可选）"><Select mode="tags" tokenSeparators={[',']} placeholder="例如：不追涨、不超出仓位上限" /></Form.Item></Card>
    <Card title="最终结论"><div className="plan-form-grid"><Form.Item name="decision_type" label="决定"><Select allowClear options={decisionOptions} /></Form.Item><Form.Item name="decision_date" label="决策日期"><Input type="date" /></Form.Item></div><Form.Item name="final_reason" label="核心理由"><Input.TextArea rows={3} /></Form.Item></Card>
    <Form.Item name="research_profile_id" hidden><Input /></Form.Item><Form.Item name="asset_name" hidden><Input /></Form.Item>
    {!finalized && <Space><Button type="primary" loading={saving} onClick={() => void values().then(onSave)}>保存草稿</Button><Button loading={saving} onClick={() => void values().then(onFinalize)}>定稿</Button><Typography.Text type="secondary"><Tag>定稿后不可覆盖</Tag></Typography.Text></Space>}
  </Space></Form>;
}
