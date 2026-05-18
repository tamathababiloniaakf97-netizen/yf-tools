'use client';

import React from 'react';
import { Radio, Space, Typography } from 'antd';
import type { StrategyIntent, StrategyIVLevel } from '@/types';

const { Text } = Typography;

interface Props {
  intent: StrategyIntent | null;
  ivLevel: StrategyIVLevel | null;
  onIntentChange: (intent: StrategyIntent) => void;
  onIVChange: (iv: StrategyIVLevel) => void;
}

export default function IntentSelector({ intent, ivLevel, onIntentChange, onIVChange }: Props) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>操作意图</Text>
        <Radio.Group
          value={intent}
          onChange={(e) => onIntentChange(e.target.value)}
        >
          <Space direction="vertical" size={4}>
            <Radio value="加仓">我想加仓（跌够了，要买入）</Radio>
            <Radio value="持有做成本">我想持有做成本（震荡中卖权/做T降低成本）</Radio>
            <Radio value="保护利润">我想保护利润（涨多了，建对冲/止盈）</Radio>
            <Radio value="期权攒股">我想期权攒股（用 Short Put 慢慢收股票）</Radio>
          </Space>
        </Radio.Group>
      </div>

      <div>
        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
          波动率体感 <Text type="secondary">（可选）</Text>
        </Text>
        <Radio.Group
          value={ivLevel}
          onChange={(e) => onIVChange(e.target.value)}
        >
          <Radio value="高波动">高波动（卖权收租窗口）</Radio>
          <Radio value="低波动">低波动（买保便宜窗口）</Radio>
          <Radio value="不确定">不确定</Radio>
        </Radio.Group>
      </div>
    </div>
  );
}
