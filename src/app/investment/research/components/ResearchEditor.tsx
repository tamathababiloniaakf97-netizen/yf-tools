'use client';
import { Button, Card, Empty, Form, Input, Tag, Typography } from 'antd';
import { useEffect } from 'react';
import { useRef, useState } from 'react';
import type { EvidenceRecord, IndustryProfile, ResearchField, ResearchProfile, ResearchProfileInput } from '@/types/life-os';
import FieldGuidance from '../../components/FieldGuidance';
import ResearchChecklist from './ResearchChecklist';
import CompanyIndustrySection from './CompanyIndustrySection';

const coreFields: Array<{ name: keyof ResearchProfileInput; title: string; section: string; guidance: string; financialEvidence?: string }> = [
  { name: 'business_model', title: '公司靠什么生意挣钱？', section: '生意本质', guidance: '写清主要客户、交付的价值和收入来源；不必复述公司历史或产品清单。', financialEvidence: '必要时确认主要收入和利润来源。' },
  { name: 'customer_value', title: '为什么客户愿意持续付钱？', section: '生意本质', guidance: '写客户真正购买的结果及需求持续的原因；避免只写“体验好”。' },
  { name: 'competitive_advantage', title: '竞争优势来自哪里，靠什么持续？', section: '持续竞争力', guidance: '写最关键且可验证的优势及其持续机制；不罗列泛泛的公司优点。' },
  { name: 'long_term_assumptions', title: '五年后继续挣钱依赖哪些关键假设？', section: '关键假设', guidance: '写必须持续成立的外部条件和内部能力；不确定时直接写待验证事项。' },
  { name: 'invalidation_conditions', title: '什么事实出现会证明判断错误？', section: '失效条件', guidance: '写可观察、可证伪的反证；例：核心产品连续两个季度量价齐跌。', financialEvidence: '尽量加入可通过财务数据验证的反证条件。' },
  { name: 'earnings_quality', title: '挣到的钱质量如何？', section: '经济质量', guidance: '写利润能否转化为现金、维持增长需要多少投入及资本回报的持续性。', financialEvidence: '该判断应有财务数据支持，避免只有主观结论。' },
];

const resizableTextAreaStyle = { resize: 'vertical' as const };

const fieldLabels: Record<ResearchField, string> = {
  business_model: '业务模式',
  customer_value: '客户价值',
  competitive_advantage: '竞争优势',
  long_term_assumptions: '关键假设',
  invalidation_conditions: '失效条件',
  earnings_quality: '经济质量',
  management_culture: '管理者与文化',
  current_judgment: '当前结论',
  risks: '主要风险',
  unknowns: '未知事项',
  investment_thesis: '研究摘要',
};

