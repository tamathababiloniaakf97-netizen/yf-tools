'use client';
import { Button, Card, Collapse, Form, Input, Modal, Popconfirm, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';
import type { ExternalVariable, ExternalVariableInput, ExternalVariableOwnerType } from '@/types/life-os';

export default function ExternalVariablesEditor({ ownerType, ownerId }: { ownerType: ExternalVariableOwnerType; ownerId: string }) {
  const [items,setItems]=useState<ExternalVariable[]>([]); const [open,setOpen]=useState(false); const [editing,setEditing]=useState<ExternalVariable|null>(null); const [form]=Form.useForm<ExternalVariableInput>();
  const load=useCallback(async()=>{if(!ownerId)return;const r=await fetch(`/api/investment/external-variables?owner_type=${ownerType}&owner_id=${encodeURIComponent(ownerId)}`);if(r.ok)setItems(await r.json());},[ownerId,ownerType]);
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer);},[load]);
  const edit=(item?:ExternalVariable)=>{setEditing(item??null);form.setFieldsValue(item??{owner_type:ownerType,name:'',current_state:'',impact:'',watch_for:'',reversal_signal:''});setOpen(true);};
  const save=async()=>{const values=await form.validateFields();const body={...values,owner_type:ownerType,industry_profile_id:ownerType==='industry'?ownerId:null,research_profile_id:ownerType==='company'?ownerId:null};const r=await fetch(editing?`/api/investment/external-variables/${editing.id}`:'/api/investment/external-variables',{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(r.ok){setOpen(false);void load();}};
  const remove=async(id:string)=>{await fetch(`/api/investment/external-variables/${id}`,{method:'DELETE'});void load();};
  return <Card size="small" title="外部变量" extra={<Button size="small" icon={<PlusOutlined/>} onClick={()=>edit()}>添加</Button>}>
    {items.length===0?<Typography.Text type="secondary">只记录会明显影响判断的利率、汇率、政策或成本变量。</Typography.Text>:<Collapse ghost items={items.map(item=>({key:item.id,label:<Space><Typography.Text strong>{item.name}</Typography.Text><Typography.Text type="secondary">{item.current_state}</Typography.Text></Space>,children:<><Typography.Paragraph><b>影响：</b>{item.impact||'—'}</Typography.Paragraph><Typography.Paragraph><b>关注：</b>{item.watch_for||'—'}</Typography.Paragraph><Typography.Paragraph><b>反转信号：</b>{item.reversal_signal||'—'}</Typography.Paragraph><Space><Button size="small" onClick={()=>edit(item)}>编辑</Button><Popconfirm title="删除这条外部变量？" onConfirm={()=>void remove(item.id)}><Button size="small" danger>删除</Button></Popconfirm></Space></>}))}/>}
    <Modal title={editing?'编辑外部变量':'添加外部变量'} open={open} onCancel={()=>setOpen(false)} onOk={save}><Form form={form} layout="vertical"><Form.Item name="name" label="变量名称" rules={[{required:true}]}><Input placeholder="如：利率、汇率、油价"/></Form.Item><Form.Item name="current_state" label="当前状态"><Input.TextArea rows={2}/></Form.Item><Form.Item name="impact" label="对当前对象的影响"><Input.TextArea rows={2}/></Form.Item><Form.Item name="watch_for" label="需要观察"><Input.TextArea rows={2}/></Form.Item><Form.Item name="reversal_signal" label="反转信号"><Input.TextArea rows={2}/></Form.Item></Form></Modal>
  </Card>;
}
