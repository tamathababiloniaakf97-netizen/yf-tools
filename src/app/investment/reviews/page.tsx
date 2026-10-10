'use client';

import { Alert, App, Button, DatePicker, Empty, Form, Input, Modal, Popconfirm, Segmented, Select, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import AuthGuard from '@/components/AuthGuard';
import ResizableSplitPane from '@/components/ResizableSplitPane';
import { filterInvestmentJournals } from '@/lib/investment/journal';
import type { InvestmentJournal, InvestmentJournalInput, InvestmentJournalReference, InvestmentJournalType } from '@/types/life-os';

const typeLabels: Record<InvestmentJournalType, string> = { decision_review:'决策复盘', missed_opportunity:'错失机会', investment_note:'投资心得' };
const referenceLabels = { decision:'投资决策', research:'公司研究', hypothesis:'关键假设', material:'研究资料', journal:'投资日志' } as const;
type JournalFilter = InvestmentJournalType | 'all';

export default function InvestmentReviewsPage() {
  const { message } = App.useApp(); const [form] = Form.useForm();
  const { data:items=[], error, mutate } = useSWR<InvestmentJournal[]>('/api/investment/reviews');
  const { data:referenceOptions=[] } = useSWR<InvestmentJournalReference[]>('/api/investment/reference-options');
  const [selectedId,setSelectedId]=useState<string>(); const [query,setQuery]=useState(''); const [type,setType]=useState<JournalFilter>('all');
  const [open,setOpen]=useState(false); const [editing,setEditing]=useState<InvestmentJournal|null>(null); const [saving,setSaving]=useState(false);
  const filtered=useMemo(()=>filterInvestmentJournals(items,query,type),[items,query,type]);
  const requestedId=typeof window==='undefined'?undefined:new URLSearchParams(window.location.search).get('journal')||undefined;
  const selected=filtered.find(item=>item.id===(selectedId??requestedId))??filtered[0]??null;
  function startCreate(){setEditing(null);form.resetFields();form.setFieldsValue({journal_type:'investment_note',review_date:dayjs(),tags:[],reference_keys:[]});setOpen(true)}
  function startEdit(item:InvestmentJournal){setEditing(item);form.setFieldsValue({...item,review_date:dayjs(item.review_date),reference_keys:item.references.map(referenceKey)});setOpen(true)}
  async function save(){const values=await form.validateFields();const references=(values.reference_keys??[]).map((key:string)=>referenceOptions.find(option=>referenceKey(option)===key)).filter(Boolean) as InvestmentJournalReference[];const input:InvestmentJournalInput={title:values.title,journal_type:values.journal_type,review_date:values.review_date.format('YYYY-MM-DD'),content:values.content,asset_name:values.asset_name,tags:values.tags??[],references,decision_id:references.find(reference=>reference.type==='decision')?.id??null};setSaving(true);try{const response=await fetch(editing?`/api/investment/reviews/${editing.id}`:'/api/investment/reviews',{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});const data=await response.json();if(!response.ok)throw new Error(data.error||'保存失败');await mutate();setSelectedId(data.id);setOpen(false);form.resetFields();message.success(editing?'日志已更新':'日志已保存')}catch(saveError){message.error(saveError instanceof Error?saveError.message:'保存失败')}finally{setSaving(false)}}
  async function remove(item:InvestmentJournal){const response=await fetch(`/api/investment/reviews/${item.id}`,{method:'DELETE'});if(!response.ok)return message.error('删除失败');if(selectedId===item.id)setSelectedId(undefined);await mutate();message.success('日志已删除')}

  return <AuthGuard>
    <div className="page-heading investment-journal-heading"><div><Typography.Title level={2}>投资日志</Typography.Title><Typography.Text type="secondary">复盘真实决策，也记录错失机会和逐渐形成的投资认识。</Typography.Text></div><Button type="primary" icon={<PlusOutlined/>} onClick={startCreate}>写一条</Button></div>
    {error&&<Alert type="warning" showIcon message="投资日志尚未连接" description={`${error.message}。请执行迁移 027_investment_journal.sql。`} style={{marginBottom:16}}/>}
    <ResizableSplitPane className="investment-journal-shell" storageKey="life-os:investment-journal:left-width" defaultLeftWidth={400}>
      <aside className="investment-journal-list"><div className="investment-journal-tools"><Input allowClear prefix={<SearchOutlined/>} placeholder="搜索标题、正文、公司或标签" value={query} onChange={event=>setQuery(event.target.value)}/><Segmented block value={type} onChange={value=>setType(value as JournalFilter)} options={[{label:`全部 ${items.length}`,value:'all'},...Object.entries(typeLabels).map(([value,label])=>({value,label}))]}/></div>
        <div className="investment-journal-feed">{filtered.length===0?<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有符合条件的日志"/>:filtered.map(item=><button type="button" key={item.id} className={`investment-journal-row ${selected?.id===item.id?'is-selected':''}`} onClick={()=>setSelectedId(item.id)}><div className="investment-journal-row-meta"><Tag color={item.journal_type==='missed_opportunity'?'gold':item.journal_type==='investment_note'?'purple':'default'}>{typeLabels[item.journal_type]}</Tag><span>{item.review_date}</span></div><strong>{item.title}</strong><span className="investment-journal-excerpt">{item.content}</span><span className="investment-journal-row-footer">{[item.asset_name,...item.tags].filter(Boolean).join(' · ')||'未设置标的或标签'}{item.references.length?`　·　关联 ${item.references.length} 项`:''}</span></button>)}</div>
      </aside>
      <main className="investment-journal-reader">{!selected?<Empty description="选择一篇日志，或先写一条"/>:<article><header className="investment-journal-article-head"><Tag color={selected.journal_type==='missed_opportunity'?'gold':selected.journal_type==='investment_note'?'purple':'default'}>{typeLabels[selected.journal_type]}</Tag><Typography.Title level={2}>{selected.title}</Typography.Title><Space wrap split={<span>·</span>}><Typography.Text type="secondary">{selected.review_date}</Typography.Text>{selected.asset_name&&<Typography.Text type="secondary">{selected.asset_name}</Typography.Text>}{selected.tags.map(tag=><Tag key={tag}>{tag}</Tag>)}</Space><div className="investment-journal-actions"><Button icon={<EditOutlined/>} onClick={()=>startEdit(selected)}>编辑</Button><Popconfirm title="删除这篇日志？" onConfirm={()=>void remove(selected)}><Button danger icon={<DeleteOutlined/>}>删除</Button></Popconfirm></div></header><Typography.Paragraph className="investment-journal-body">{selected.content}</Typography.Paragraph>{selected.references.length>0&&<section className="investment-journal-references"><Typography.Text strong>关联内容</Typography.Text><Typography.Text type="secondary">　· 点击回到原记录</Typography.Text>{selected.references.map(reference=><Link className="investment-journal-reference" href={reference.href} key={`${reference.type}:${reference.id}`}><span><Tag color="cyan">{referenceLabels[reference.type]}</Tag>{reference.title}</span><RightOutlined/></Link>)}</section>}</article>}</main>
    </ResizableSplitPane>
    <Modal title={editing?'编辑投资日志':'写一条投资日志'} open={open} width={760} okText="保存" cancelText="取消" confirmLoading={saving} onCancel={()=>setOpen(false)} onOk={()=>void save()}><Form form={form} layout="vertical"><div className="plan-form-grid"><Form.Item name="journal_type" label="类型" rules={[{required:true}]}><Select options={Object.entries(typeLabels).map(([value,label])=>({value,label}))}/></Form.Item><Form.Item name="review_date" label="日期" rules={[{required:true}]}><DatePicker style={{width:'100%'}}/></Form.Item></div><Form.Item name="title" label="标题" rules={[{required:true,message:'请填写标题'}]}><Input placeholder="一句话写清这次思考的主题"/></Form.Item><div className="plan-form-grid"><Form.Item name="asset_name" label="公司或标的（可选）"><Input placeholder="如：腾讯控股"/></Form.Item><Form.Item name="tags" label="标签（可选）"><Select mode="tags" tokenSeparators={[',','，']} maxCount={8} placeholder="如：估值、仓位、执行"/></Form.Item></div><Form.Item name="content" label="正文" rules={[{required:true,message:'请填写正文'}]}><Input.TextArea autoSize={{minRows:10,maxRows:18}} placeholder="写下发生了什么、你怎么理解，以及以后准备怎么做。无需把每一项都填满。"/></Form.Item><Form.Item name="reference_keys" label="关联内容（可选）" extra="只保存跳转入口，不复制原文。最多选择 12 项。"><Select mode="multiple" maxCount={12} showSearch optionFilterProp="label" placeholder="关联投资决策、公司研究、关键假设、研究资料或其他日志" options={referenceOptions.filter(option=>option.id!==editing?.id).map(option=>({value:referenceKey(option),label:`${referenceLabels[option.type]}｜${option.title}`}))}/></Form.Item></Form></Modal>
  </AuthGuard>;
}

function referenceKey(reference:InvestmentJournalReference){return `${reference.type}:${reference.id}`}