export default function ResearchEditor({ initial, industries = [], saving, onSubmit, onOpenIndustry = () => {} }: { initial: ResearchProfile; industries?: IndustryProfile[]; saving: boolean; onSubmit: (input: ResearchProfileInput) => void | Promise<void>; onOpenIndustry?: (id:string)=>void }) {
  const [form] = Form.useForm<ResearchProfileInput>();
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [activeField, setActiveField] = useState<ResearchField>('business_model');
  const fieldRefs = useRef<Partial<Record<ResearchField, HTMLDivElement | null>>>({});
  useEffect(() => { form.setFieldsValue(initial); }, [form, initial]);
  useEffect(() => { let active = true; void fetch(`/api/investment/evidence?asset_name=${encodeURIComponent(initial.asset_name)}`).then((response) => response.ok ? response.json() : []).then((data) => { if (active) setEvidence(data); }).catch(() => { if (active) setEvidence([]); }); return () => { active = false; }; }, [initial.asset_name]);
  const citations = (field: ResearchField) => evidence.filter((item) => item.research_field === field);
  const activeCitations = citations(activeField);
  const activeLabel = fieldLabels[activeField];
  const jumpTo = (field: ResearchField) => { setActiveField(field); fieldRefs.current[field]?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return <Form form={form} layout="vertical" onFinish={onSubmit}>
    <div className="research-editor-nav" aria-label="当前研究栏目导航">{coreFields.map((field) => <Button key={field.name} type={activeField === field.name ? 'primary' : 'text'} size="small" onClick={() => jumpTo(field.name as ResearchField)}>{fieldLabels[field.name as ResearchField]}</Button>)}<Button type={activeField === 'management_culture' ? 'primary' : 'text'} size="small" onClick={() => jumpTo('management_culture')}>管理者与文化</Button><Button type={['current_judgment', 'risks', 'unknowns'].includes(activeField) ? 'primary' : 'text'} size="small" onClick={() => jumpTo('current_judgment')}>综合判断</Button><span className="research-editor-nav-actions"><Button type="primary" htmlType="submit" loading={saving}>保存当前研究</Button></span></div>
    <div className="research-editor-layout">
      <div className="research-editor-fields" role="region" aria-label="研究内容滚动区">
        {coreFields.map((field) => <div className="research-editor-section" key={field.name} ref={(node) => { fieldRefs.current[field.name as ResearchField] = node; }}><Card size="small" title={field.section}><Form.Item name={field.name} label={<Typography.Text strong>{field.title}</Typography.Text>} extra={<FieldGuidance financialEvidence={field.financialEvidence}>{field.guidance}</FieldGuidance>}><Input.TextArea onFocus={() => setActiveField(field.name as ResearchField)} rows={3} style={resizableTextAreaStyle} /></Form.Item>{citations(field.name as ResearchField).length > 0 && <Typography.Text type="secondary">引用资料 {citations(field.name as ResearchField).length} 条，已显示在右侧</Typography.Text>}</Card></div>)}
        <div className="research-editor-section" ref={(node) => { fieldRefs.current.management_culture = node; }}><Card size="small" title="管理者与文化（辅助观察）"><Form.Item name="management_culture" label="诚信、资本配置、对小股东态度和激励机制" extra={<FieldGuidance>用可验证的行为评估诚信、资本配置、激励和对小股东的态度；不以个人魅力代替证据。</FieldGuidance>}><Input.TextArea onFocus={() => setActiveField('management_culture')} rows={3} style={resizableTextAreaStyle} /></Form.Item></Card></div>
        <div className="research-editor-section" ref={(node) => { fieldRefs.current.current_judgment = node; }}><Card size="small" title="当前综合判断"><Form.Item name="current_judgment" label="当前结论" extra={<FieldGuidance>写基于当前证据的阶段性判断和置信边界；这里不直接写买卖决定。</FieldGuidance>}><Input.TextArea onFocus={() => setActiveField('current_judgment')} rows={2} style={resizableTextAreaStyle} /></Form.Item><Form.Item name="risks" label="主要风险" extra={<FieldGuidance>写可能改变长期收益或估值的具体风险及传导路径；避免只写“竞争激烈”或“宏观不好”。</FieldGuidance>}><Input.TextArea onFocus={() => setActiveField('risks')} rows={2} style={resizableTextAreaStyle} /></Form.Item><Form.Item name="unknowns" label="仍不知道的事情" extra={<FieldGuidance>写当前无法回答且会影响判断的问题；后续可转为验证任务。</FieldGuidance>}><Input.TextArea onFocus={() => setActiveField('unknowns')} rows={2} style={resizableTextAreaStyle} /></Form.Item></Card></div>
        <div className="research-editor-section" ref={(node) => { fieldRefs.current.investment_thesis = node; }}><Card size="small" title="原投资逻辑 / 研究摘要"><Form.Item name="investment_thesis" extra={<FieldGuidance>用于保留旧版内容或汇总研究主线；不要用它替代上方的结构化回答。</FieldGuidance>}><Input.TextArea onFocus={() => setActiveField('investment_thesis')} rows={3} style={resizableTextAreaStyle} /></Form.Item></Card></div>
        <CompanyIndustrySection industries={industries} companyId={initial.id} companyUpdatedAt={initial.updated_at} onOpenIndustry={onOpenIndustry}/>
        <ResearchChecklist /><Form.Item name="asset_name" hidden><Input /></Form.Item>
      </div>
      <aside className="research-reference-panel" aria-label="当前栏目参考资料"><Card title="参考资料" extra={<Typography.Text type="secondary">{activeLabel} · {activeCitations.length} 条</Typography.Text>}>{activeCitations.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="这个栏目还没有引用资料"><Button href="/investment/materials">去研究资料库引用</Button></Empty> : <div className="research-reference-list">{activeCitations.map((item) => <div className="research-reference-item" key={item.id}><Tag>{item.impact === 'support' ? '支持' : item.impact === 'challenge' ? '挑战' : item.impact === 'mixed' ? '混合' : '背景'}</Tag><Typography.Paragraph ellipsis={{ rows: 4, expandable: true, symbol: '展开' }}>{item.content}</Typography.Paragraph>{item.source_name && <Typography.Text type="secondary">来源：{item.source_name}</Typography.Text>}</div>)}<Button block href="/investment/materials">继续引用资料</Button></div>}</Card></aside>
    </div>
  </Form>;
}
