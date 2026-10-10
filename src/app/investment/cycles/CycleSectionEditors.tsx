'use client';
import { useState } from 'react';
import { EditOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Modal, Select, Space, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { cyclePhaseOptions } from '@/lib/investment/cycles';
import type { MarketCycleProfile } from '@/types/life-os';
import type { Ticker } from '@/types';

type SavePatch=(patch:Record<string,unknown>)=>Promise<boolean>;

function EditIconButton({label,onClick}:{label:string;onClick:()=>void}){
  return <Tooltip title={label}><Button aria-label={label} className="cycle-edit-icon" icon={<EditOutlined/>} onClick={onClick} shape="circle" size="small" type="text"/></Tooltip>;
}

function useEditor<T extends object>(initial:()=>T,onSave:SavePatch){const[open,setOpen]=useState(false);const[saving,setSaving]=useState(false);const[form]=Form.useForm<T>();const show=()=>{form.setFieldsValue(initial() as Parameters<typeof form.setFieldsValue>[0]);setOpen(true);};const submit=async(values:T)=>{setSaving(true);try{if(await onSave(values as Record<string,unknown>))setOpen(false);}finally{setSaving(false);}};return{open,setOpen,saving,form,show,submit};}

export function PriceEditor({profile,tickers,onSave}:{profile:MarketCycleProfile;tickers:Ticker[];onSave:SavePatch}){
  const editor=useEditor(()=>({ticker_id:profile.ticker_id??null,cycle_started_on:profile.cycle_started_on??null,cycle_start_price:profile.cycle_start_price??null,latest_price:profile.latest_price??null,latest_price_on:profile.latest_price_on??null}),onSave);
  const[fetching,setFetching]=useState(false);
  const fetchPrice=async()=>{const tickerId=editor.form.getFieldValue('ticker_id');if(!tickerId)return;setFetching(true);try{const response=await fetch(`/api/prices/previous-close?ticker_id=${encodeURIComponent(tickerId)}`);const result=await response.json();if(!response.ok)throw new Error(result.error||'价格获取失败');editor.form.setFieldsValue({latest_price:Number(result.price),latest_price_on:String(result.observedOn||dayjs().format('YYYY-MM-DD'))});}finally{setFetching(false);}};
  return <><EditIconButton label="编辑价格" onClick={editor.show}/><Modal title="编辑周期价格" open={editor.open} onCancel={()=>editor.setOpen(false)} onOk={()=>editor.form.submit()} confirmLoading={editor.saving} okText="保存"><Form form={editor.form} layout="vertical" onFinish={editor.submit}><Form.Item name="ticker_id" label="价格标的"><Select allowClear showSearch optionFilterProp="label" options={tickers.map(item=>({value:item.id,label:`${item.name} · ${item.code}`}))}/></Form.Item><Space align="end"><Form.Item name="cycle_started_on" label="启动日期"><Input type="date"/></Form.Item><Form.Item name="cycle_start_price" label="启动价格"><InputNumber min={0.00000001}/></Form.Item></Space><Space align="end"><Form.Item name="latest_price" label="当前价格"><InputNumber min={0.00000001}/></Form.Item><Form.Item name="latest_price_on" label="价格日期"><Input type="date"/></Form.Item><Button loading={fetching} disabled={!Form.useWatch('ticker_id',editor.form)} onClick={()=>void fetchPrice()}>获取当前价格</Button></Space></Form></Modal></>;
}

export function JudgmentEditor({profile,onSave}:{profile:MarketCycleProfile;onSave:SavePatch}){const editor=useEditor(()=>({current_phase:profile.current_phase,confidence:profile.confidence,summary:profile.summary,next_review_at:profile.next_review_at}),onSave);return <><EditIconButton label="编辑判断" onClick={editor.show}/><Modal title="编辑当前判断" open={editor.open} onCancel={()=>editor.setOpen(false)} onOk={()=>editor.form.submit()} confirmLoading={editor.saving}><Form form={editor.form} layout="vertical" onFinish={editor.submit}><Form.Item name="current_phase" label="当前阶段"><Select options={cyclePhaseOptions.map(item=>({value:item.value,label:item.value}))}/></Form.Item><Form.Item name="confidence" label="判断确信度"><Select allowClear options={[{value:'low',label:'低'},{value:'medium',label:'中'},{value:'high',label:'高'}]}/></Form.Item><Form.Item name="summary" label="当前判断"><Input.TextArea rows={4}/></Form.Item><Form.Item name="next_review_at" label="下次复核"><Input type="date"/></Form.Item></Form></Modal></>}

export function EvidenceEditor({profile,onSave}:{profile:MarketCycleProfile;onSave:SavePatch}){const editor=useEditor(()=>({support_evidence:profile.support_evidence??'',counter_evidence:profile.counter_evidence??''}),onSave);return <><EditIconButton label="编辑证据" onClick={editor.show}/><Modal title="编辑证据" open={editor.open} onCancel={()=>editor.setOpen(false)} onOk={()=>editor.form.submit()} confirmLoading={editor.saving}><Form form={editor.form} layout="vertical" onFinish={editor.submit}><Form.Item name="support_evidence" label="支持证据"><Input.TextArea rows={4}/></Form.Item><Form.Item name="counter_evidence" label="反面证据"><Input.TextArea rows={4}/></Form.Item></Form></Modal></>}

export function ThoughtEditor({profile,onSave}:{profile:MarketCycleProfile;onSave:SavePatch}){const editor=useEditor(()=>({uncertainties:profile.uncertainties??''}),onSave);return <><EditIconButton label="编辑待思考" onClick={editor.show}/><Modal title="编辑待思考事项" open={editor.open} onCancel={()=>editor.setOpen(false)} onOk={()=>editor.form.submit()} confirmLoading={editor.saving}><Form form={editor.form} layout="vertical" onFinish={editor.submit}><Form.Item name="uncertainties" label="我的待思考"><Input.TextArea rows={5} placeholder="写下仍需核实的问题，也可以留空"/></Form.Item></Form></Modal></>}
