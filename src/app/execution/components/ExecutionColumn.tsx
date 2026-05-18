'use client';

import React, { useCallback } from 'react';
import { Spin, Typography, Empty } from 'antd';
import SymbolCard from './SymbolCard';
import ExecutionPlanList from './ExecutionPlanList';
import OptionsExecutionList from './OptionsExecutionList';
import RiskControlCard from './RiskControlCard';
import ReflectionEditor from './ReflectionEditor';

const { Text } = Typography;

interface ExecutionData {
  status: 'pending' | 'executed';
  actualPrice?: number;
  actualQuantity?: number;
  executedAt?: string;
  note?: string;
}

interface TierData {
  tier: number;
  price: number;
  shares: number;
  ratio: number;
  cumulativeRatio: number;
  model: string;
  triggerCondition: string;
  declineFromRef: number;
  execution?: ExecutionData;
}

interface OptionItem {
  layer: string;
  tool: string;
  state: string;
  direction: string;
  quantity: number;
  strike: number;
  expiry: string;
  costIncome: number;
  func: string;
  execution?: ExecutionData;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Playbook = Record<string, any>;

interface PositionInfo {
  code: string;
  currentPrice: number | null;
  costPerShare: number | null;
  pnlPercent: number | null;
}

interface ExecutionColumnProps {
  strategyId: string | null;
  strategyTitle: string;
  strategyStatus: string;
  playbook: Playbook | null;
  positionInfo: PositionInfo | null;
  loading: boolean;
  onPlaybookChange: (playbook: Playbook) => Promise<void>;
}

export default function ExecutionColumn({
  strategyId,
  strategyTitle,
  strategyStatus,
  playbook,
  positionInfo,
  loading,
  onPlaybookChange,
}: ExecutionColumnProps) {
  const handleMarkEntry = useCallback(
    async (tierIndex: number, exec: ExecutionData) => {
      if (!playbook) return;
      const updated = { ...playbook };
      const entryPlan = [...(updated.entryPlan || [])] as TierData[];
      entryPlan[tierIndex] = { ...entryPlan[tierIndex], execution: exec };
      updated.entryPlan = entryPlan;
      await onPlaybookChange(updated);
    },
    [playbook, onPlaybookChange]
  );

  const handleMarkExit = useCallback(
    async (tierIndex: number, exec: ExecutionData) => {
      if (!playbook) return;
      const updated = { ...playbook };
      const exitPlan = [...(updated.exitPlan || [])] as TierData[];
      exitPlan[tierIndex] = { ...exitPlan[tierIndex], execution: exec };
      updated.exitPlan = exitPlan;
      await onPlaybookChange(updated);
    },
    [playbook, onPlaybookChange]
  );

  const handleMarkOption = useCallback(
    async (index: number, exec: ExecutionData) => {
      if (!playbook) return;
      const updated = { ...playbook };
      const optionsPlan = [...(updated.optionsPlan || [])] as OptionItem[];
      optionsPlan[index] = { ...optionsPlan[index], execution: exec };
      updated.optionsPlan = optionsPlan;
      await onPlaybookChange(updated);
    },
    [playbook, onPlaybookChange]
  );

  const handleSaveReflection = useCallback(
    async (text: string) => {
      if (!playbook) return;
      const updated = { ...playbook, reflection: text };
      await onPlaybookChange(updated);
    },
    [playbook, onPlaybookChange]
  );

  if (!strategyId) {
    return (
      <div
        style={{
          flex: '1 1 0',
          minWidth: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          background: '#fafafa',
          borderRadius: 8,
          border: '1px dashed #d9d9d9',
        }}
      >
        <Empty description="选择一个策略" />
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          flex: '1 1 0',
          minWidth: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
        }}
      >
        <Spin />
      </div>
    );
  }

  const overview = playbook?.overview as Record<string, unknown> | undefined;
  const ticker = positionInfo?.code || (overview?.target as string) || '—';
  const entryRefPrice = playbook?.entryReferencePrice as Record<string, unknown> | undefined;
  const referenceHigh = (entryRefPrice?.price as number) ?? null;
  const riskControl = (playbook?.riskControl || {}) as Record<string, unknown>;
  const netTheta = (playbook?.netTheta as number) ?? (riskControl?.positiveCarry != null ? 0 : null);

  const singlePositionPercent = riskControl?.singlePositionPercent as number | undefined;
  const singleMax = (riskControl?.singleMax as string) || '≤20%';
  const singleMaxNum = parseFloat(singleMax) || 20;
  const singlePositionOk = singlePositionPercent != null ? singlePositionPercent <= singleMaxNum : undefined;

  const hedgeRatio = riskControl?.hedgeRatio as string | undefined;
  const hedgeOk = hedgeRatio ? parseFloat(hedgeRatio) >= 2 : undefined;

  const positiveCarryVal = riskControl?.positiveCarry as boolean | undefined;
  const positiveCarryOk = positiveCarryVal !== undefined ? positiveCarryVal : undefined;

  const cashMin = riskControl?.cashMin as string | undefined;
  const cashReserveOk = riskControl?.cashReserveOk as boolean | undefined;

  return (
    <div
      className="yf-execution-column"
      style={{
        flex: '1 1 0',
        minWidth: 320,
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 140px)',
        paddingRight: 4,
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <Text strong style={{ fontSize: 14 }}>{strategyTitle}</Text>
        <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
          {strategyStatus}
        </Text>
      </div>

      <div style={{ marginBottom: 8 }}>
        <SymbolCard
          ticker={ticker}
          currentPrice={positionInfo?.currentPrice ?? null}
          costPerShare={positionInfo?.costPerShare ?? null}
          pnlPercent={positionInfo?.pnlPercent ?? null}
          referenceHigh={referenceHigh}
          status={strategyStatus}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <ExecutionPlanList
          title="买入计划"
          tiers={(playbook?.entryPlan as TierData[]) || []}
          currentPrice={positionInfo?.currentPrice ?? null}
          onMarkExecution={handleMarkEntry}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <ExecutionPlanList
          title="卖出计划"
          tiers={(playbook?.exitPlan as TierData[]) || []}
          currentPrice={positionInfo?.currentPrice ?? null}
          onMarkExecution={handleMarkExit}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <OptionsExecutionList
          options={(playbook?.optionsPlan as OptionItem[]) || []}
          netTheta={netTheta}
          onMarkExecution={handleMarkOption}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <RiskControlCard
          data={{
            cashMin,
            singleMax,
            hedgeRatio,
            positiveCarry: positiveCarryVal,
            singlePositionOk,
            hedgeOk,
            positiveCarryOk,
            cashReserveOk,
            singlePositionPercent,
          }}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 6,
            border: '1px solid #f0f0f0',
            padding: '10px 14px',
          }}
        >
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
            策略反思
          </Text>
          <ReflectionEditor
            value={(playbook?.reflection as string) || ''}
            onSave={handleSaveReflection}
          />
        </div>
      </div>
    </div>
  );
}
