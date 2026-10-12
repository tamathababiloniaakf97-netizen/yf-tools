'use client';
import { useMemo, useState } from 'react';
import { App, Button, Input, List, Modal, Segmented, Space, Switch, Tag, Typography } from 'antd';
import type { HouseholdItemCategory, HouseholdItemType } from '@/types/household-finance';

const labels:Record<HouseholdItemType,string>={account:'现金账户',asset:'资产',liability:'负债'};

export default function HouseholdCategoryManager({open,categories,onClose,onRefresh}:{open:boolean;categories:HouseholdItemCategory[];onClose:()=>void;onRefresh:()=>void}){
 const{message}=App.useApp();const[type,setType]=useState<HouseholdItemType>('account');const[newName,setNewName]=useState('');const[editingId,setEditingId]=useState<string|null>(null);const[editingName,setEditingName]=useState('');
 const rows=useMemo(()=>categories.filter(item=>item.item_type===type),[categories,type]);
 async function request(method:'POST'|'PATCH',body:unknown){const r=await fetch('/api/household-finance/categories',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||'操作失败');onRefresh();return d}
 async function add(){try{await request('POST',{item_type:type,name:newName});setNewName('');message.success('类别已新增')}catch(e){message.error(e instanceof Error?e.message:'新增失败')}}
 async function rename(){if(!editingId)return;try{await request('PATCH',{id:editingId,name:editingName});setEditingId(null);message.success('类别已改名')}catch(e){message.error(e instanceof Error?e.message:'改名失败')}}
 async function toggle(id:string,is_active:boolean){try{const r=await fetch('/api/household-finance/categories',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,is_active})});const d=await r.json();if(!r.ok)throw new Error(d.error||'操作失败');onRefresh()}catch(e){message.error(e instanceof Error?e.message:'操作失败')}}
 return <Modal title="管理类别标签" open={open} footer={null} onCancel={onClose} destroyOnHidden>
  <Segmented block value={type} onChange={value=>{setType(value as HouseholdItemType);setEditingId(null)}} options={Object.entries(labels).map(([value,label])=>({value,label}))}/>
  <Space.Compact style={{width:'100%',margin:'16px 0'}}><Input value={newName} onChange={event=>setNewName(event.target.value)} placeholder={`新增${labels[type]}类别`}/><Button type="primary" disabled={!newName.trim()} onClick={()=>void add()}>新增</Button></Space.Compact>
  <List dataSource={rows} locale={{emptyText:'暂无类别'}} renderItem={item=><List.Item actions={editingId===item.id?[<Button key="save" type="link" onClick={()=>void rename()}>保存</Button>,<Button key="cancel" type="link" onClick={()=>setEditingId(null)}>取消</Button>]:[<Button key="rename" type="link" onClick={()=>{setEditingId(item.id);setEditingName(item.name)}}>改名</Button>,<Switch key="active" checked={item.is_active} checkedChildren="启用" unCheckedChildren="停用" onChange={checked=>void toggle(item.id,checked)}/>]}>
   {editingId===item.id?<Input aria-label="类别新名称" value={editingName} onChange={event=>setEditingName(event.target.value)}/>:<Space><Typography.Text>{item.name}</Typography.Text>{item.system_key&&<Tag color="blue">汇总类别</Tag>}</Space>}
  </List.Item>}/>
  <Typography.Paragraph type="secondary" style={{marginTop:12,marginBottom:0}}>已使用的类别建议停用，不删除。标有“汇总类别”的标签即使改名，也不会影响房产、房贷等后续汇总。</Typography.Paragraph>
 </Modal>
}
