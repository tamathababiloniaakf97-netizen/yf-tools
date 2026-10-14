'use client';
import { Alert, Card, Descriptions, Empty, Space, Tag, Typography } from 'antd';
import type { ResearchProfile, ResearchSnapshot } from '@/types/life-os';

const fields: Array<[keyof ResearchProfile, string]> = [
  ['investment_thesis', '研究摘要'], ['current_judgment', '当时的判断'],
  ['business_model', '商业模式'], ['customer_value', '客户价值'],
  ['competitive_advantage', '竞争优势'], ['long_term_assumptions', '长期关键假设'],
  ['earnings_quality', '盈利质量'], ['management_culture', '管理层与文化'],
  ['risks', '主要风险'], ['invalidation_conditions', '判断失效条件'],
  ['unknowns', '未知事项'], ['industry_impact', '行业对公司的影响'],
];
const statuses = { unverified: '待验证', supported: '暂时支持', challenged: '受到挑战', not_applicable: '不适用' };
const impacts = { support: '支持', challenge: '挑战', mixed: '混合', neutral: '中性' };
const checks: Record<string, string> = { pricing_power: '定价权', moat_change: '护城河变化', capital_returns: '资本回报', cash_conversion: '利润转现金', management_integrity: '管理者诚信', minority_shareholders: '小股东待遇' };
const checkStatuses = { considered: '已考虑', not_applicable: '不适用', needs_validation: '需要验证' };
const textStyle = { whiteSpace: 'pre-wrap' as const, overflowWrap: 'anywhere' as const };
const show = (value?: string | null) => value?.trim() ? value : '未填写';

export default function SnapshotDetail({ snapshot }: { snapshot: ResearchSnapshot }) {
  const { profile, hypotheses } = snapshot.snapshot_data;
  const evidence = snapshot.evidence_snapshot;
  return <Space orientation="vertical" size="large" style={{ width: '100%', ...textStyle }}>
    <Alert type="info" showIcon title="这是保存时的历史内容，只读。后续修改当前研究不会改变此版本。" />
    <div><Typography.Title level={4}>{profile.asset_name} · 版本 {snapshot.snapshot_version}</Typography.Title><Typography.Text type="secondary">保存时间：{new Date(snapshot.created_at).toLocaleString('zh-CN')}</Typography.Text></div>
    <Descriptions title="研究正文" bordered column={1} items={fields.map(([key, label]) => ({ key, label, children: show(profile[key] as string | undefined) }))} />
    <Card title="辅助检查记录" size="small">
      {Object.entries(profile.checklist_state ?? {}).length === 0 ? <Typography.Text type="secondary">未记录辅助检查</Typography.Text> : Object.entries(profile.checklist_state).map(([key, item]) => <Typography.Paragraph key={key}><strong>{checks[key] ?? key}</strong> · {checkStatuses[item.status] ?? item.status}<br />{show(item.note)}</Typography.Paragraph>)}
    </Card>
    <section style={{ width: '100%' }}><Typography.Title level={4}>研究假设 · {hypotheses.length} 条</Typography.Title>
      {hypotheses.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="此版本未记录研究假设" /> : hypotheses.map(item => <Card key={item.id} size="small" style={{ marginBottom: 12 }}>
        <Tag>{statuses[item.status] ?? item.status}</Tag><Typography.Paragraph style={{ marginTop: 8 }}>{item.statement}</Typography.Paragraph>
        <Typography.Paragraph>关键变量：{show(item.key_variables)}</Typography.Paragraph><Typography.Text type="secondary">下次检查：{item.next_check_at || '未设置'}</Typography.Text>
      </Card>)}
    </section>
    <section style={{ width: '100%' }}><Typography.Title level={4}>证据记录 · {evidence.length} 条</Typography.Title>
      {evidence.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="此版本未记录证据" /> : evidence.map(item => <Card key={item.id} size="small" style={{ marginBottom: 12 }}>
        <Tag>{impacts[item.impact] ?? item.impact}</Tag><Typography.Paragraph style={{ marginTop: 8 }}>{item.content}</Typography.Paragraph>
        <Typography.Paragraph>来源：{item.source_url && /^https?:\/\//i.test(item.source_url) ? <a href={item.source_url} target="_blank" rel="noopener noreferrer">{item.source_name || item.source_url}</a> : show(item.source_name)}</Typography.Paragraph>
        <Typography.Paragraph>发生时间：{item.occurred_at || '未记录'}</Typography.Paragraph>
        {item.hypothesis_id && <Typography.Paragraph>关联假设：<span>{hypotheses.find(h => h.id === item.hypothesis_id)?.statement || '此版本未包含该假设'}</span></Typography.Paragraph>}
      </Card>)}
    </section>
  </Space>;
}
