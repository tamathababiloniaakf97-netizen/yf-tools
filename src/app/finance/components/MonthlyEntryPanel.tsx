'use client';
import { useMemo, useState } from 'react';
import { Alert, App, Button, Card, Checkbox, DatePicker, Drawer, Empty, Form, Input, InputNumber, Popconfirm, Radio, Segmented, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { entryGuidance } from '@/lib/household-finance/entry-guidance';
import { buildPriorMonthEntryDrafts } from '@/lib/household-finance/prior-month-entries';
import { entryFlow, flowClassName, formatFlowAmount } from '@/lib/household-finance/amount-presentation';
import BatchRepaymentPanel from './BatchRepaymentPanel';
import type { HouseholdEntryKind, HouseholdFinanceItem, HouseholdLedgerEntry } from '@/types/household-finance';

type Scope = 'business' | 'household' | 'capital';
type FormKind = HouseholdEntryKind | 'mortgage_repayment' | 'credit_loan_repayment';
type BatchEntryInput = { entry_date: dayjs.Dayjs; kind: HouseholdEntryKind; currency?: string; amount: number; fx_rate?: number; note?: string };
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
const liabilityKinds: FormKind[] = ['mortgage_repayment', 'credit_loan_repayment', 'loan_drawdown', 'loan_principal_payment', 'loan_interest', 'credit_card_payment'];
const kindTagColor = (kind: HouseholdEntryKind) => entryFlow(kind) === 'inflow' ? 'green' : entryFlow(kind) === 'outflow' ? 'red' : 'default';
export const capitalEntryOptions = [{label:'资产购置',value:'asset_purchase'},{label:'资产处置',value:'asset_sale'},{label:'新增借款',value:'loan_drawdown'},{label:'房贷还款',value:'mortgage_repayment'},{label:'信用贷还款',value:'credit_loan_repayment'},{label:'信用卡还款',value:'credit_card_payment'},{label:'投资转入',value:'investment_transfer_in'},{label:'投资转出',value:'investment_transfer_out'}];

function formatRecordedAt(value?: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value));
}

function defaultEntryDate(selectedPeriod: string) {
  const today = dayjs();
  return today.format('YYYY-MM') === selectedPeriod ? today : dayjs(`${selectedPeriod}-01`).endOf('month');
}

export function firstBatchEntryDate(rows:Partial<BatchEntryInput>[]|undefined,fallback:dayjs.Dayjs) {
  return rows?.[0]?.entry_date||fallback;
}

