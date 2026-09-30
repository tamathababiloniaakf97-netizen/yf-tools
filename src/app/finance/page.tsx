'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, App, Button, Card, DatePicker, Empty, Form, Segmented, Select, Space, Spin, Tabs, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import AuthGuard from '@/components/AuthGuard';
import FinanceOverview from './components/FinanceOverview';
import MonthlyEntryPanel from './components/MonthlyEntryPanel';
import BalanceSheetPanel from './components/BalanceSheetPanel';
import StatementsPanel from './components/StatementsPanel';
import MonthCloseModal from './components/MonthCloseModal';
import { calculateAccountSummary } from '@/lib/cost-engine';
import type { HouseholdClosure, HouseholdFinanceItem, HouseholdLedgerEntry, HouseholdStatements } from '@/types/household-finance';
import type { PortfolioOpening, PortfolioOpeningPosition, Ticker, Transaction } from '@/types';

type Mode='month'|'quarter'|'year';
interface Snapshot { snapshot_date:string; value_cny:number; account_id?:string;asset_id?:string;liability_id?:string }
interface FinanceData { enabled:boolean;bounds:{start:string;end:string};entries:HouseholdLedgerEntry[];accounts:Array<Record<string,unknown>>;assets:Array<Record<string,unknown>>;liabilities:Array<Record<string,unknown>>;accountSnapshots:Snapshot[];assetSnapshots:Snapshot[];liabilitySnapshots:Snapshot[];investment:Record<string,number>|null;closures:HouseholdClosure[];statements:HouseholdStatements }
const emptyStatements:HouseholdStatements={balanceSheet:{assets:0,liabilities:0,netWorth:0},income:{businessIncome:0,businessExpense:0,businessSurplus:0,householdExpense:0,investmentIncome:0,periodSurplus:0},cashFlow:{operating:0,investing:0,financing:0,netChange:0},netWorthBridge:{unrealizedInvestmentChange:0}};

