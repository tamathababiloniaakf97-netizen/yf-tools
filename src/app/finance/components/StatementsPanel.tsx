'use client';
import { Card, Col, Descriptions, Row, Statistic, Tabs } from 'antd';
import type { HouseholdStatements } from '@/types/household-finance';
const money = (value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export default function StatementsPanel({ statements }: { statements: HouseholdStatements }) {
  const b = statements.balanceSheet, i = statements.income, c = statements.cashFlow;
  return <Tabs items={[
    { key: 'balance', label: '家庭资产负债表', children: <Card><Descriptions column={1} bordered items={[{ key: 'a', label: '总资产', children: money(b.assets) }, { key: 'l', label: '总负债', children: money(b.liabilities) }, { key: 'n', label: '家庭净资产', children: <strong>{money(b.netWorth)}</strong> }]} /></Card> },
    { key: 'income', label: '家庭收支表', children: <Card><Descriptions column={1} bordered items={[{ key: 'bi', label: '经营实收', children: money(i.businessIncome) }, { key: 'be', label: '经营实付', children: money(i.businessExpense) }, { key: 'bs', label: '经营结余', children: money(i.businessSurplus) }, { key: 'he', label: '家庭支出', children: money(i.householdExpense) }, { key: 'ii', label: '投资现金收益', children: money(i.investmentIncome) }, { key: 'ps', label: '家庭本期结余', children: <strong>{money(i.periodSurplus)}</strong> }]} /></Card> },
    { key: 'cash', label: '家庭现金流量表', children: <Row gutter={[12,12]}><Col span={8}><Statistic title="经营与生活活动" value={c.operating} prefix="¥" precision={2} /></Col><Col span={8}><Statistic title="投资活动" value={c.investing} prefix="¥" precision={2} /></Col><Col span={8}><Statistic title="借贷活动" value={c.financing} prefix="¥" precision={2} /></Col><Col span={24}><Card><Statistic title="现金净变化" value={c.netChange} prefix="¥" precision={2} /></Card></Col></Row> },
  ]} />;
}
