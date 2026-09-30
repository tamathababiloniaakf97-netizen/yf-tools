'use client';
import { useState } from 'react';
import { App, Button, Card, DatePicker, Form, Input, InputNumber, Popconfirm, Radio, Select, Space, Table, Tabs } from 'antd';
import dayjs from 'dayjs';
import type { HouseholdLedgerEntry } from '@/types/household-finance';

export default function MonthlyEntryPanel({ entries, loading, onRefresh }: { entries: HouseholdLedgerEntry[]; loading: boolean; onRefresh: () => void }) {
  const { message } = App.useApp(); const [saving, setSaving] = useState(false); const [form] = Form.useForm();
  const currency = Form.useWatch('currency', form) || 'CNY';
  async function save(scope: 'business' | 'household' | 'capital') {
    const values = await form.validateFields(); setSaving(true);
    try {
      const kind = scope === 'household' ? 'household_expense' : values.direction;
      const response = await fetch('/api/household-finance/entries', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ entry_date: values.entry_date.format('YYYY-MM-DD'), kind, amount_cny: values.amount, original_amount: currency === 'CNY' ? null : values.amount, fx_rate: currency === 'CNY' ? null : values.fx_rate, note: values.note || '', currency }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error); form.resetFields(); message.success('已记录'); onRefresh();
    } catch (error) { if (error instanceof Error) message.error(error.message); } finally { setSaving(false); }
  }
  const formBody = (scope: 'business' | 'household' | 'capital') => <Form form={form} layout="inline" initialValues={{ entry_date: dayjs(), direction: scope === 'capital' ? 'asset_purchase' : 'business_income', currency: 'CNY' }}>
    <Form.Item name="entry_date" label="日期" rules={[{required:true}]}><DatePicker /></Form.Item>
    {scope === 'business' && <Form.Item name="direction" label="收支" rules={[{required:true}]}><Radio.Group options={[{label:'收入',value:'business_income'},{label:'支出',value:'business_expense'}]} /></Form.Item>}
    {scope === 'capital' && <Form.Item name="direction" label="事项" rules={[{required:true}]}><Select style={{width:150}} options={[{label:'资产购置',value:'asset_purchase'},{label:'资产处置',value:'asset_sale'},{label:'新增借款',value:'loan_drawdown'},{label:'偿还本金',value:'loan_principal_payment'},{label:'贷款利息',value:'loan_interest'},{label:'内部转账',value:'internal_transfer'}]}/></Form.Item>}
    <Form.Item name="currency" label="币种"><Select style={{width:90}} options={[{value:'CNY',label:'CNY'},{value:'USD',label:'USD'}]}/></Form.Item>
    <Form.Item name="amount" label={currency === 'CNY' ? '金额' : '原币金额'} rules={[{required:true}]}><InputNumber min={0.01} precision={2} prefix={currency === 'CNY' ? '¥' : '$'} /></Form.Item>
    {currency !== 'CNY' && <Form.Item name="fx_rate" label="USD/CNY 汇率" rules={[{required:true}]}><InputNumber min={0.0001} precision={4}/></Form.Item>}
    <Form.Item name="note" label="备注"><Input placeholder={scope === 'business' ? '如：本月教培实收' : '如：本月家庭小额汇总'} /></Form.Item>
    <Button type="primary" loading={saving} onClick={() => void save(scope)}>保存</Button>
  </Form>;
  async function remove(id?: string) { if (!id) return; await fetch('/api/household-finance/entries', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) }); onRefresh(); }
  return <Space orientation="vertical" size="middle" style={{width:'100%'}}>
    <Tabs destroyOnHidden items={[{key:'business',label:'经营收支',children:<Card>{formBody('business')}</Card>},{key:'household',label:'家庭支出',children:<Card>{formBody('household')}</Card>},{key:'capital',label:'其他大额事项',children:<Card>{formBody('capital')}</Card>}]} />
    <Table rowKey={row => row.id || `${row.entry_date}-${row.note}`} loading={loading} dataSource={[...entries].sort((a,b)=>b.entry_date.localeCompare(a.entry_date))} pagination={{pageSize:10}} columns={[{title:'日期',dataIndex:'entry_date'},{title:'类型',dataIndex:'kind',render:(v:string)=>({business_income:'经营收入',business_expense:'经营支出',household_expense:'家庭支出'}[v]||v)},{title:'金额',dataIndex:'amount_cny',render:(v:number)=>`¥${Number(v).toFixed(2)}`},{title:'备注',dataIndex:'note'},{title:'操作',render:(_,r)=><Popconfirm title="确认删除？" onConfirm={()=>void remove(r.id)}><Button danger type="link">删除</Button></Popconfirm>}]} />
  </Space>;
}
