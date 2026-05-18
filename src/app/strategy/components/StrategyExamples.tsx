'use client';

import React from 'react';
import { Card, Typography } from 'antd';

const { Text } = Typography;

const examples = [
  {
    key: 'entry',
    title: '建仓型',
    text: '我认为 QQQ 处于长期上行通道，当前 $480，想分批建仓 100 股，计划持有 3 年以上。担心短期回调，希望用期权降低成本。',
  },
  {
    key: 'hedge',
    title: '对冲型',
    text: '我已持有 200 股 TQQQ，成本 $45，现价 $60。想锁住利润又怕踏空，担心美联储鹰派转向导致大跌。',
  },
  {
    key: 'wheeling',
    title: '期权攒股型',
    text: '我想通过卖 Put 攒入 AAPL，心理买入价 $200。当前 $220，IV 偏低。计划每月卖虚值 Put，同时买 LEAPS Call 防踏空。',
  },
];

interface Props {
  onSelect: (text: string) => void;
}

export default function StrategyExamples({ onSelect }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      {examples.map((ex) => (
        <Card
          key={ex.key}
          size="small"
          hoverable
          style={{ flex: 1, cursor: 'pointer', borderColor: '#1677ff40' }}
          onClick={() => onSelect(ex.text)}
          title={<Text strong style={{ fontSize: 13 }}>{ex.title}</Text>}
        >
          <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>
            {ex.text}
          </Text>
        </Card>
      ))}
    </div>
  );
}
