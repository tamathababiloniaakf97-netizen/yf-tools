'use client';
import { useMemo, useState } from 'react';
import { App, Button, Card, DatePicker, Form, Input, InputNumber, Popconfirm, Radio, Select, Space, Table, Tabs } from 'antd';
import dayjs from 'dayjs';
import type { HouseholdEntryKind, HouseholdFinanceItem, HouseholdLedgerEntry } from '@/types/household-finance';

type Scope = 'business' | 'household' | 'capital';
type FormKind = HouseholdEntryKind | 'loan_repayment';
const kindsByScope: Record<Scope, HouseholdEntryKind[]> = {
  business: ['business_income', 'business_expense', 'business_refund'],
  household: ['household_income', 'household_expense'],
  capital: ['asset_purchase', 'asset_sale', 'loan_drawdown', 'loan_principal_payment', 'loan_interest', 'credit_card_payment', 'investment_transfer_in', 'investment_transfer_out'],
};
const kindLabels: Partial<Record<HouseholdEntryKind, string>> = {
  business_income: '经营收入', business_expense: '经营支出', business_refund: '经营退款', household_income: '家庭收入', household_expense: '家庭支出',
  asset_purchase: '资产购置', asset_sale: '资产处置', loan_drawdown: '新增借款', loan_principal_payment: '偿还本金', loan_interest: '贷款利息',
  credit_card_payment: '偿还信用卡', investment_transfer_in: '投资转入', investment_transfer_out: '投资转出',
};
const defaultKind: Record<Scope, FormKind> = { business: 'business_income', household: 'household_expense', capital: 'asset_purchase' };
const liabilityKinds: FormKind[] = ['loan_repayment', 'loan_drawdown', 'loan_principal_payment', 'loan_interest', 'credit_card_payment'];
export const capitalEntryOptions = [{label:'资产购置',value:'asset_purchase'},{label:'资产处置',value:'asset_sale'},{label:'新增借款',value:'loan_drawdown'},{label:'贷款还款（本金+利息）',value:'loan_repayment'},{label:'偿还本金',value:'loan_principal_payment'},{label:'贷款利息',value:'loan_interest'},{label:'偿还信用卡',value:'credit_card_payment'},{label:'投资转入',value:'investment_transfer_in'},{label:'投资转出',value:'investment_transfer_out'}];

