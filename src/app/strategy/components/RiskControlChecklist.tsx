'use client';

import React from 'react';
import { Card, Checkbox, Typography, Tag, Space, Input, InputNumber } from 'antd';

const { Text } = Typography;

export interface RiskControl {
  cashMin?: string;
  singleMax?: string;
  hedgeRatio?: string;
  positiveCarry?: boolean;
  totalMarketValue?: number;
  capabilityConfirmed?: boolean;
  disciplineConfirmed?: boolean;
}

interface Props {
  data: RiskControl;
  intent: string;
  singleAllocPercent?: number;
  hedgeCheck: boolean;
  positiveCarryCheck: boolean;
  capabilityConfirmed: boolean;
  disciplineConfirmed: boolean;
  onCapabilityChange: (v: boolean) => void;
  onDisciplineChange: (v: boolean) => void;
  onRiskControlChange: (update: Partial<RiskControl>) => void;
  positionFloorPct?: number;
  targetShares?: number;
  remainingAfterExit?: number;
}

const intentCashMap: Record<string, string> = {
  '加仓': '15%',
  '持有做成本': '20%',
  '保护利润': '30%',
  '期权攒股': '30%',
};

export default function RiskControlChecklist({ data, intent, singleAllocPercent, hedgeCheck, positiveCarryCheck, capabilityConfirmed, disciplineConfirmed, onCapabilityChange, onDisciplineChange, onRiskControlChange, positionFloorPct, targetShares, remainingAfterExit }: Props) {
  const cashMin = data.cashMin || intentCashMap[intent] || '20%';
  const singleMax = data.singleMax || '20%';
  const singleMaxNum = parseInt(singleMax) || 20;
  const singleMaxPass = singleAllocPercent === undefined || singleAllocPercent <= singleMaxNum;

  return (
    <Card size="small" title="风控铁律检查" style={{ marginBottom: 12 }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text strong style={{ fontSize: 13 }}>总市值：</Text>
          <InputNumber
            size="small"
            min={0}
            value={data.totalMarketValue || undefined}
            onChange={(v) => onRiskControlChange({ totalMarketValue: v || 0 })}
            style={{ width: 140 }}
            prefix="$"
            placeholder="输入总市值"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text strong style={{ fontSize: 13 }}>现金底线：</Text>
          <Input
            size="small"
            value={cashMin}
            onChange={(e) => onRiskControlChange({ cashMin: e.target.value })}
            style={{ width: 80 }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>（操作意图：{intent}）</Text>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text strong style={{ fontSize: 13 }}>单标的上限 ≤</Text>
          <Input
            size="small"
            value={singleMax}
            onChange={(e) => onRiskControlChange({ singleMax: e.target.value })}
            style={{ width: 70 }}
          />
          <Text style={{ fontSize: 13 }}>：</Text>
          {singleAllocPercent !== undefined ? (
            <Tag color={singleMaxPass ? 'green' : 'red'}>
              {singleMaxPass ? `合规 (${singleAllocPercent}%)` : `超标 (${singleAllocPercent}%)`}
            </Tag>
          ) : (
            <Tag>待计算</Tag>
          )}
        </div>

        <div>
          <Text strong>2倍对冲检查：</Text>
          <Tag color={hedgeCheck ? 'green' : 'red'}>
            {hedgeCheck ? 'Long Put ≥ 2×(现货+Short Put) ✓' : '对冲不足 ⚠'}
          </Tag>
        </div>

        <div>
          <Text strong>正Carry检查：</Text>
          <Tag color={positiveCarryCheck ? 'green' : 'red'}>
            {positiveCarryCheck ? '净Theta > 0 ✓' : '净Theta ≤ 0 ✗'}
          </Tag>
        </div>

        {targetShares !== undefined && targetShares > 0 && (
          <div>
            <Text strong>仓位底线（50%）：</Text>
            <Tag color={positionFloorPct !== undefined && positionFloorPct >= 50 ? 'green' : 'red'}>
              {positionFloorPct !== undefined && positionFloorPct >= 50
                ? `止盈后剩余 ${remainingAfterExit} 股（${positionFloorPct}%）✓`
                : `⚠ 止盈后仅剩 ${remainingAfterExit} 股（${positionFloorPct}%），低于50%底线`}
            </Tag>
            <Text type="secondary" style={{ fontSize: 11 }}>目标 {targetShares} 股，已卖出 {targetShares - (remainingAfterExit || 0)} 股</Text>
          </div>
        )}

        <Checkbox checked={capabilityConfirmed} onChange={(e) => onCapabilityChange(e.target.checked)}>
          标的符合&ldquo;第一或唯一&rdquo;原则（用户自主确认）
        </Checkbox>

        <Checkbox checked={disciplineConfirmed} onChange={(e) => onDisciplineChange(e.target.checked)}>
          已制定完整计划，拒绝盘中情绪化调整
        </Checkbox>
      </Space>
    </Card>
  );
}
