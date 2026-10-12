import { Card, Col, Row, Space, Typography } from 'antd';
import { flowClassName, formatFlowAmount, valueFlow } from '@/lib/household-finance/amount-presentation';
import { summarizeEntryScope, type EntryScope } from '@/lib/household-finance/entry-summaries';
import type { HouseholdLedgerEntry } from '@/types/household-finance';

function Metric({label,value,flow}:{label:string;value:number;flow?:'inflow'|'outflow'|'neutral'}){
 const resolved=flow||valueFlow(value);
 return <Col xs={12} md={6}><div><Typography.Text type="secondary">{label}</Typography.Text><div className={flowClassName(resolved)} style={{fontSize:20,fontWeight:600,marginTop:4}}>{formatFlowAmount(value,resolved)}</div></div></Col>;
}

export default function EntryScopeSummary({scope,entries}:{scope:EntryScope;entries:HouseholdLedgerEntry[]}){
 const summary=summarizeEntryScope(scope,entries);
 if(scope==='business'||scope==='household'){
  const values=summary as {count:number;income:number;expense:number;net:number};
  return <Card size="small"><Space orientation="vertical" size="middle" style={{width:'100%'}}><Typography.Text strong>{scope==='business'?'经营收支汇总':'家庭收支汇总'} <Typography.Text type="secondary">· 本页共 {values.count} 笔</Typography.Text></Typography.Text><Row gutter={[24,16]}><Metric label={scope==='business'?'净收入':'家庭收入'} value={values.income}/><Metric label={scope==='business'?'经营支出':'家庭支出'} value={values.expense} flow="outflow"/><Metric label={scope==='business'?'经营结余':'家庭结余'} value={values.net}/></Row></Space></Card>;
 }
 const values=summary as {count:number;assetNet:number;financingNet:number;investmentNet:number;interest:number;creditCardPayment:number;netCash:number};
 return <Card size="small"><Space orientation="vertical" size="middle" style={{width:'100%'}}><Typography.Text strong>大额事项汇总 <Typography.Text type="secondary">· 本页共 {values.count} 笔</Typography.Text></Typography.Text><Row gutter={[24,16]}><Metric label="资产交易净额" value={values.assetNet}/><Metric label="借贷净额" value={values.financingNet}/><Metric label="投资划转净额" value={values.investmentNet}/><Metric label="贷款利息" value={values.interest} flow="outflow"/><Metric label="信用卡还款" value={values.creditCardPayment} flow="outflow"/><Metric label="大额事项净现金" value={values.netCash}/></Row></Space></Card>;
}
