'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { Alert, App, Button, Card, DatePicker, Empty, Form, Segmented, Select, Space, Spin, Tabs, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import AuthGuard from '@/components/AuthGuard';
import FinanceOverview from './components/FinanceOverview';
import MonthlyEntryPanel from './components/MonthlyEntryPanel';
import BalanceSheetPanel from './components/BalanceSheetPanel';
import StatementsPanel from './components/StatementsPanel';
import MonthCloseModal from './components/MonthCloseModal';
import FinanceGuideDrawer from './components/FinanceGuideDrawer';
import EntryReviewStatus from './components/EntryReviewStatus';
import { entriesWithinBounds } from '@/lib/household-finance/statements';
import type { HouseholdClosure, HouseholdEntryReview, HouseholdFinanceItem, HouseholdLedgerEntry, HouseholdStatements } from '@/types/household-finance';
import { financeDataKey, summarizePositions, type PositionsResponse } from './finance-data';
import { deriveLiabilityBalances } from '@/lib/household-finance/liability-balances';

type Mode='month'|'quarter'|'year';
interface Snapshot { snapshot_date:string; value_cny:number; account_id?:string;asset_id?:string;liability_id?:string }
interface FinanceData { enabled:boolean;bounds:{start:string;end:string};entries:HouseholdLedgerEntry[];accounts:Array<Record<string,unknown>>;assets:Array<Record<string,unknown>>;liabilities:Array<Record<string,unknown>>;accountSnapshots:Snapshot[];assetSnapshots:Snapshot[];liabilitySnapshots:Snapshot[];investment:Record<string,number>|null;closures:HouseholdClosure[];entryReviews:HouseholdEntryReview[];statements:HouseholdStatements }
const emptyStatements:HouseholdStatements={balanceSheet:{assets:0,liabilities:0,netWorth:0},income:{businessIncome:0,businessExpense:0,businessSurplus:0,householdIncome:0,householdExpense:0,investmentIncome:0,periodSurplus:0},cashFlow:{operating:0,investing:0,financing:0,netChange:0},netWorthBridge:{unrealizedInvestmentChange:0}};

