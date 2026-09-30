'use client';
import { Alert, Card, Col, Row, Statistic } from 'antd';
import type { HouseholdClosure, HouseholdStatements } from '@/types/household-finance';
export default function FinanceOverview({ statements, closure }: { statements: HouseholdStatements; closure?: HouseholdClosure | null }) {
  const b=statements.balanceSheet,i=statements.income;
  const debtRatio=b.assets>0?b.liabilities/b.assets*100:0;
  return <><Row gutter={[12,12]} style={{marginBottom:16}}><Col xs={12} lg={6}><Card><Statistic title="家庭净资产" value={b.netWorth} prefix="¥" precision={2}/></Card></Col><Col xs={12} lg={6}><Card><Statistic title="总资产" value={b.assets} prefix="¥" precision={2}/></Card></Col><Col xs={12} lg={6}><Card><Statistic title="总负债" value={b.liabilities} prefix="¥" precision={2}/></Card></Col><Col xs={12} lg={6}><Card><Statistic title="本期结余 / 负债率" value={i.periodSurplus} prefix="¥" suffix={`${debtRatio.toFixed(1)}%`} precision={2}/></Card></Col></Row>
  {closure && Math.abs(closure.unexplained_difference_cny)>0.01 && <Alert type="warning" showIcon message={`上次结账存在无法解释现金差额 ¥${closure.unexplained_difference_cny.toFixed(2)}`} />}</>;
}