export default function MonthlyEntryPanel({ selectedPeriod = dayjs().format('YYYY-MM'), entries, allEntries = entries, liabilities, loading, onRefresh }: { selectedPeriod?: string; entries: HouseholdLedgerEntry[]; allEntries?: HouseholdLedgerEntry[]; liabilities: HouseholdFinanceItem[]; loading: boolean; onRefresh: () => void }) {
  const { message } = App.useApp(); const [saving, setSaving] = useState(false); const [active, setActive] = useState<Scope>('business'); const [capitalMode,setCapitalMode]=useState<'single'|'batch'>('single'); const [editing, setEditing] = useState<HouseholdLedgerEntry | null>(null); const [priorOpen,setPriorOpen]=useState(false); const [selectedPriorIds,setSelectedPriorIds]=useState<string[]>([]); const [form] = Form.useForm(); const [batchForm] = Form.useForm();
  const currency = Form.useWatch('currency', form) || 'CNY'; const kind = Form.useWatch('kind', form) as FormKind | undefined;
  const visibleEntries = useMemo(() => [...entries].filter(entry => kindsByScope[active].includes(entry.kind)).sort((a,b)=>b.entry_date.localeCompare(a.entry_date)), [active, entries]);
  const liabilityOptions = liabilities.filter(item => item.item_type === 'liability').map(item => ({ value: item.id, label: `${item.name}（${item.category}）` }));
  const displayedCapitalOptions = editing && ['loan_principal_payment','loan_interest'].includes(editing.kind) ? [...capitalEntryOptions, { label: kindLabels[editing.kind] || editing.kind, value: editing.kind }] : capitalEntryOptions;
  const priorDrafts = useMemo(()=>active==='capital'?[]:buildPriorMonthEntryDrafts(allEntries,active,selectedPeriod),[active,allEntries,selectedPeriod]);

  function batchRow(scope: Scope,entryDate=defaultEntryDate(selectedPeriod)) { return { entry_date:entryDate, kind: defaultKind[scope], currency: 'CNY' }; }
  function reset(scope = active) { setEditing(null); form.resetFields(); form.setFieldsValue(batchRow(scope)); }
  function resetBatch(scope = active) { batchForm.setFieldsValue({ entries: [batchRow(scope)] }); }
  function changeScope(key: string) { const scope = key as Scope; setActive(scope); reset(scope); resetBatch(scope); }
  function openPriorEntries() { setSelectedPriorIds([]); setPriorOpen(true); }
  function copyPriorEntries() {
    const chosen=priorDrafts.filter(draft=>selectedPriorIds.includes(draft.source_id)).map(draft=>({entry_date:dayjs(draft.entry_date),kind:draft.kind,amount:draft.amount,currency:draft.currency,fx_rate:draft.fx_rate,note:draft.note}));
    const current=(batchForm.getFieldValue('entries')||[]) as Partial<BatchEntryInput>[];
    const pristine=current.length===1&&!current[0]?.amount&&!current[0]?.note;
    batchForm.setFieldsValue({entries:pristine?chosen:[...current,...chosen]});
    setPriorOpen(false); message.success(`已复制 ${chosen.length} 条本月草稿，请核对后保存`);
  }
  function edit(entry: HouseholdLedgerEntry) {
    const scope = (Object.entries(kindsByScope).find(([, values]) => values.includes(entry.kind))?.[0] || 'capital') as Scope;
    if (scope === 'capital') setCapitalMode('single');
    setActive(scope); setEditing(entry);
    form.setFieldsValue({ entry_date: dayjs(entry.entry_date), kind: entry.kind, currency: entry.currency || 'CNY', amount: entry.currency === 'CNY' || !entry.original_amount ? entry.amount_cny : entry.original_amount, fx_rate: entry.fx_rate, liability_id: entry.liability_id, note: entry.note });
  }
  async function save() {
    const values = await form.validateFields(); setSaving(true);
    try {
      const isRepayment = values.kind === 'mortgage_repayment' || values.kind === 'credit_loan_repayment';
      const url = editing ? `/api/household-finance/entries/${editing.id}` : isRepayment ? '/api/household-finance/repayments' : '/api/household-finance/entries';
      const method = editing ? 'PATCH' : 'POST';
      const body = isRepayment ? { entry_date: values.entry_date.format('YYYY-MM-DD'), liability_id: values.liability_id, principal: values.principal, interest: values.interest, currency, fx_rate: values.fx_rate, note: values.note || '' } : { entry_date: values.entry_date.format('YYYY-MM-DD'), kind: values.kind, amount_cny: values.amount, original_amount: currency === 'CNY' ? null : values.amount, fx_rate: currency === 'CNY' ? null : values.fx_rate, liability_id: values.liability_id || null, note: values.note || '', currency };
      const response = await fetch(url, { method, headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error); message.success(editing ? '已更新' : '已记录'); reset(); onRefresh();
    } catch (error) { if (error instanceof Error) message.error(error.message); } finally { setSaving(false); }
  }
  async function saveBatch(rowIndex?: number) {
    if (rowIndex === undefined) await batchForm.validateFields();
    else await batchForm.validateFields([
      ['entries', rowIndex, 'entry_date'], ['entries', rowIndex, 'kind'], ['entries', rowIndex, 'currency'], ['entries', rowIndex, 'amount'], ['entries', rowIndex, 'fx_rate'], ['entries', rowIndex, 'note'],
    ]);
    const currentRows = batchForm.getFieldValue('entries') as BatchEntryInput[];
    const selectedRows = rowIndex === undefined ? currentRows : [currentRows[rowIndex]];
    setSaving(true);
    try {
      const rows = selectedRows.map((row) => ({
        entry_date: row.entry_date.format('YYYY-MM-DD'), kind: row.kind, amount_cny: row.amount,
        original_amount: row.currency === 'CNY' ? null : row.amount, fx_rate: row.currency === 'CNY' ? null : row.fx_rate,
        currency: row.currency || 'CNY', note: row.note || '',
      }));
      const response = await fetch('/api/household-finance/entries/batch', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ entries: rows }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      const months = [...new Set(rows.map((row: { entry_date: string }) => `${Number(row.entry_date.slice(5, 7))}月`))].join('、');
      const hiddenAfterSave = rows.some((row) => row.entry_date.slice(0, 7) !== selectedPeriod);
      const baseMessage = rowIndex === undefined ? `已保存 ${rows.length} 条，归入 ${months}` : `本行已保存，归入 ${months}`;
      message.success(hiddenAfterSave ? `${baseMessage}；当前查看 ${Number(selectedPeriod.slice(5, 7))} 月，请切换月份查看` : baseMessage);
      if (rowIndex === undefined || currentRows.length === 1) resetBatch();
      else batchForm.setFieldsValue({ entries: currentRows.filter((_, index) => index !== rowIndex) });
      onRefresh();
    } catch (error) { if (error instanceof Error) message.error(error.message); } finally { setSaving(false); }
  }
  async function remove(entry: HouseholdLedgerEntry) {
    if (!entry.id) return; const response = await fetch(`/api/household-finance/entries/${entry.id}`, { method:'DELETE' }); const result = await response.json();
    if (!response.ok) { message.error(result.error || '删除失败'); return; } message.success('已删除'); onRefresh();
  }
  const singleFormBody = <Card><Form form={form} layout="inline" initialValues={{ entry_date: defaultEntryDate(selectedPeriod), kind: defaultKind[active], currency: 'CNY' }}>
    <Form.Item name="entry_date" label="收付款日期" rules={[{required:true}]}><DatePicker /></Form.Item>
    {active === 'business' && <Form.Item name="kind" label="收支" rules={[{required:true}]}><Radio.Group options={[{label:'收入',value:'business_income'},{label:'支出',value:'business_expense'}]} /></Form.Item>}
    {active === 'household' && <Form.Item name="kind" label="收支" rules={[{required:true}]}><Radio.Group options={[{label:'收入',value:'household_income'},{label:'支出',value:'household_expense'}]} /></Form.Item>}
    {active === 'capital' && <Form.Item name="kind" label="事项" rules={[{required:true}]}><Select style={{width:180}} options={displayedCapitalOptions}/></Form.Item>}
    {kind && liabilityKinds.includes(kind) && <Form.Item name="liability_id" label="对应负债" rules={[{required:true,message:'请选择对应负债'}]}><Select style={{width:220}} placeholder="选择房贷、信用贷或信用卡" options={liabilityOptions}/></Form.Item>}
    <Form.Item name="currency" label="币种"><Select style={{width:90}} options={[{value:'CNY',label:'CNY'},{value:'USD',label:'USD'}]}/></Form.Item>
    {kind === 'mortgage_repayment' || kind === 'credit_loan_repayment' ? <><Form.Item name="principal" label="本金"><InputNumber min={0} precision={2} prefix={currency === 'CNY' ? '¥' : '$'} /></Form.Item><Form.Item name="interest" label="利息"><InputNumber min={0} precision={2} prefix={currency === 'CNY' ? '¥' : '$'} /></Form.Item></> : <Form.Item name="amount" label={currency === 'CNY' ? '金额' : '原币金额'} rules={[{required:true}]}><InputNumber min={0.01} precision={2} prefix={currency === 'CNY' ? '¥' : '$'} /></Form.Item>}
    {currency !== 'CNY' && <Form.Item name="fx_rate" label="USD/CNY 汇率" rules={[{required:true}]}><InputNumber min={0.0001} precision={4}/></Form.Item>}
    <Form.Item name="note" label="备注"><Input placeholder={active === 'business' ? '如：本月教培实收' : active === 'household' ? '如：本月家庭小额汇总' : '说明对应事项'} /></Form.Item>
    <Space><Button type="primary" loading={saving} onClick={() => void save()}>{editing ? '保存修改' : '保存'}</Button>{editing && <Button onClick={() => reset()}>取消编辑</Button>}</Space>
  </Form>{entryGuidance(kind) && <Alert type="info" showIcon title={entryGuidance(kind)} style={{marginTop:12}} />}</Card>;
  const batchFormBody = <Card>
    <Alert type="info" showIcon title="收付款日期是业务实际发生日期，可跨月份录入；保险、工资、房租、物业费请在备注中写明名称，方便下月识别。" description="录入时间由系统在保存时自动记录。" style={{marginBottom:16}} />
    <Form form={batchForm} layout="vertical" initialValues={{ entries: [batchRow(active)] }}>
      <Form.List name="entries">
        {(fields, { add, remove }) => <Space orientation="vertical" size="middle" style={{width:'100%'}}>
          <Space style={{width:'100%',justifyContent:'flex-end'}}><Button onClick={openPriorEntries}>参考上月收支</Button><Button onClick={() => add(batchRow(active,firstBatchEntryDate(batchForm.getFieldValue('entries'),defaultEntryDate(selectedPeriod))))}>新增一行</Button>{fields.length > 1 && <Button type="primary" loading={saving} onClick={() => void saveBatch()}>一并保存</Button>}</Space>
          {fields.map((field, index) => <Card key={field.key} size="small" title={`第 ${index + 1} 行`} extra={<Space><Button type="primary" ghost loading={saving} onClick={() => void saveBatch(index)}>保存本行</Button>{fields.length > 1 && <Button danger type="link" onClick={() => remove(field.name)}>删除本行</Button>}</Space>}>
            <Space wrap align="start">
              <Form.Item name={[field.name,'entry_date']} label="收付款日期" rules={[{required:true,message:'请选择收付款日期'}]}><DatePicker /></Form.Item>
              <Form.Item name={[field.name,'kind']} label="收支" rules={[{required:true}]}><Radio.Group options={active === 'business' ? [{label:'收入',value:'business_income'},{label:'支出',value:'business_expense'}] : [{label:'收入',value:'household_income'},{label:'支出',value:'household_expense'}]} /></Form.Item>
              <Form.Item name={[field.name,'currency']} label="币种"><Select style={{width:90}} options={[{value:'CNY',label:'CNY'},{value:'USD',label:'USD'}]} /></Form.Item>
              <Form.Item name={[field.name,'amount']} label="金额（所选币种）" rules={[{required:true,message:'请填写金额'}]}><InputNumber min={0.01} precision={2} /></Form.Item>
              <Form.Item name={[field.name,'fx_rate']} label="USD/CNY 汇率"><InputNumber min={0.0001} precision={4} placeholder="仅 USD 必填" /></Form.Item>
              <Form.Item name={[field.name,'note']} label="备注"><Input style={{width:220}} placeholder={active === 'business' ? '如：9月课程实收' : '如：9月家庭支出'} /></Form.Item>
            </Space>
          </Card>)}
        </Space>}
      </Form.List>
    </Form>
  </Card>;
  const priorDrawer = <Drawer title={`${dayjs(`${selectedPeriod}-01`).subtract(1,'month').format('M月')}收支参考`} width={540} open={priorOpen} onClose={()=>setPriorOpen(false)} extra={<Button type="primary" disabled={selectedPriorIds.length===0} onClick={copyPriorEntries}>复制所选为本月草稿</Button>}>
    <Alert type="info" showIcon title="备注含“保险、工资、房租、物业费”的记录会标为固定项并优先显示；其他记录仍可按备注自行选择。" description="系统不会自动勾选或保存，复制后仍可修改金额和日期。" style={{marginBottom:16}}/>
    {priorDrafts.length===0?<Empty description="上月没有该分类的收支记录"/>:<Space orientation="vertical" size="middle" style={{width:'100%'}}><Space><Button size="small" onClick={()=>setSelectedPriorIds(priorDrafts.map(draft=>draft.source_id))}>全选</Button><Button size="small" onClick={()=>setSelectedPriorIds([])}>清空</Button></Space>{priorDrafts.map(draft=>{const flow=entryFlow(draft.kind);return <Card key={draft.source_id} size="small"><Checkbox checked={selectedPriorIds.includes(draft.source_id)} onChange={event=>setSelectedPriorIds(current=>event.target.checked?[...current,draft.source_id]:current.filter(id=>id!==draft.source_id))}><Typography.Text strong>{kindLabels[draft.kind]||draft.kind} · {draft.note||'无备注'}</Typography.Text>{draft.is_fixed&&<Tag color="blue" style={{marginLeft:8}}>固定项</Tag>}</Checkbox><div style={{marginTop:8,paddingLeft:24}}><span className={flowClassName(flow)}>{formatFlowAmount(draft.amount,flow,draft.currency)}</span><Typography.Text type="secondary">　上月 {draft.previous_entry_date} → 本月 {draft.entry_date}</Typography.Text></div></Card>})}</Space>}
  </Drawer>;
  const capitalBody = <Space orientation="vertical" size="middle" style={{width:'100%'}}><Segmented value={capitalMode} onChange={value=>setCapitalMode(value as 'single'|'batch')} options={[{label:'单笔事项',value:'single'},{label:'批量还款',value:'batch'}]}/>{capitalMode==='batch'?<BatchRepaymentPanel selectedPeriod={selectedPeriod} liabilities={liabilities} entries={allEntries} onRefresh={onRefresh}/>:singleFormBody}</Space>;
  const formBody = active === 'capital' ? capitalBody : editing ? singleFormBody : batchFormBody;
  return <Space orientation="vertical" size="middle" style={{width:'100%'}}>
    <Tabs activeKey={active} onChange={changeScope} items={[{key:'business',label:'经营收支'},{key:'household',label:'家庭收支'},{key:'capital',label:'其他大额事项'}]} />
    {formBody}{priorDrawer}
    <Table rowKey={row => row.id || `${row.entry_date}-${row.note}`} loading={loading} dataSource={visibleEntries} pagination={{pageSize:10}} columns={[{title:'收付款日期',dataIndex:'entry_date'},{title:'录入时间',dataIndex:'created_at',render:(value?:string)=>formatRecordedAt(value)},{title:'类型',dataIndex:'kind',render:(value:HouseholdEntryKind)=><Tag color={kindTagColor(value)}>{kindLabels[value]||value}</Tag>},{title:'金额',dataIndex:'amount_cny',align:'right',render:(value:number,entry)=>{const flow=entryFlow(entry.kind);return <span className={flowClassName(flow)}>{formatFlowAmount(value,flow)}</span>}},{title:'备注',dataIndex:'note'},{title:'操作',render:(_,entry)=><Space><Button type="link" onClick={()=>edit(entry)}>编辑</Button><Popconfirm title="确认删除？" onConfirm={()=>void remove(entry)}><Button danger type="link">删除</Button></Popconfirm></Space>}]} />
  </Space>;
}
