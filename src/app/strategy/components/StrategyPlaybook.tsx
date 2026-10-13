'use client';

import React from 'react';
import { Typography } from 'antd';
import StrategyOverview from './StrategyOverview';
import EntryPlanTable, { type EntryRow } from './EntryPlanTable';
import ExitPlanTable, { type ExitRow } from './ExitPlanTable';
import OptionsPlanTable, { type OptionsRow } from './OptionsPlanTable';
import RiskControlChecklist, { type RiskControl } from './RiskControlChecklist';
import CashSummary from './CashSummary';
import StressTestTable, { type StressRow } from './StressTestTable';
import OperationMemo, { type MemoRow } from './OperationMemo';
import type { StrategyStatus } from '@/types';

const { Title } = Typography;

export interface PlaybookData {
  overview: {
    title?: string;
    type?: string;
    target?: string;
    currentPrice?: string;
    allocPercent?: string;
    referenceHigh?: number;
  };
  entryPlan: EntryRow[];
  exitPlan: ExitRow[];
  optionsPlan: OptionsRow[];
  riskControl: RiskControl;
  stressTest: StressRow[];
  memo: MemoRow[];
  entryReferencePrice?: { price?: number };
  exitReferencePrice?: { price?: number };
  cashSettings?: { totalCash?: number };
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
  const entryPlan = data.entryPlan || [];
  const exitPlan = data.exitPlan || [];
  const optionsPlan = data.optionsPlan || [];
  const riskControl = data.riskControl || {};
  const stressTest = data.stressTest || [];
  const memo = data.memo || [];

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
        data={entryPlan}
        onChange={(v) => onFieldChange('entryPlan', v)}
        referenceHigh={entryReferenceHigh}
        onReferenceHighChange={onEntryReferenceHighChange}
        totalCash={totalCash}
        existingShares={existingShares}
        existingCost={existingCost}
      />

      <ExitPlanTable
        data={exitPlan}
        onChange={(v) => onFieldChange('exitPlan', v)}
        referenceLow={exitReferenceLow}
        onReferenceLowChange={onExitReferenceLowChange}
        totalShares={entryPlan.reduce((sum, row) => sum + (row.shares || 0), 0)}
        existingAvgCost={existingAvgCost}
      />

      <OptionsPlanTable
        data={optionsPlan}
        onChange={(v) => onFieldChange('optionsPlan', v)}
      />

      <RiskControlChecklist
        data={riskControl}
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
        entryPlan={entryPlan}
        optionsPlan={optionsPlan}
      />

      <StressTestTable
        data={stressTest}
        entryPlan={entryPlan}
        optionsPlan={optionsPlan}
        onChange={(v) => onFieldChange('stressTest', v)}
      />

      <OperationMemo
        data={memo}
        onChange={(v) => onFieldChange('memo', v)}
      />
    </div>
  );
}
