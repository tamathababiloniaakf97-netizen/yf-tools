'use client';
import { Alert, Card, Col, Row, Statistic } from 'antd';
import type { HouseholdClosure, HouseholdStatements } from '@/types/household-finance';
import { flowClassName, formatFlowAmount, valueFlow } from '@/lib/household-finance/amount-presentation';
export default function FinanceOverview({ statements, closure, reportEnd }: { statements: HouseholdStatements; closure?: HouseholdClosure | null; reportEnd?: string }) {
  const b=statements.balanceSheet,i=statements.income;
  const debtRatio=b.assets>0?b.liabilities/b.assets*100:0;
  const signedStatistic=(value:number)=><span className={flowClassName(valueFlow(value))}>{formatFlowAmount(value,valueFlow(value))}</span>;
  return <><Row gutter={[12,12]} style={{marginBottom:16}}><Col xs={12} lg={8} xl={5}><Card><Statistic title={`家庭净资产${reportEnd?`（截至 ${reportEnd}）`:''}`} value={b.netWorth} formatter={()=>signedStatistic(b.netWorth)}/></Card></Col><Col xs={12} lg={8} xl={5}><Card><Statistic title="总资产" value={b.assets} prefix="¥" precision={2}/></Card></Col><Col xs={12} lg={8} xl={5}><Card><Statistic title="总负债" value={b.liabilities} prefix="¥" precision={2}/></Card></Col><Col xs={12} lg={8} xl={5}><Card><Statistic title="本期结余" value={i.periodSurplus} formatter={()=>signedStatistic(i.periodSurplus)}/></Card></Col><Col xs={12} lg={8} xl={4}><Card><Statistic title="负债率" value={debtRatio} suffix="%" precision={1}/></Card></Col></Row>
  {closure && Math.abs(closure.unexplained_difference_cny)>0.01 && <Alert type="warning" showIcon message={`上次结账存在无法解释现金差额 ¥${closure.unexplained_difference_cny.toFixed(2)}`} />}</>;
}