export default function FinancePage(){
 const{message}=App.useApp();const[mode,setMode]=useState<Mode>('quarter');const now=new Date();const[year,setYear]=useState(now.getFullYear());const[index,setIndex]=useState(Math.floor(now.getMonth()/3)+1);const[activeTab,setActiveTab]=useState('overview');const[closeOpen,setCloseOpen]=useState(false);const[enableForm]=Form.useForm();
 const financeKey=financeDataKey(mode,year,index);
 const{data,error:financeError,isLoading:financeLoading,isValidating:financeValidating,mutate:refreshFinance}=useSWR<FinanceData>(financeKey);
 const{data:positions,error:positionsError,isLoading:positionsLoading,isValidating:positionsValidating,mutate:refreshPositions}=useSWR<PositionsResponse>('/api/positions');
 const load=useCallback(async()=>{await Promise.all([refreshFinance(),refreshPositions()])},[refreshFinance,refreshPositions]);
 useEffect(()=>{const error=financeError||positionsError;if(error)message.error(error instanceof Error?error.message:'家庭财务加载失败')},[financeError,message,positionsError]);
 useEffect(()=>{const timer=window.setTimeout(()=>{const params=new URLSearchParams(window.location.search);const period=params.get('period');if(params.get('tab')==='entry')setActiveTab('entry');if(period&&/^\d{4}-(0[1-9]|1[0-2])$/.test(period)){setMode('month');setYear(Number(period.slice(0,4)));setIndex(Number(period.slice(5,7)));}},0);return()=>window.clearTimeout(timer)},[]);
 function latest(rows:Snapshot[],key:'account_id'|'asset_id'|'liability_id'){const map=new Map<string,Snapshot>();[...rows].sort((a,b)=>a.snapshot_date.localeCompare(b.snapshot_date)).forEach(r=>{const id=r[key];if(id)map.set(id,r)});return map}
 const items=useMemo<HouseholdFinanceItem[]>(()=>{if(!data)return[];const maps={account:latest(data.accountSnapshots,'account_id'),asset:latest(data.assetSnapshots,'asset_id')};const today=new Date().toISOString().slice(0,10);const liabilityBalances=deriveLiabilityBalances(data.liabilitySnapshots,data.entries,today);return ([['account',data.accounts],['asset',data.assets],['liability',data.liabilities]] as const).flatMap(([type,rows])=>rows.map(row=>{const id=String(row.id);const snapshot=type==='liability'?undefined:maps[type].get(id);const liabilityBalance=type==='liability'?liabilityBalances.get(id):undefined;return{id,item_type:type,category:String(row.category),name:String(row.name),owner:row.owner as HouseholdFinanceItem['owner'],note:String(row.note||''),current_value_cny:Number(liabilityBalance?.value_cny??snapshot?.value_cny??0),valuation_date:liabilityBalance?.calculated_through_date||snapshot?.snapshot_date||'',calibration_date:liabilityBalance?.calibration_date,principal_paid_after_calibration:liabilityBalance?.principal_paid_after_calibration}}))},[data]);
 const investment=useMemo(()=>positions?summarizePositions(positions):{totalAssets:0,marketValue:0,cashBalance:0},[positions]);
 const investmentUsd=investment.totalAssets;const securitiesUsd=investment.marketValue;const investmentCashUsd=investment.cashBalance;
 const loading=financeValidating||positionsValidating;
 async function enable(){const v=await enableForm.validateFields();const r=await fetch('/api/household-finance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled_date:v.enabled_date.format('YYYY-MM-DD')})});const d=await r.json();if(!r.ok){message.error(d.error);return}void load()}
 const periodOptions=mode==='month'?Array.from({length:12},(_,i)=>({value:i+1,label:`${i+1}月`})):mode==='quarter'?Array.from({length:4},(_,i)=>({value:i+1,label:`Q${i+1}`})):[{value:1,label:'全年'}];
 if((financeLoading||positionsLoading)&&!data)return <AuthGuard><div style={{padding:80,textAlign:'center'}}><Spin/></div></AuthGuard>;
 if(data&&!data.enabled)return <AuthGuard><Card style={{maxWidth:600,margin:'60px auto'}}><Empty description="家庭财务将从启用日开始，不伪造之前的历史数据。"/><Form form={enableForm} layout="inline" style={{justifyContent:'center'}} initialValues={{enabled_date:dayjs()}}><Form.Item name="enabled_date" label="启用日" rules={[{required:true}]}><DatePicker/></Form.Item><Button type="primary" onClick={()=>void enable()}>启用家庭财务</Button></Form></Card></AuthGuard>;
 const statements=data?.statements||emptyStatements;const closure=data?.closures?.sort((a,b)=>String(b.period_month).localeCompare(String(a.period_month)))[0]||null;const selectedPeriod=`${year}-${String(index).padStart(2,'0')}-01`;const selectedKey=selectedPeriod.slice(0,7);const selectedReview=data?.entryReviews?.find(review=>review.period_month===selectedPeriod)||null;const selectedClosure=data?.closures?.find(item=>item.period_month===selectedPeriod&&item.status==='closed')||null;const selectedEntries=entriesWithinBounds(data?.entries||[],data?.bounds||{start:'',end:''});
 const countKinds=(kinds:string[])=>selectedEntries.filter(entry=>kinds.includes(entry.kind)).length;
 const financeEvidence={
  business:`系统检测到 ${countKinds(['business_income','business_expense','business_refund'])} 笔经营收支`,
  household:`系统检测到 ${countKinds(['household_income','household_expense'])} 笔家庭收支`,
  repayments:`系统检测到 ${countKinds(['loan_principal_payment','loan_interest','credit_card_payment'])} 笔还款相关流水`,
  capital:`系统检测到 ${countKinds(['asset_purchase','asset_sale','loan_drawdown','investment_transfer_in','investment_transfer_out'])} 笔其他大额事项`,
  cash_balances:`${items.filter(item=>item.item_type==='account'&&item.valuation_date.startsWith(selectedKey)).length}/${items.filter(item=>item.item_type==='account').length} 个现金账户的数据日期在该月`,
  liability_balances:`${items.filter(item=>item.item_type==='liability'&&item.valuation_date.startsWith(selectedKey)).length}/${items.filter(item=>item.item_type==='liability').length} 项负债的数据日期在该月`,
  investment_ready:`当前读取的投资账户净资产为 $${investmentUsd.toFixed(2)}；请人工确认月末汇率`,
 };
 return <AuthGuard><Space orientation="vertical" size="middle" style={{width:'100%'}}>
  <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><Typography.Title level={3} style={{margin:0}}>家庭财务</Typography.Title><Typography.Text type="secondary">CNY 本位币 · 收付实现制 · 内部管理口径</Typography.Text></div><Space><FinanceGuideDrawer/><Button type="primary" icon={<CheckCircleOutlined/>} onClick={()=>setCloseOpen(true)}>月度结账</Button></Space></div>
  <Card size="small"><Space wrap><Segmented value={mode} onChange={v=>{const m=v as Mode;setMode(m);setIndex(m==='month'?now.getMonth()+1:m==='quarter'?Math.floor(now.getMonth()/3)+1:1)}} options={[{value:'month',label:'月度'},{value:'quarter',label:'季度'},{value:'year',label:'年度'}]}/><Select value={year} onChange={setYear} options={[year-1,year,year+1].filter((v,i,a)=>a.indexOf(v)===i).map(v=>({value:v,label:`${v}年`}))}/><Select value={index} onChange={setIndex} options={periodOptions}/><Typography.Text type="secondary">{data?.bounds.start} 至 {data?.bounds.end}</Typography.Text></Space></Card>
  <Tabs activeKey={activeTab} onChange={key=>{setActiveTab(key);if(key==='entry'&&mode!=='month'){setMode('month');setIndex(now.getMonth()+1)}}} items={[{key:'overview',label:'总览',children:<FinanceOverview statements={statements} closure={closure} reportEnd={data?.bounds.end}/>},{key:'entry',label:'月度录入',children:<Space orientation="vertical" size="middle" style={{width:'100%'}}><EntryReviewStatus periodMonth={selectedPeriod} review={selectedReview} monthClosed={!!selectedClosure} evidence={financeEvidence} onReviewed={()=>void load()}/><MonthlyEntryPanel key={selectedPeriod} selectedPeriod={selectedPeriod.slice(0,7)} entries={selectedEntries} allEntries={data?.entries||[]} liabilities={items.filter(item=>item.item_type==='liability')} loading={loading} onRefresh={()=>void load()}/></Space>},{key:'balance',label:'资产负债',children:<BalanceSheetPanel items={items} reportEnd={data?.bounds.end} onRefresh={()=>void load()}/>},{key:'reports',label:'财务报表',children:<StatementsPanel statements={statements} reportEnd={data?.bounds.end}/>}]} />
  {!data?.investment&&<Alert type="info" showIcon message="尚未封存投资月末快照" description="完成首次月度结账后，投资资产才进入家庭资产负债表。"/>}
  <MonthCloseModal open={closeOpen} periodMonth={selectedPeriod.slice(0,7)} onClose={()=>setCloseOpen(false)} onSuccess={()=>void load()} theoreticalCash={statements.cashFlow.netChange} investmentUsd={investmentUsd} securitiesUsd={securitiesUsd} investmentCashUsd={investmentCashUsd}/>
 </Space></AuthGuard>;
}
