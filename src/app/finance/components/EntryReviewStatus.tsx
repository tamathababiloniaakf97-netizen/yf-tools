'use client';

import { Alert, Button, Card, Checkbox, Drawer, Progress, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { buildMonthlyChecklist, type ManualFinanceCheckKey } from '@/lib/household-finance/monthly-checklist';
import type { HouseholdEntryReview, HouseholdEntryReviewChecks } from '@/types/household-finance';

interface Props {
  periodMonth: string;
  review: HouseholdEntryReview | null;
  monthClosed: boolean;
  evidence?: Partial<Record<ManualFinanceCheckKey,string>>;
  onReviewed: () => void;
}

export default function EntryReviewStatus({ periodMonth, review, monthClosed, evidence={}, onReviewed }: Props) {
  const [saving,setSaving]=useState<ManualFinanceCheckKey|null>(null);
  const [error,setError]=useState('');
  const [open,setOpen]=useState(false);
  const checks=review?.checks||{};
  const checklist=buildMonthlyChecklist(checks,monthClosed);
  const completed=checklist.filter(item=>item.completed).length;
  const missing=checklist.filter(item=>!item.completed);
  const missingSummary=missing.length===0?'全部完成':`未完成：${missing.slice(0,3).map(item=>item.label).join('、')}${missing.length>3?`等 ${missing.length} 项`:''}`;

  async function updateCheck(key:ManualFinanceCheckKey,checked:boolean) {
    setSaving(key);setError('');
    const nextChecks:HouseholdEntryReviewChecks={...checks,[key]:checked};
    try {
      const response = await fetch('/api/household-finance/entry-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_month: periodMonth, checks:nextChecks }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '检查状态保存失败');
      onReviewed();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '检查状态保存失败');
    } finally {
      setSaving(null);
    }
  }

  return <>
    <Card size="small" styles={{body:{padding:'10px 12px'}}}>
      <div style={{display:'flex',alignItems:'center',gap:16,justifyContent:'space-between',flexWrap:'wrap'}}>
        <Space size="middle" wrap>
          <Typography.Text strong>月度财务检查</Typography.Text>
          <Tag color={completed===8?'green':'blue'}>已完成 {completed}/8</Tag>
          <Progress percent={completed/8*100} showInfo={false} size="small" style={{width:150,margin:0}} />
          <Typography.Text type="secondary">{missingSummary}</Typography.Text>
        </Space>
        <Button type="link" onClick={()=>setOpen(true)}>展开检查</Button>
      </div>
    </Card>
    <Drawer title="月度财务检查详情" open={open} onClose={()=>setOpen(false)} width={520}>
      <Space orientation="vertical" size="middle" style={{width:'100%'}}>
        <Space><Tag color={completed===8?'green':'blue'}>已完成 {completed}/8</Tag><Progress percent={completed/8*100} showInfo={false} size="small" style={{width:220,margin:0}} /></Space>
        <Typography.Text type="secondary">系统只提供已检测数据，不代表没有遗漏；前7项由你确认，月度结账由系统自动判定。</Typography.Text>
        <div>{checklist.map(item=><div key={item.key} style={{padding:'12px 0',borderBottom:'1px solid #f0f0f0'}}><Space orientation="vertical" size={2} style={{width:'100%'}}>
          <Checkbox checked={item.completed} disabled={!item.manual||saving!==null} onChange={event=>item.manual&&void updateCheck(item.key,event.target.checked)}><Typography.Text strong={item.completed}>{item.label}</Typography.Text></Checkbox>
          <Typography.Text type="secondary" style={{paddingLeft:24}}>{item.description}</Typography.Text>
          {item.manual&&evidence[item.key]&&<Typography.Text type="secondary" style={{paddingLeft:24,color:'#1677ff'}}>{evidence[item.key]}</Typography.Text>}
          {!item.manual&&<Typography.Text type="secondary" style={{paddingLeft:24}}>{monthClosed?'系统检测：该月已结账':'系统检测：该月尚未结账'}</Typography.Text>}
        </Space></div>)}</div>
        {error&&<Alert type="error" showIcon title={error}/>} 
      </Space>
    </Drawer>
  </>;
}
