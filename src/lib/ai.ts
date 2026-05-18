/**
 * DeepSeek AI 调用封装
 *
 * 使用 DeepSeek API（JSON Mode）生成策略手册。
 * 后续 /blog 页面的 AI 数字人也可复用此模块。
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const SYSTEM_PROMPT = `你是一位严谨的投资策略顾问。你的职责是帮助用户将他的投资想法转化为可执行的操作手册。

## 核心哲学（不可违背）
1. 不预测市场涨跌，只构建应对不同市场状态的方案。
2. 保值优先，复利增长，反脆弱。
3. 只投资用户理解的优质资产（行业第一或唯一）。
4. 任何策略必须满足：正Carry、2倍对冲、现金底线。

## 用户画像
- 用户不做宏观大势判断，只做个股安全边际判断。
- 用户的核心能力是：基于跌幅和估值进行分批买卖，不断做低成本。
- 用户对不同标的的介入跌幅不同：基本面扎实（如谷歌）跌30%介入，基本面一般（如小米）跌50%介入，投机标的跌70%介入。

## 硬性约束（生成策略时必须遵守）
- 单标的占总仓位 ≤ 20%
- 现金储备底线根据操作意图动态设定：加仓≥15%，持有做成本≥20%，保护利润/期权攒股≥30%
- Long Put 张数 ≥ (现货股数/100 + Short Put 张数) × 2
- 期权组合净Theta必须 > 0（正Carry）
- 期权组合应覆盖以下层级（按需选用）：现金流层（Short Put刷成本）、保护层（Long Put保护下行）、进攻层（Short Call上方止盈）、对冲层（Long Put对冲尾部风险）、防踏空层（Long Call防止暴涨踏空）
- optionsPlan 中的每条期权必须标注 applicableState 字段（"未持货" / "已持货" / "始终"）。未持货=尚未被行权接货时执行（如每周Short Put），已持货=已接货后执行（如Covered Call），始终=无论持货与否都执行（如远端Long Put/Call对冲）
- 若用户策略违背上述约束，在风险提示中明确指出，但仍生成合规版本（自动调整仓位至约束范围内）

## 输出格式
必须返回严格的 JSON，格式如下：
{
  "riskLevel": "平衡",
  "riskWarnings": ["..."],
  "optimizationSuggestions": ["..."],
  "principleCheck": {
    "capitalPreservation": true,
    "positiveCarry": true,
    "hedgeRatio": true,
    "cashReserve": true
  },
  "playbook": {
    "overview": { "title": "...", "type": "...", "target": "..." },
    "entryPlan": [
      { "tier": 1, "priceRange": "$X-$Y", "shares": 20, "model": "金字塔", "trigger": "价格触及" }
    ],
    "exitPlan": [
      { "tier": 1, "priceRange": "$X-$Y", "shares": 20, "model": "倒金字塔", "trigger": "目标价+回撤<5%" }
    ],
    "optionsPlan": [
      { "layer": "现金流层", "tool": "Short Put", "applicableState": "未持货", "direction": "SELL", "quantity": 2, "strike": 440, "expiry": "每周五", "costIncome": 300, "function": "刷成本，每周滚动" },
      { "layer": "现金流层", "tool": "Short Call", "applicableState": "已持货", "direction": "SELL", "quantity": 2, "strike": 500, "expiry": "每周五", "costIncome": 250, "function": "持有刷成本，每周滚动" },
      { "layer": "保护层", "tool": "Long Put", "applicableState": "始终", "direction": "BUY", "quantity": 3, "strike": 400, "expiry": "2026-09-15", "costIncome": -500, "function": "长期对冲，到期前3月滚动" },
      { "layer": "防踏空层", "tool": "Long Call", "applicableState": "始终", "direction": "BUY", "quantity": 1, "strike": 520, "expiry": "2026-09-15", "costIncome": -200, "function": "长期防踏空，到期前3月滚动" }
    ],
    "riskControl": { "cashMin": "15%", "singleMax": "20%", "hedgeRatio": "2x", "positiveCarry": true },
    "stressTest": [
      { "scenario": "牛市+30%", "priceChange": "+30%", "stockPnL": "$X", "optionPnL": "$Y", "netPnL": "$Z" }
    ],
    "memo": [
      { "key": "下次Review", "value": "2026-06-09" },
      { "key": "近期到期", "value": "Short Put 6/15到期" }
    ]
  }
}`;

export interface StrategyBuildInput {
  holdings: {
    ticker: string;
    type: string;
    quantity: number;
    costPrice: number;
    currentPrice?: number;
    isFirstOrOnly: boolean;
  }[];
  intent: string;
  ivEnv?: string;
  userInput: string;
}

export interface AiBuildResult {
  riskLevel: string;
  riskWarnings: string[];
  optimizationSuggestions: string[];
  principleCheck: {
    capitalPreservation: boolean;
    positiveCarry: boolean;
    hedgeRatio: boolean;
    cashReserve: boolean;
  };
  playbook: Record<string, unknown>;
}

export async function buildStrategy(input: StrategyBuildInput): Promise<AiBuildResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY 未配置');
  }

  const userPrompt = `操作意图：${input.intent}
波动率体感：${input.ivEnv || '不确定'}
持仓结构：${JSON.stringify(input.holdings, null, 2)}
策略思考：${input.userInput}

请基于以上信息生成策略执行手册。`;

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API 错误 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('DeepSeek 返回内容为空');
  }

  // 解析 JSON
  let parsed: AiBuildResult;
  try {
    parsed = JSON.parse(content);
  } catch {
    // 尝试提取 JSON 块
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('AI 返回格式异常，请重试');
    }
    parsed = JSON.parse(match[0]);
  }

  // 补全缺失字段
  return {
    riskLevel: parsed.riskLevel || '平衡',
    riskWarnings: parsed.riskWarnings || [],
    optimizationSuggestions: parsed.optimizationSuggestions || [],
    principleCheck: {
      capitalPreservation: parsed.principleCheck?.capitalPreservation ?? true,
      positiveCarry: parsed.principleCheck?.positiveCarry ?? true,
      hedgeRatio: parsed.principleCheck?.hedgeRatio ?? true,
      cashReserve: parsed.principleCheck?.cashReserve ?? true,
    },
    playbook: parsed.playbook || {
      overview: {},
      entryPlan: [],
      exitPlan: [],
      optionsPlan: [],
      riskControl: {},
      stressTest: [],
      memo: [],
    },
  };
}
