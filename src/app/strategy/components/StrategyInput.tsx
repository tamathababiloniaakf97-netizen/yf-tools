'use client';

import React, { useState } from 'react';
import { Input, Button, Space, Collapse, Typography, App } from 'antd';
import { ThunderboltOutlined, ClearOutlined, SaveOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

const MIN_CHARS = 50;

interface Props {
  userInput: string;
  onInputChange: (text: string) => void;
  onGenerate: () => void;
  onReset: () => void;
  onSave: () => void;
  generating: boolean;
  hasResult: boolean;
}

export default function StrategyInput({
  userInput,
  onInputChange,
  onGenerate,
  onReset,
  onSave,
  generating,
  hasResult,
}: Props) {
  const [dirty, setDirty] = useState(false);

  const handleGenerate = () => {
    if (userInput.trim().length < MIN_CHARS) {
      return;
    }
    onGenerate();
  };

  const guideItems = [
    {
      key: 'guide',
      label: '写作提示（展开查看）',
      children: (
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <Text>请描述以下内容（至少包含 2-3 项）：</Text>
          <ol style={{ marginTop: 4, paddingLeft: 20 }}>
            <li><strong>你为什么关注这个标的？</strong>（基本面、估值、长期逻辑）</li>
            <li><strong>你的心理买入价/安全边际是多少？</strong>（例如：我认为 $200 以下安全）</li>
            <li><strong>你计划持有多久？</strong>（3个月 / 1年 / 5年以上）</li>
            <li><strong>你最担心什么风险？</strong>（暴跌、踏空、黑天鹅、政策变化）</li>
            <li><strong>你希望期权扮演什么角色？</strong>（收现金流 / 保护 / 攒股接货）</li>
          </ol>
        </div>
      ),
    },
  ];

  const charCount = userInput.trim().length;
  const charValid = charCount >= MIN_CHARS;

  return (
    <div>
      <TextArea
        value={userInput}
        onChange={(e) => { onInputChange(e.target.value); setDirty(true); }}
        placeholder="请描述您的投资想法：为什么关注这个标的？您的心理买入价/卖出价是多少？您担心什么风险？计划持有多久？"
        rows={8}
        style={{ marginBottom: 8, fontSize: 13 }}
        showCount
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Text type={charValid ? 'success' : 'danger'} style={{ fontSize: 12 }}>
          {charCount < MIN_CHARS ? `还差 ${MIN_CHARS - charCount} 字` : `已就绪 (${charCount}字)`}
        </Text>
      </div>

      <Collapse
        ghost
        size="small"
        items={guideItems}
        style={{ marginBottom: 12 }}
      />

      <Space wrap>
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={handleGenerate}
          loading={generating}
          disabled={!charValid}
        >
          生成 AI 策略方案
        </Button>
        <Button icon={<ClearOutlined />} onClick={() => { onReset(); setDirty(false); }}>
          重置
        </Button>
        <Button
          icon={<SaveOutlined />}
          onClick={onSave}
          disabled={!hasResult}
        >
          保存策略
        </Button>
      </Space>
    </div>
  );
}
