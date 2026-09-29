'use client';
import { Collapse, Form, Input, Select, Space, Typography } from 'antd';
import type { ResearchChecklistState } from '@/types/life-os';

const prompts = [
  ['pricing_power', '公司是否具有定价权？'], ['moat_change', '护城河是否正在扩大或收窄？'],
  ['capital_returns', '资本回报是否可持续？'], ['cash_conversion', '利润能否转换为现金？'],
  ['management_integrity', '管理者是否诚信并兑现承诺？'], ['minority_shareholders', '管理层如何对待小股东？'],
] as const;

export default function ResearchChecklist() {
  return <Collapse ghost items={[{ key: 'checks', label: '辅助检查提示（不计分、不要求全部填写）', children: <Space direction="vertical" style={{ width: '100%' }}>
    {prompts.map(([key, label]) => <div key={key} style={{ paddingBottom: 8 }}><Typography.Text>{label}</Typography.Text><div className="plan-form-grid" style={{ marginTop: 6 }}>
      <Form.Item name={['checklist_state', key, 'status']} noStyle><Select allowClear placeholder="选择状态" options={[{ value: 'considered', label: '已考虑' }, { value: 'not_applicable', label: '不适用' }, { value: 'needs_validation', label: '需要验证' }]} /></Form.Item>
      <Form.Item name={['checklist_state', key, 'note']} noStyle><Input placeholder="简短备注（可选）" /></Form.Item>
    </div></div>)}
  </Space> }]} />;
}

export function emptyChecklist(): ResearchChecklistState { return {}; }
