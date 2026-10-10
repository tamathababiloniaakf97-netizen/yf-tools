'use client';
import { Card, Col, Descriptions, Row, Statistic, Tabs } from 'antd';
import type { HouseholdStatements } from '@/types/household-finance';
import { flowClassName, formatFlowAmount, type MoneyFlow, valueFlow } from '@/lib/household-finance/amount-presentation';
const money = (value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const flowMoney = (value: number, flow: MoneyFlow = valueFlow(value)) => <span className={flowClassName(flow)}>{formatFlowAmount(value, flow)}</span>;
export default function StatementsPanel({ statements, reportEnd }: { statements: HouseholdStatements; reportEnd?: string }) {
  const b = statements.balanceSheet, i = statements.income, c = statements.cashFlow;
  return <Tabs items={[
    { key: 'balance', label: '家庭资产负债表', children: <Card title={reportEnd?`截至 ${reportEnd}`:undefined}><Descriptions column={1} bordered items={[{ key: 'a', label: '总资产', children: money(b.assets) }, { key: 'l', label: '总负债', children: money(b.liabilities) }, { key: 'n', label: '家庭净资产', children: <strong>{flowMoney(b.netWorth)}</strong> }]} /></Card> },
    { key: 'income', label: '家庭收支表', children: <Card><Descriptions column={1} bordered items={[{ key: 'bi', label: '经营实收', children: flowMoney(i.businessIncome,'inflow') }, { key: 'be', label: '经营实付', children: flowMoney(i.businessExpense,'outflow') }, { key: 'bs', label: '经营结余', children: flowMoney(i.businessSurplus) }, { key: 'hi', label: '家庭收入', children: flowMoney(i.householdIncome,'inflow') }, { key: 'he', label: '家庭支出', children: flowMoney(i.householdExpense,'outflow') }, { key: 'ii', label: '投资现金收益', children: flowMoney(i.investmentIncome,'inflow') }, { key: 'ps', label: '家庭本期结余', children: <strong>{flowMoney(i.periodSurplus)}</strong> }]} /></Card> },
    { key: 'cash', label: '家庭现金流量表', children: <Row gutter={[12,12]}>{[['经营与生活活动',c.operating],['投资活动',c.investing],['借贷活动',c.financing]].map(([title,value])=><Col span={8} key={String(title)}><Statistic title={title} value={Number(value)} formatter={()=>flowMoney(Number(value))} /></Col>)}<Col span={24}><Card><Statistic title="现金净变化" value={c.netChange} formatter={()=>flowMoney(c.netChange)} /></Card></Col></Row> },
  ]} />;
}
