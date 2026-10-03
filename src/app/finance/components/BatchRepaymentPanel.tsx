'use client';
import { App, Button, Card, Col, DatePicker, Drawer, Empty, Form, Input, InputNumber, Radio, Row, Select, Space, Typography } from 'antd';
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { buildPriorMonthRepaymentDrafts } from '@/lib/household-finance/prior-month-repayments';
import type { HouseholdFinanceItem, HouseholdLedgerEntry } from '@/types/household-finance';

type RepaymentRow = { entry_date: dayjs.Dayjs; repayment_type: 'mortgage_repayment'|'credit_loan_repayment'|'credit_card_payment'; liability_id?: string; principal?: number; interest?: number; amount?: number; currency?: string; fx_rate?: number; note?: string; previous_amount?: number };
const types = [{label:'房贷还款',value:'mortgage_repayment'},{label:'信用贷还款',value:'credit_loan_repayment'},{label:'信用卡还款',value:'credit_card_payment'}];

export function firstRepaymentDate(rows:Partial<RepaymentRow>[]|undefined, fallback:dayjs.Dayjs) {
  return rows?.[0]?.entry_date || fallback;
}

export default function BatchRepaymentPanel({selectedPeriod,liabilities,entries=[],onRefresh}:{selectedPeriod:string;liabilities:HouseholdFinanceItem[];entries?:HouseholdLedgerEntry[];onRefresh:()=>void}) {
  const { message } = App.useApp(); const [form] = Form.useForm(); const [referenceOpen,setReferenceOpen]=useState(false);
  const defaultDate = dayjs().format('YYYY-MM') === selectedPeriod ? dayjs() : dayjs(`${selectedPeriod}-01`).endOf('month');
  const newRow = (entryDate:dayjs.Dayjs=defaultDate): RepaymentRow => ({entry_date:entryDate,repayment_type:'mortgage_repayment',currency:'CNY'});
  const firstRowDate = () => firstRepaymentDate(form.getFieldValue('rows'), defaultDate);
  const options = liabilities.map(item=>({value:item.id,label:`${item.name}（${item.category}）`}));
  const liabilityNames = new Map(liabilities.map(item=>[item.id,`${item.name}（${item.category}）`]));
  const priorDrafts = useMemo(()=>buildPriorMonthRepaymentDrafts(entries,liabilities,selectedPeriod),[entries,liabilities,selectedPeriod]);
  const money = (value?:number,currency='CNY') => value == null ? '—' : `${currency==='USD'?'$':'¥'}${value.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  function copyPriorMonth() {
    form.setFieldsValue({rows:priorDrafts.map(draft=>({...draft,entry_date:dayjs(draft.entry_date)}))});
    setReferenceOpen(false); message.success(`已生成 ${priorDrafts.length} 条本月草稿，请核对后保存`);
  }
  async function save(index?:number) {
    await form.validateFields(); const all=form.getFieldValue('rows') as RepaymentRow[]; const selected=index===undefined?all:[all[index]];
    const rows=selected.map(row=>({entry_date:row.entry_date.format('YYYY-MM-DD'),repayment_type:row.repayment_type,liability_id:row.liability_id,principal:row.principal,interest:row.interest,amount:row.amount,currency:row.currency,fx_rate:row.fx_rate,note:row.note}));
    const response=await fetch('/api/household-finance/repayments/batch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows})});const result=await response.json();
    if(!response.ok){message.error(result.error||'保存失败');return} message.success(index===undefined?`已保存 ${rows.length} 笔还款`:'本行已保存');
    if(index===undefined||all.length===1)form.setFieldsValue({rows:[newRow()]});else form.setFieldsValue({rows:all.filter((_,i)=>i!==index)});onRefresh();
  }
  return <Card><Form form={form} layout="vertical" initialValues={{rows:[newRow()]}}><Form.List name="rows">{(fields,{add,remove})=><Space orientation="vertical" size="middle" style={{width:'100%'}}>
    <Space style={{width:'100%',justifyContent:'flex-end'}}><Button onClick={()=>setReferenceOpen(true)}>参考上月还款</Button><Button onClick={()=>add(newRow(firstRowDate()))}>新增还款行</Button>{fields.length>1&&<Button type="primary" onClick={()=>void save()}>一并保存</Button>}</Space>
    {fields.map((field,index)=><Card key={field.key} size="small" title={`第 ${index+1} 行`} extra={<Space><Button type="primary" ghost onClick={()=>void save(index)}>保存本行</Button>{fields.length>1&&<Button danger type="link" onClick={()=>remove(field.name)}>删除本行</Button>}</Space>}><Row gutter={[12,12]} align="bottom" className="repayment-entry-grid">
      <Col xs={24} sm={12} lg={6} xl={3} className="repayment-field"><Form.Item name={[field.name,'entry_date']} label="还款日期" rules={[{required:true}]} style={{marginBottom:0}}><DatePicker style={{width:'100%'}}/></Form.Item></Col>
      <Col xs={24} lg={12} xl={5} className="repayment-field"><Form.Item name={[field.name,'repayment_type']} label="还款类型" rules={[{required:true}]} style={{marginBottom:0}}><Radio.Group options={types}/></Form.Item></Col>
      <Col xs={24} sm={12} lg={6} xl={4} className="repayment-field"><Form.Item name={[field.name,'liability_id']} label="对应负债" rules={[{required:true,message:'请选择对应负债'}]} style={{marginBottom:0}}><Select options={options} placeholder="选择对应账户"/></Form.Item></Col>
      <Form.Item noStyle shouldUpdate={(p,c)=>p.rows?.[field.name]?.repayment_type!==c.rows?.[field.name]?.repayment_type}>{({getFieldValue})=>getFieldValue(['rows',field.name,'repayment_type'])==='credit_card_payment'?<Col xs={12} sm={8} xl={4} className="repayment-field"><Form.Item name={[field.name,'amount']} label="还款金额" rules={[{required:true}]} extra={getFieldValue(['rows',field.name,'previous_amount'])!=null?`上月：${money(getFieldValue(['rows',field.name,'previous_amount']),getFieldValue(['rows',field.name,'currency']))}，仅供参考`:undefined} style={{marginBottom:0}}><InputNumber min={0.01} precision={2} style={{width:'100%'}}/></Form.Item></Col>:<><Col xs={12} sm={6} xl={2} className="repayment-field"><Form.Item name={[field.name,'principal']} label="本金" style={{marginBottom:0}}><InputNumber min={0} precision={2} style={{width:'100%'}}/></Form.Item></Col><Col xs={12} sm={6} xl={2} className="repayment-field"><Form.Item name={[field.name,'interest']} label="利息" style={{marginBottom:0}}><InputNumber min={0} precision={2} style={{width:'100%'}}/></Form.Item></Col></>}</Form.Item>
      <Col xs={12} sm={6} xl={2} className="repayment-field"><Form.Item name={[field.name,'currency']} label="币种" style={{marginBottom:0}}><Select options={[{value:'CNY',label:'CNY'},{value:'USD',label:'USD'}]}/></Form.Item></Col>
      <Col xs={12} sm={6} xl={3} className="repayment-field"><Form.Item name={[field.name,'fx_rate']} label="USD/CNY 汇率" style={{marginBottom:0}}><InputNumber min={0.0001} precision={4} placeholder="仅 USD 必填" style={{width:'100%'}}/></Form.Item></Col>
      <Col xs={24} sm={12} xl={3} className="repayment-field"><Form.Item name={[field.name,'note']} label="备注" style={{marginBottom:0}}><Input/></Form.Item></Col>
    </Row></Card>)}
  </Space>}</Form.List></Form><Drawer title={`${dayjs(`${selectedPeriod}-01`).subtract(1,'month').format('M月')}还款参考`} placement="right" width={520} open={referenceOpen} onClose={()=>setReferenceOpen(false)} extra={priorDrafts.length>0?<Button type="primary" onClick={copyPriorMonth}>复制为本月草稿</Button>:null}>
    {priorDrafts.length===0?<Empty description="上月没有可复制的还款记录"/>:<Space orientation="vertical" size="middle" style={{width:'100%'}}>{priorDrafts.map((draft,index)=><Card key={`${draft.liability_id}-${draft.entry_date}-${index}`} size="small" title={liabilityNames.get(draft.liability_id||'')||'未命名负债'} extra={types.find(type=>type.value===draft.repayment_type)?.label}>
      <Space orientation="vertical" size={4}><Typography.Text>上月还款日：{draft.previous_entry_date}；本月草稿日：{draft.entry_date}</Typography.Text>{draft.repayment_type==='credit_card_payment'?<Typography.Text>上月金额：{money(draft.previous_amount,draft.currency)}；本月金额复制后留空</Typography.Text>:<Typography.Text>本金：{money(draft.principal,draft.currency)}；利息：{money(draft.interest,draft.currency)}</Typography.Text>}{draft.note&&<Typography.Text type="secondary">备注：{draft.note}</Typography.Text>}</Space>
    </Card>)}</Space>}
  </Drawer></Card>;
}
