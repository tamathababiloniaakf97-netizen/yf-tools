'use client';
import { Button, Card, Form, Input, Space, Typography } from 'antd';
import { useEffect } from 'react';
import type { ResearchProfile, ResearchProfileInput } from '@/types/life-os';
import ResearchChecklist from './ResearchChecklist';

const coreFields: Array<{ name: keyof ResearchProfileInput; title: string; section: string; placeholder: string }> = [
  { name: 'business_model', title: '公司靠什么生意挣钱？', section: '生意本质', placeholder: '直接写清收入来源和价值交换，不必介绍公司历史。' },
  { name: 'customer_value', title: '为什么客户愿意持续付钱？', section: '生意本质', placeholder: '客户真正购买的价值是什么？为什么需求会持续？' },
  { name: 'competitive_advantage', title: '为什么竞争者难以抢走？', section: '持续竞争力', placeholder: '写最关键、可验证的竞争优势，而不是罗列优点。' },
  { name: 'long_term_assumptions', title: '五年后继续挣钱依赖哪些关键假设？', section: '关键假设', placeholder: '如果暂不知道，写清下一步需要验证什么。' },
  { name: 'invalidation_conditions', title: '什么事实出现会证明判断错误？', section: '失效条件', placeholder: '写可观察的反证，不写泛泛风险。' },
  { name: 'earnings_quality', title: '挣到的钱质量如何？', section: '经济质量', placeholder: '关注现金流、资本投入和利润可分配性。' },
];

export default function ResearchEditor({ initial, saving, onSubmit }: { initial: ResearchProfile; saving: boolean; onSubmit: (input: ResearchProfileInput) => void | Promise<void> }) {
  const [form] = Form.useForm<ResearchProfileInput>();
  useEffect(() => { form.setFieldsValue(initial); }, [form, initial]);
  return <Form form={form} layout="vertical" onFinish={onSubmit}><Space direction="vertical" size={16} style={{ width: '100%' }}>
    {coreFields.map((field) => <Card size="small" key={field.name} title={field.section}><Form.Item name={field.name} label={<Typography.Text strong>{field.title}</Typography.Text>}><Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} placeholder={field.placeholder} /></Form.Item></Card>)}
    <Card size="small" title="管理者与文化（辅助观察）"><Form.Item name="management_culture" label="诚信、资本配置、对小股东态度和激励机制"><Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} /></Form.Item></Card>
    <Card size="small" title="当前综合判断"><Form.Item name="current_judgment" label="当前结论"><Input.TextArea rows={2} /></Form.Item><Form.Item name="risks" label="主要风险"><Input.TextArea rows={2} /></Form.Item><Form.Item name="unknowns" label="仍不知道的事情"><Input.TextArea rows={2} placeholder="可以在保存后转成投资待办" /></Form.Item></Card>
    <Card size="small" title="原投资逻辑 / 研究摘要"><Form.Item name="investment_thesis" extra="保留升级前已有内容，不会自动拆解或覆盖。"><Input.TextArea rows={3} /></Form.Item></Card>
    <ResearchChecklist /><Form.Item name="asset_name" hidden><Input /></Form.Item><Button type="primary" htmlType="submit" loading={saving}>保存当前研究</Button>
  </Space></Form>;
}
