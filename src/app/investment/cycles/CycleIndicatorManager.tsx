'use client';
import { useState } from 'react';
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { CycleIndicator } from '@/types/life-os';

const directionOptions=[{value:'up',label:'上行'},{value:'flat',label:'平稳'},{value:'down',label:'下行'},{value:'unknown',label:'未知'}];
const zoneOptions=[{value:'normal',label:'常态区'},{value:'watch',label:'观察区'},{value:'extreme',label:'极端区'},{value:'unknown',label:'未判断'}];

export default function CycleIndicatorManager({indicators,onSave}:{indicators:CycleIndicator[];onSave:(next:CycleIndicator[])=>Promise<boolean>}){
  const[open,setOpen]=useState(false);const[saving,setSaving]=useState(false);const[form]=Form.useForm<{indicators:CycleIndicator[]}>();
  const show=()=>{form.setFieldsValue({indicators});setOpen(true);};
  const save=async({indicators:next=[]}:{indicators:CycleIndicator[]})=>{setSaving(true);try{if(await onSave(next))setOpen(false);}finally{setSaving(false);}};
  const remove=async(index:number)=>{const current=form.getFieldValue('indicators')??[];const next=current.filter((_:CycleIndicator,itemIndex:number)=>itemIndex!==index);setSaving(true);try{if(await onSave(next))form.setFieldValue('indicators',next);}finally{setSaving(false);}};
  return <><Button size="small" onClick={show}>管理指标</Button><Modal title="管理观察指标" open={open} onCancel={()=>setOpen(false)} onOk={()=>form.submit()} confirmLoading={saving} width={760} okText="保存指标"><Form form={form} layout="vertical" onFinish={save}><Form.List name="indicators">{(fields,{add})=><Space orientation="vertical" style={{width:'100%'}}>{fields.map(({key,name})=><Card size="small" key={key} title={<Form.Item name={[name,'name']} noStyle><Input aria-label={`指标名称 ${name+1}`} placeholder="指标名称"/></Form.Item>} extra={<Popconfirm title="删除这个指标？" description="历史复核中的旧指标不会删除。" okText="确认删除" cancelText="取消" onConfirm={()=>void remove(name)}><Button danger size="small" aria-label={`删除 ${form.getFieldValue(['indicators',name,'name'])||'指标'}`}>删除</Button></Popconfirm>}><Space wrap><Form.Item name={[name,'value']} label="值/状态"><Input/></Form.Item><Form.Item name={[name,'direction']} label="方向"><Select style={{width:110}} options={directionOptions}/></Form.Item><Form.Item name={[name,'zone']} label="区域"><Select style={{width:110}} options={zoneOptions}/></Form.Item><Form.Item name={[name,'source']} label="来源"><Input/></Form.Item></Space></Card>)}<Button block icon={<PlusOutlined/>} onClick={()=>add({id:crypto.randomUUID(),name:'',value_type:'text',value:null,direction:'unknown',zone:'unknown',source:'',observed_on:null,update_frequency_days:30,threshold_note:'',note:'',watch_direction_change:false,active:true})}>新增指标</Button></Space>}</Form.List></Form></Modal></>;
}
