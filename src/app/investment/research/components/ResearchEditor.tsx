'use client';
import { Button, Card, Form, Input, Space, Typography } from 'antd';
import { useEffect } from 'react';
import type { ResearchProfile, ResearchProfileInput } from '@/types/life-os';
import FieldGuidance from '../../components/FieldGuidance';
import ResearchChecklist from './ResearchChecklist';

const coreFields: Array<{ name: keyof ResearchProfileInput; title: string; section: string; guidance: string }> = [
  { name: 'business_model', title: '公司靠什么生意挣钱？', section: '生意本质', guidance: '写清主要客户、交付的价值和收入来源；不必复述公司历史或产品清单。' },
  { name: 'customer_value', title: '为什么客户愿意持续付钱？', section: '生意本质', guidance: '写客户真正购买的结果及需求持续的原因；避免只写“体验好”。' },
  { name: 'competitive_advantage', title: '为什么竞争者难以抢走？', section: '持续竞争力', guidance: '写最关键且可验证的优势及其持续机制；不罗列泛泛的公司优点。' },
  { name: 'long_term_assumptions', title: '五年后继续挣钱依赖哪些关键假设？', section: '关键假设', guidance: '写必须持续成立的外部条件和内部能力；不确定时直接写待验证事项。' },
  { name: 'invalidation_conditions', title: '什么事实出现会证明判断错误？', section: '失效条件', guidance: '写可观察、可证伪的反证；例：核心产品连续两个季度量价齐跌。' },
  { name: 'earnings_quality', title: '挣到的钱质量如何？', section: '经济质量', guidance: '写利润能否转化为现金、维持增长需要多少投入及资本回报的持续性。' },
];

export default function ResearchEditor({ initial, saving, onSubmit }: { initial: ResearchProfile; saving: boolean; onSubmit: (input: ResearchProfileInput) => void | Promise<void> }) {
  const [form] = Form.useForm<ResearchProfileInput>();
  useEffect(() => { form.setFieldsValue(initial); }, [form, initial]);
  return <Form form={form} layout="vertical" onFinish={onSubmit}><Space direction="vertical" size={16} style={{ width: '100%' }}>
    {coreFields.map((field) => <Card size="small" key={field.name} title={field.section}><Form.Item name={field.name} label={<Typography.Text strong>{field.title}</Typography.Text>} extra={<FieldGuidance>{field.guidance}</FieldGuidance>}><Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} /></Form.Item></Card>)}
    <Card size="small" title="管理者与文化（辅助观察）"><Form.Item name="management_culture" label="诚信、资本配置、对小股东态度和激励机制" extra={<FieldGuidance>用可验证的行为评估诚信、资本配置、激励和对小股东的态度；不以个人魅力代替证据。</FieldGuidance>}><Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} /></Form.Item></Card>
    <Card size="small" title="当前综合判断"><Form.Item name="current_judgment" label="当前结论" extra={<FieldGuidance>写基于当前证据的阶段性判断和置信边界；这里不直接写买卖决定。</FieldGuidance>}><Input.TextArea rows={2} /></Form.Item><Form.Item name="risks" label="主要风险" extra={<FieldGuidance>写可能改变长期收益或估值的具体风险及传导路径；避免只写“竞争激烈”或“宏观不好”。</FieldGuidance>}><Input.TextArea rows={2} /></Form.Item><Form.Item name="unknowns" label="仍不知道的事情" extra={<FieldGuidance>写当前无法回答且会影响判断的问题；后续可转为验证任务。</FieldGuidance>}><Input.TextArea rows={2} /></Form.Item></Card>
    <Card size="small" title="原投资逻辑 / 研究摘要"><Form.Item name="investment_thesis" extra={<FieldGuidance>用于保留旧版内容或汇总研究主线；不要用它替代上方的结构化回答。</FieldGuidance>}><Input.TextArea rows={3} /></Form.Item></Card>
    <ResearchChecklist /><Form.Item name="asset_name" hidden><Input /></Form.Item><Button type="primary" htmlType="submit" loading={saving}>保存当前研究</Button>
  </Space></Form>;
}
