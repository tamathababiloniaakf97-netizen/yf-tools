'use client';
import { Alert, Button, Card, Form, Input, Select, Space, Tag, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useAuthSession } from '@/components/AuthSessionContext';
import { decisionDraftKey } from '@/lib/investment/decision-draft';
import type { InvestmentDecision, InvestmentDecisionInput, ResearchSnapshot } from '@/types/life-os';
import FieldGuidance from '../../components/FieldGuidance';

const decisionOptions = [
  ['buy', '买入'], ['add', '加仓'], ['hold', '持有'], ['reduce', '减仓'], ['sell', '卖出'], ['watch', '继续观察'], ['skip', '放弃'],
].map(([value, label]) => ({ value, label }));

export default function DecisionEditor({ decision, snapshots, saving, onSave, onFinalize }: { decision: InvestmentDecision; snapshots: ResearchSnapshot[]; saving: boolean; onSave: (input: InvestmentDecisionInput) => void | Promise<void>; onFinalize: (input: InvestmentDecisionInput) => void | Promise<void> }) {
  const [form] = Form.useForm<InvestmentDecisionInput>(); const finalized = decision.status === 'finalized';
  const { user } = useAuthSession();
  const userId = user?.id || decision.user_id;
  const key = userId && decision.research_profile_id ? decisionDraftKey(userId, decision) : null;
  const [notice, setNotice] = useState('');
  const previousProfile = useRef(decision.research_profile_id);
  useEffect(() => {
    let nextNotice = '填写内容会自动暂存在本浏览器';
    const unassigned = !previousProfile.current && decision.research_profile_id ? form.getFieldsValue() : null;
    previousProfile.current = decision.research_profile_id;
    form.resetFields();
    form.setFieldsValue(decision);
    if (unassigned) form.setFieldsValue({ ...unassigned, research_profile_id: decision.research_profile_id, asset_name: decision.asset_name });
    try {
      const raw = !finalized && key ? localStorage.getItem(key) : null;
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && typeof draft === 'object' && !Array.isArray(draft)) {
          form.setFieldsValue({ ...draft, research_profile_id: decision.research_profile_id, asset_name: decision.asset_name });
          nextNotice = '已恢复本浏览器中未保存的草稿';
        }
      }
    } catch { nextNotice = '浏览器草稿无法读取，请及时点击保存草稿'; }
    const timer = window.setTimeout(() => setNotice(nextNotice), 0);
    return () => window.clearTimeout(timer);
  }, [decision, form, key, finalized]);
  const cacheDraft = (_: unknown, all: InvestmentDecisionInput) => {
    if (!key || finalized) return;
    try {
      localStorage.setItem(key, JSON.stringify(all, (_key, value) => value === undefined ? null : value));
      setNotice('未保存的内容已暂存在本浏览器');
    } catch { setNotice('浏览器暂存失败，请及时点击保存草稿'); }
  };
  const values = () => form.validateFields();
  return <Form form={form} layout="vertical" disabled={finalized || saving} onValuesChange={cacheDraft}><Space orientation="vertical" size={16} style={{ width: '100%' }}>
    {!finalized && <Typography.Text type="secondary">{notice}</Typography.Text>}
    {finalized && <Alert type="success" showIcon message="已定稿，只读" description="观点变化时请新建决策，不要覆盖历史。" />}
    <Card title="研究依据"><Form.Item name="research_snapshot_id" label="关联研究快照（定稿必选）" extra={<FieldGuidance>选择本次决策真正依据的当时研究版本；定稿后该版本不会被后续研究覆盖。</FieldGuidance>}><Select allowClear placeholder="选择当时的研究快照" options={snapshots.map((item) => ({ value: item.id, label: `版本 ${item.snapshot_version} · ${new Date(item.created_at).toLocaleDateString('zh-CN')}` }))} /></Form.Item></Card>
    <Card title="市场预期"><Form.Item name="market_expectation" label="市场当前主要相信什么？" extra={<FieldGuidance>写当前价格隐含的主流预期及其依据；不要把自己的观点写在这里。</FieldGuidance>}><Input.TextArea rows={2} /></Form.Item><Form.Item name="personal_divergence" label="我的判断与市场的关键分歧" extra={<FieldGuidance>只写会实质影响价值或回报的分歧，并说明自己为何可能正确。</FieldGuidance>}><Input.TextArea rows={2} /></Form.Item></Card>
    <Card title="估值"><Form.Item name="valuation_conclusion" label="估值结论" extra={<FieldGuidance>写合理价值区间或明确的定性判断，并标明使用的方法；不强迫一个精确数字。</FieldGuidance>}><Input.TextArea rows={2} /></Form.Item><Form.Item name="valuation_assumptions" label="关键假设" extra={<FieldGuidance>写对结果最敏感的少数变量及取值依据；例：收入增速、利润率、折现率。</FieldGuidance>}><Input.TextArea rows={2} /></Form.Item></Card>
    <Card title="安全边际"><Form.Item name="safety_margin" label="安全边际是否足够，为什么？" extra={<FieldGuidance>说明当前价格对估值偏差和不确定性留出了多少空间；不把“好公司”等同于“有安全边际”。</FieldGuidance>}><Input.TextArea rows={3} /></Form.Item></Card>
    <Card title="投资计划"><Form.Item name="investment_plan" label="仓位上限、资金安排和分批原则（可选）" extra={<FieldGuidance>写与自身风险承受力一致的上限和执行原则；价格、日期提醒转到投资待办。</FieldGuidance>}><Input.TextArea rows={3} /></Form.Item></Card>
    <Card title="如果错了怎么办"><Form.Item name="error_signals" label="哪些事实说明判断错了？" extra={<FieldGuidance>写未来能被观察的证伪信号；例：核心客户留存率持续下降，而非只写“股价下跌”。</FieldGuidance>}><Input.TextArea rows={2} /></Form.Item><Form.Item name="error_response" label="错了以后如何处理？" extra={<FieldGuidance>预先写明暂停加仓、重新评估、减仓或退出的触发原则；避免临场决定。</FieldGuidance>}><Input.TextArea rows={2} /></Form.Item></Card>
    <Card title="不为清单"><Form.Item name="do_not_list" label="本次明确不能做什么（可选）" extra={<FieldGuidance>只记录本次最需要约束的行为；例：不追涨、不超出仓位上限。</FieldGuidance>}><Select mode="tags" tokenSeparators={[',']} /></Form.Item></Card>
    <Card title="最终结论"><div className="plan-form-grid"><Form.Item name="decision_type" label="决定" extra={<FieldGuidance>选择这一时点的真实行动结论；“继续观察”和“放弃”也是有效决策。</FieldGuidance>}><Select allowClear options={decisionOptions} /></Form.Item><Form.Item name="decision_date" label="决策日期" extra={<FieldGuidance>记录实际作出这次判断的日期，不是补录或最后编辑日期。</FieldGuidance>}><Input type="date" /></Form.Item></div><Form.Item name="final_reason" label="核心理由" extra={<FieldGuidance>用少数几句连起分歧、估值、安全边际和行动；不要复制整份公司研究。</FieldGuidance>}><Input.TextArea rows={3} /></Form.Item></Card>
    <Form.Item name="research_profile_id" hidden><Input /></Form.Item><Form.Item name="asset_name" hidden><Input /></Form.Item>
    {!finalized && <Space><Button type="primary" loading={saving} onClick={() => void values().then(onSave)}>保存草稿</Button><Button loading={saving} onClick={() => void values().then(onFinalize)}>定稿</Button><Typography.Text type="secondary"><Tag>定稿后不可覆盖</Tag></Typography.Text></Space>}
  </Space></Form>;
}