export default function FinancePage(){
 const{message}=App.useApp();const[mode,setMode]=useState<Mode>('quarter');const now=new Date();const[year,setYear]=useState(now.getFullYear());const[index,setIndex]=useState(Math.floor(now.getMonth()/3)+1);const[data,setData]=useState<FinanceData|null>(null);const[loading,setLoading]=useState(true);const[closeOpen,setCloseOpen]=useState(false);const[investmentUsd,setInvestmentUsd]=useState(0);const[securitiesUsd,setSecuritiesUsd]=useState(0);const[investmentCashUsd,setInvestmentCashUsd]=useState(0);const[enableForm]=Form.useForm();
 const load=useCallback(async()=>{setLoading(true);try{const r=await fetch(`/api/household-finance?mode=${mode}&year=${year}&index=${index}`);const d=await r.json();if(!r.ok)throw new Error(d.error);setData(d);const p=await fetch('/api/positions');if(p.ok){const pd=await p.json() as {tickers:Ticker[];transactions:Transaction[];opening:PortfolioOpening|null;openingPositions:PortfolioOpeningPosition[]};const prices=Object.fromEntries((pd.tickers||[]).map(t=>[t.id,t.current_price||0]));const s=calculateAccountSummary(pd.transactions||[],pd.tickers||[],prices,pd.opening?{opening:pd.opening,positions:pd.openingPositions||[]}:null);setInvestmentUsd(s.totalAssets);setSecuritiesUsd(s.marketValue);setInvestmentCashUsd(s.cashBalance);}}catch(e){message.error(e instanceof Error?e.message:'家庭财务加载失败');}finally{setLoading(false)}},[index,message,mode,year]);
 useEffect(()=>{const timer=window.setTimeout(()=>{void load()},0);return()=>window.clearTimeout(timer)},[load]);
 function latest(rows:Snapshot[],key:'account_id'|'asset_id'|'liability_id'){const map=new Map<string,Snapshot>();[...rows].sort((a,b)=>a.snapshot_date.localeCompare(b.snapshot_date)).forEach(r=>{const id=r[key];if(id)map.set(id,r)});return map}
 const items=useMemo<HouseholdFinanceItem[]>(()=>{if(!data)return[];const maps={account:latest(data.accountSnapshots,'account_id'),asset:latest(data.assetSnapshots,'asset_id'),liability:latest(data.liabilitySnapshots,'liability_id')};return ([['account',data.accounts],['asset',data.assets],['liability',data.liabilities]] as const).flatMap(([type,rows])=>rows.map(row=>{const snapshot=maps[type].get(String(row.id));return{id:String(row.id),item_type:type,category:String(row.category),name:String(row.name),owner:row.owner as HouseholdFinanceItem['owner'],note:String(row.note||''),current_value_cny:Number(snapshot?.value_cny||0),valuation_date:snapshot?.snapshot_date||''}}))},[data]);
 async function enable(){const v=await enableForm.validateFields();const r=await fetch('/api/household-finance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled_date:v.enabled_date.format('YYYY-MM-DD')})});const d=await r.json();if(!r.ok){message.error(d.error);return}void load()}
 const periodOptions=mode==='month'?Array.from({length:12},(_,i)=>({value:i+1,label:`${i+1}月`})):mode==='quarter'?Array.from({length:4},(_,i)=>({value:i+1,label:`Q${i+1}`})):[{value:1,label:'全年'}];
 if(loading&&!data)return <AuthGuard><div style={{padding:80,textAlign:'center'}}><Spin/></div></AuthGuard>;
 if(data&&!data.enabled)return <AuthGuard><Card style={{maxWidth:600,margin:'60px auto'}}><Empty description="家庭财务将从启用日开始，不伪造之前的历史数据。"/><Form form={enableForm} layout="inline" style={{justifyContent:'center'}} initialValues={{enabled_date:dayjs()}}><Form.Item name="enabled_date" label="启用日" rules={[{required:true}]}><DatePicker/></Form.Item><Button type="primary" onClick={()=>void enable()}>启用家庭财务</Button></Form></Card></AuthGuard>;
 const statements=data?.statements||emptyStatements;const closure=data?.closures?.sort((a,b)=>String(b.period_month).localeCompare(String(a.period_month)))[0]||null;
 return <AuthGuard><Space orientation="vertical" size="middle" style={{width:'100%'}}>
  <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><Typography.Title level={3} style={{margin:0}}>家庭财务</Typography.Title><Typography.Text type="secondary">CNY 本位币 · 收付实现制 · 内部管理口径</Typography.Text></div><Button type="primary" icon={<CheckCircleOutlined/>} onClick={()=>setCloseOpen(true)}>月度结账</Button></div>
  <Card size="small"><Space wrap><Segmented value={mode} onChange={v=>{const m=v as Mode;setMode(m);setIndex(m==='month'?now.getMonth()+1:m==='quarter'?Math.floor(now.getMonth()/3)+1:1)}} options={[{value:'month',label:'月度'},{value:'quarter',label:'季度'},{value:'year',label:'年度'}]}/><Select value={year} onChange={setYear} options={[year-1,year,year+1].filter((v,i,a)=>a.indexOf(v)===i).map(v=>({value:v,label:`${v}年`}))}/><Select value={index} onChange={setIndex} options={periodOptions}/><Typography.Text type="secondary">{data?.bounds.start} 至 {data?.bounds.end}</Typography.Text></Space></Card>
  <Tabs items={[{key:'overview',label:'总览',children:<FinanceOverview statements={statements} closure={closure}/>},{key:'entry',label:'月度录入',children:<MonthlyEntryPanel entries={data?.entries||[]} loading={loading} onRefresh={()=>void load()}/>},{key:'balance',label:'资产负债',children:<BalanceSheetPanel items={items} onRefresh={()=>void load()}/>},{key:'reports',label:'财务报表',children:<StatementsPanel statements={statements}/>}]} />
  {!data?.investment&&<Alert type="info" showIcon message="尚未封存投资月末快照" description="完成首次月度结账后，投资资产才进入家庭资产负债表。"/>}
  <MonthCloseModal open={closeOpen} onClose={()=>setCloseOpen(false)} onSuccess={()=>void load()} theoreticalCash={statements.cashFlow.netChange} investmentUsd={investmentUsd} securitiesUsd={securitiesUsd} investmentCashUsd={investmentCashUsd}/>
 </Space></AuthGuard>;
}
