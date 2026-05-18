'use client';

import React from 'react';
import { Card, Tag, Typography, Space } from 'antd';
import {
  SafetyOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface PrincipleCheck {
  capitalPreservation: boolean;
  positiveCarry: boolean;
  hedgeRatio: boolean;
  cashReserve: boolean;
}

interface Props {
  riskLevel: string;
  riskWarnings: string[];
  optimizationSuggestions: string[];
  principleCheck: PrincipleCheck;
}

const riskColorMap: Record<string, string> = {
  '保守': 'green',
  '平衡': 'gold',
  '激进': 'red',
};

export default function AiSuggestions({ riskLevel, riskWarnings, optimizationSuggestions, principleCheck }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      {/* 风险等级卡片 */}
      <Card size="small" style={{ marginBottom: 12, textAlign: 'center' }}>
        <Text strong>风险等级：</Text>
        <Tag color={riskColorMap[riskLevel] || 'blue'} style={{ fontSize: 16, padding: '2px 16px' }}>
          {riskLevel}
        </Tag>
      </Card>

      {/* 原则检查摘要 */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap size={[12, 8]}>
          <Text>
            {principleCheck.capitalPreservation ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <WarningOutlined style={{ color: '#faad14' }} />}
            {' '}保值优先 {principleCheck.capitalPreservation ? '✓' : '✗'}
          </Text>
          <Text>
            {principleCheck.positiveCarry ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <WarningOutlined style={{ color: '#faad14' }} />}
            {' '}正Carry状态 {principleCheck.positiveCarry ? '✓' : '✗'}
          </Text>
          <Text>
            {principleCheck.hedgeRatio ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <WarningOutlined style={{ color: '#ff4d4f' }} />}
            {' '}2倍对冲 {principleCheck.hedgeRatio ? '充足 ✓' : '不足 ⚠'}
          </Text>
          <Text>
            {principleCheck.cashReserve ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <WarningOutlined style={{ color: '#faad14' }} />}
            {' '}现金储备 {principleCheck.cashReserve ? '安全 ✓' : '偏低 ⚠'}
          </Text>
        </Space>
      </Card>

      {/* 风险提示 */}
      {riskWarnings.length > 0 && (
        <Card size="small" title={<><WarningOutlined style={{ color: '#ff4d4f' }} /> 风险提示</>} style={{ marginBottom: 12, borderColor: '#ff4d4f40' }}>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
            {riskWarnings.map((w, i) => <li key={i}><Text type="danger">{w}</Text></li>)}
          </ul>
        </Card>
      )}

      {/* 优化建议 */}
      {optimizationSuggestions.length > 0 && (
        <Card size="small" title={<><ThunderboltOutlined style={{ color: '#1677ff' }} /> 术 · 方案优化</>} style={{ borderColor: '#1677ff40' }}>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
            {optimizationSuggestions.map((s, i) => <li key={i}><Text>{s}</Text></li>)}
          </ul>
        </Card>
      )}
    </div>
  );
}
