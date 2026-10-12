import { Card, Col, Row, Typography } from 'antd';
import { buildPropertySummary } from '@/lib/household-finance/property-summary';
import type { HouseholdFinanceItem, HouseholdItemCategory, HouseholdLedgerEntry } from '@/types/household-finance';

const money=(value:number)=>`¥${Number(value).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
function Metric({label,value}:{label:string;value:string}){return <Col xs={12} md={8} xl={4}><Typography.Text type="secondary">{label}</Typography.Text><div style={{fontSize:20,fontWeight:600,marginTop:4}}>{value}</div></Col>}

export default function PropertyPortfolioSummary({items,categories,entries}:{items:HouseholdFinanceItem[];categories:HouseholdItemCategory[];entries:HouseholdLedgerEntry[]}){
 const summary=buildPropertySummary(items,categories,entries);
 if(summary.propertyValue===0&&summary.mortgageBalance===0)return null;
 return <Card size="small" title="房产组合" style={{marginBottom:12}}><Row gutter={[24,16]}><Metric label="房产估值" value={money(summary.propertyValue)}/><Metric label="房贷余额" value={money(summary.mortgageBalance)}/><Metric label="房产净值" value={money(summary.netEquity)}/><Metric label="LTV" value={`${summary.ltvPercent.toFixed(2)}%`}/><Metric label="期间偿还本金" value={money(summary.principalPaid)}/><Metric label="期间贷款利息" value={money(summary.interestPaid)}/></Row></Card>;
}