export default function MonthlyEntryPanel({ entries, liabilities, loading, onRefresh }: { entries: HouseholdLedgerEntry[]; liabilities: HouseholdFinanceItem[]; loading: boolean; onRefresh: () => void }) {
  const { message } = App.useApp(); const [saving, setSaving] = useState(false); const [active, setActive] = useState<Scope>('business'); const [editing, setEditing] = useState<HouseholdLedgerEntry | null>(null); const [form] = Form.useForm();
  const currency = Form.useWatch('currency', form) || 'CNY'; const kind = Form.useWatch('kind', form) as FormKind | undefined;
  const visibleEntries = useMemo(() => [...entries].filter(entry => kindsByScope[active].includes(entry.kind)).sort((a,b)=>b.entry_date.localeCompare(a.entry_date)), [active, entries]);
  const liabilityOptions = liabilities.filter(item => item.item_type === 'liability').map(item => ({ value: item.id, label: `${item.name}（${item.category}）` }));

  function reset(scope = active) { setEditing(null); form.resetFields(); form.setFieldsValue({ entry_date: dayjs(), kind: defaultKind[scope], currency: 'CNY' }); }
  function changeScope(key: string) { const scope = key as Scope; setActive(scope); reset(scope); }
  function edit(entry: HouseholdLedgerEntry) {
    const scope = (Object.entries(kindsByScope).find(([, values]) => values.includes(entry.kind))?.[0] || 'capital') as Scope;
    setActive(scope); setEditing(entry);
    form.setFieldsValue({ entry_date: dayjs(entry.entry_date), kind: entry.kind, currency: entry.currency || 'CNY', amount: entry.currency === 'CNY' || !entry.original_amount ? entry.amount_cny : entry.original_amount, fx_rate: entry.fx_rate, liability_id: entry.liability_id, note: entry.note });
  }
  async function save() {
    const values = await form.validateFields(); setSaving(true);
    try {
      const isRepayment = values.kind === 'loan_repayment';
      const url = editing ? `/api/household-finance/entries/${editing.id}` : isRepayment ? '/api/household-finance/repayments' : '/api/household-finance/entries';
      const method = editing ? 'PATCH' : 'POST';
      const body = isRepayment ? { entry_date: values.entry_date.format('YYYY-MM-DD'), liability_id: values.liability_id, principal: values.principal, interest: values.interest, currency, fx_rate: values.fx_rate, note: values.note || '' } : { entry_date: values.entry_date.format('YYYY-MM-DD'), kind: values.kind, amount_cny: values.amount, original_amount: currency === 'CNY' ? null : values.amount, fx_rate: currency === 'CNY' ? null : values.fx_rate, liability_id: values.liability_id || null, note: values.note || '', currency };
      const response = await fetch(url, { method, headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error); message.success(editing ? '已更新' : '已记录'); reset(); onRefresh();
    } catch (error) { if (error instanceof Error) message.error(error.message); } finally { setSaving(false); }
  }
  async function remove(entry: HouseholdLedgerEntry) {
    if (!entry.id) return; const response = await fetch(`/api/household-finance/entries/${entry.id}`, { method:'DELETE' }); const result = await response.json();
    if (!response.ok) { message.error(result.error || '删除失败'); return; } message.success('已删除'); onRefresh();
  }
  const formBody = <Card><Form form={form} layout="inline" initialValues={{ entry_date: dayjs(), kind: defaultKind[active], currency: 'CNY' }}>
    <Form.Item name="entry_date" label="日期" rules={[{required:true}]}><DatePicker /></Form.Item>
    {active === 'business' && <Form.Item name="kind" label="收支" rules={[{required:true}]}><Radio.Group options={[{label:'收入',value:'business_income'},{label:'支出',value:'business_expense'}]} /></Form.Item>}
    {active === 'household' && <Form.Item name="kind" label="收支" rules={[{required:true}]}><Radio.Group options={[{label:'收入',value:'household_income'},{label:'支出',value:'household_expense'}]} /></Form.Item>}
    {active === 'capital' && <Form.Item name="kind" label="事项" rules={[{required:true}]}><Select style={{width:180}} options={capitalEntryOptions}/></Form.Item>}
    {kind && liabilityKinds.includes(kind) && <Form.Item name="liability_id" label="对应负债" rules={[{required:true,message:'请选择对应负债'}]}><Select style={{width:220}} placeholder="选择房贷、信用贷或信用卡" options={liabilityOptions}/></Form.Item>}
    <Form.Item name="currency" label="币种"><Select style={{width:90}} options={[{value:'CNY',label:'CNY'},{value:'USD',label:'USD'}]}/></Form.Item>
    {kind === 'loan_repayment' ? <><Form.Item name="principal" label="本金"><InputNumber min={0} precision={2} prefix={currency === 'CNY' ? '¥' : '$'} /></Form.Item><Form.Item name="interest" label="利息"><InputNumber min={0} precision={2} prefix={currency === 'CNY' ? '¥' : '$'} /></Form.Item></> : <Form.Item name="amount" label={currency === 'CNY' ? '金额' : '原币金额'} rules={[{required:true}]}><InputNumber min={0.01} precision={2} prefix={currency === 'CNY' ? '¥' : '$'} /></Form.Item>}
    {currency !== 'CNY' && <Form.Item name="fx_rate" label="USD/CNY 汇率" rules={[{required:true}]}><InputNumber min={0.0001} precision={4}/></Form.Item>}
    <Form.Item name="note" label="备注"><Input placeholder={active === 'business' ? '如：本月教培实收' : active === 'household' ? '如：本月家庭小额汇总' : '说明对应事项'} /></Form.Item>
    <Space><Button type="primary" loading={saving} onClick={() => void save()}>{editing ? '保存修改' : '保存'}</Button>{editing && <Button onClick={() => reset()}>取消编辑</Button>}</Space>
  </Form></Card>;
  return <Space orientation="vertical" size="middle" style={{width:'100%'}}>
    <Tabs activeKey={active} onChange={changeScope} items={[{key:'business',label:'经营收支',children:formBody},{key:'household',label:'家庭收支',children:formBody},{key:'capital',label:'其他大额事项',children:formBody}]} />
    <Table rowKey={row => row.id || `${row.entry_date}-${row.note}`} loading={loading} dataSource={visibleEntries} pagination={{pageSize:10}} columns={[{title:'日期',dataIndex:'entry_date'},{title:'类型',dataIndex:'kind',render:(value:HouseholdEntryKind)=>kindLabels[value]||value},{title:'金额',dataIndex:'amount_cny',render:(value:number)=>`¥${Number(value).toFixed(2)}`},{title:'备注',dataIndex:'note'},{title:'操作',render:(_,entry)=><Space><Button type="link" onClick={()=>edit(entry)}>编辑</Button><Popconfirm title="确认删除？" onConfirm={()=>void remove(entry)}><Button danger type="link">删除</Button></Popconfirm></Space>}]} />
  </Space>;
}
