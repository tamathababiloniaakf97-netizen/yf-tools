'use client';

import React from 'react';
import { Typography } from 'antd';
import StrategyOverview from './StrategyOverview';
import EntryPlanTable from './EntryPlanTable';
import ExitPlanTable from './ExitPlanTable';
import OptionsPlanTable from './OptionsPlanTable';
import RiskControlChecklist from './RiskControlChecklist';
import CashSummary from './CashSummary';
import StressTestTable from './StressTestTable';
import OperationMemo from './OperationMemo';
import type { StrategyStatus } from '@/types';

const { Title } = Typography;

interface PlaybookData {
  overview: {
    title?: string;
    type?: string;
    target?: string;
    currentPrice?: string;
    allocPercent?: string;
    referenceHigh?: number;
  };
  entryPlan: Array<Record<string, unknown>>;
  exitPlan: Array<Record<string, unknown>>;
  optionsPlan: Array<Record<string, unknown>>;
  riskControl: {
    cashMin?: string;
    singleMax?: string;
    hedgeRatio?: string;
    positiveCarry?: boolean;
    totalMarketValue?: number;
  };
  stressTest: Array<Record<string, unknown>>;
  memo: Array<Record<string, unknown>>;
}

interface Props {
  data: PlaybookData;
  status: StrategyStatus;
  intent: string;
  onFieldChange: (section: string, value: unknown) => void;
  capabilityConfirmed: boolean;
  disciplineConfirmed: boolean;
  onCapabilityChange: (v: boolean) => void;
  onDisciplineChange: (v: boolean) => void;
  entryReferenceHigh: number;
  onEntryReferenceHighChange: (v: number) => void;
  exitReferenceLow: number;
  onExitReferenceLowChange: (v: number) => void;
  totalCash: number;
  onTotalCashChange: (v: number) => void;
  holdings: Array<{ quantity?: number; costPrice?: number }>;
}

export default function StrategyPlaybook({ data, status, intent, onFieldChange, capabilityConfirmed, disciplineConfirmed, onCapabilityChange, onDisciplineChange, entryReferenceHigh, onEntryReferenceHighChange, exitReferenceLow, onExitReferenceLowChange, totalCash, onTotalCashChange, holdings }: Props) {
  const overview = data.overview || {};
  const entryPlan = (data.entryPlan || []) as Array<Record<string, unknown>>;
  const exitPlan = (data.exitPlan || []) as Array<Record<string, unknown>>;
  const optionsPlan = (data.optionsPlan || []) as Array<Record<string, unknown>>;
  const riskControl = data.riskControl || {};
  const stressTest = (data.stressTest || []) as Array<Record<string, unknown>>;
  const memo = (data.memo || []) as Array<Record<string, unknown>>;

  const existingShares = holdings.reduce((sum, h) => sum + (h.quantity || 0), 0);
  const existingCost = holdings.reduce((sum, h) => sum + (h.costPrice || 0) * (h.quantity || 0), 0);
  const existingAvgCost = existingShares > 0 ? existingCost / existingShares : 0;

  // 单标的占比 =（已有持仓 + 计划买入 + Short Put 被行权风险）/ 总市值
  function parsePrice(val: string): number {
    if (!val) return 0;
    const clean = val.replace(/[$,]/g, '');
    const nums = clean.split('-').map(Number);
    if (nums.length >= 2 && !nums.slice(0, 2).some(isNaN)) return (nums[0] + nums[1]) / 2;
    return Number(clean) || 0;
  }

  const plannedBuyCost = entryPlan.reduce((sum, row) => {
    const price = parsePrice(String(row.priceRange || ''));
    return sum + price * (Number(row.shares) || 0);
  }, 0);

  const shortPutRisk = optionsPlan.reduce((sum, row) => {
    if (row.tool === 'Short Put' && ((row.applicableState as string) || '始终') !== '已持货') {
      const strike = Number(row.strike) || 0;
      return sum + strike * (Number(row.quantity) || 0) * 100;
    }
    return sum;
  }, 0);

  const totalPotentialPosition = existingCost + plannedBuyCost + shortPutRisk;
  const totalMarketValue = Number(riskControl.totalMarketValue) || 0;
  const singleAllocPercent = totalMarketValue > 0 ? Math.round((totalPotentialPosition / totalMarketValue) * 100) : undefined;

  // 50% 仓位底线：止盈卖出后剩余股数 ≥ 目标股数的 50%
  const entryPlanShares = entryPlan.reduce((sum, row) => sum + (Number(row.shares) || 0), 0);
  const targetShares = existingShares + entryPlanShares;
  const exitPlanShares = exitPlan.reduce((sum, row) => sum + (Number(row.shares) || 0), 0);
  const remainingAfterExit = targetShares - exitPlanShares;
  const positionFloorPct = targetShares > 0 ? Math.round((remainingAfterExit / targetShares) * 100) : 100;

  return (
    <div>
      <Title level={5} style={{ marginBottom: 12 }}>策略执行手册</Title>

      <StrategyOverview
        title={overview.title || ''}
        type={overview.type || ''}
        target={overview.target || ''}
        status={status}
        currentPrice={overview.currentPrice as string}
        allocPercent={overview.allocPercent as string}
        referenceHigh={overview.referenceHigh}
        onReferenceHighChange={(v) => onFieldChange('overview', { ...overview, referenceHigh: v })}
        currentPriceNum={entryReferenceHigh}
        onTitleChange={(v) => onFieldChange('overview', { ...overview, title: v })}
        onStatusChange={(v) => onFieldChange('status', v)}
      />

      <EntryPlanTable
        data={entryPlan as any[]}
        onChange={(v) => onFieldChange('entryPlan', v)}
        referenceHigh={entryReferenceHigh}
        onReferenceHighChange={onEntryReferenceHighChange}
        totalCash={totalCash}
        existingShares={existingShares}
        existingCost={existingCost}
      />

      <ExitPlanTable
        data={exitPlan as any[]}
        onChange={(v) => onFieldChange('exitPlan', v)}
        referenceLow={exitReferenceLow}
        onReferenceLowChange={onExitReferenceLowChange}
        totalShares={entryPlan.reduce((sum: number, r: any) => sum + (r.shares || 0), 0)}
        existingAvgCost={existingAvgCost}
      />

      <OptionsPlanTable
        data={optionsPlan as any[]}
        onChange={(v) => onFieldChange('optionsPlan', v)}
      />

      <RiskControlChecklist
        data={riskControl as any}
        intent={intent}
        singleAllocPercent={singleAllocPercent}
        hedgeCheck={riskControl.hedgeRatio === '2x'}
        positiveCarryCheck={riskControl.positiveCarry === true}
        capabilityConfirmed={capabilityConfirmed}
        disciplineConfirmed={disciplineConfirmed}
        onCapabilityChange={onCapabilityChange}
        onDisciplineChange={onDisciplineChange}
        onRiskControlChange={(update) => onFieldChange('riskControl', { ...riskControl, ...update })}
        positionFloorPct={positionFloorPct}
        targetShares={targetShares}
        remainingAfterExit={remainingAfterExit}
      />

      <CashSummary
        totalCash={totalCash}
        onTotalCashChange={onTotalCashChange}
        entryPlan={entryPlan as any[]}
        optionsPlan={optionsPlan as any[]}
      />

      <StressTestTable
        data={stressTest as any[]}
        entryPlan={entryPlan}
        optionsPlan={optionsPlan}
        onChange={(v) => onFieldChange('stressTest', v)}
      />

      <OperationMemo
        data={memo as any[]}
        onChange={(v) => onFieldChange('memo', v)}
      />
    </div>
  );
}
