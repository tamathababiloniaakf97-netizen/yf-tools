# AI策略构建页面 — 完整需求文档

> 版本：v2.0（匹配实际实现） | 日期：2026-05-18

---

## 一、页面概述

| 项 | 内容 |
|----|------|
| 路由 | `/strategy` |
| 认证 | AuthGuard 包裹，需登录 |
| 核心目标 | 用户通过自由文本描述投资想法，AI 基于投资哲学辅助完善，生成可编辑、可保存、可导出的策略操作手册 |
| AI 模型 | DeepSeek Chat（deepseek-chat），JSON Mode，temperature 0.3 |

---

## 二、页面布局

左右分栏（左窄右宽，flex: 5:5 基准）：

```
┌──────────────────────────────────────────────────────┐
│  AI策略构建                                           │
│  不预测，只应对 — 将投资想法转化为可执行的操作手册       │
├────────────────────┬─────────────────────────────────┤
│  【左栏】输入区      │  【右栏】AI建议 + 策略手册        │
│                    │                                 │
│  1. 历史策略选择     │  1. AI建议卡片（风险/原则/优化）   │
│  2. 策略示例卡片     │  2. 策略执行手册（8个可编辑区块）  │
│  3. 持仓结构表格     │     - 策略概览                    │
│  4. 操作意图选择     │     - 建仓方案表                  │
│  5. 波动率体感       │     - 止盈方案表                  │
│  6. 策略思考文本区   │     - 期权组合表                  │
│  7. 操作按钮        │     - 风控铁律检查                │
│  8. 策略列表         │     - 现金预算                    │
│                    │     - 压力测试表                  │
│                    │     - 操作备忘                    │
│                    │  [打印] 按钮                      │
└────────────────────┴─────────────────────────────────┘
```

右栏 sticky 定位，独立滚动。

---

## 三、左栏输入区

### 3.1 历史策略选择（StrategyHistorySelect）
- 顶部"新建策略"按钮 + 已选策略名称与状态 Tag
- 从 GET /api/strategies 加载用户所有策略

### 3.2 策略示例卡片（StrategyExamples）
三个可点击 Card：
- **建仓型**：分批建仓，做低成本
- **对冲型**：锁利防踏空
- **期权攒股型**：卖 Put 接货 + LEAPS Call 防踏空
- 点击后自动填充 userInput

### 3.3 持仓结构表格（HoldingsTable）
可编辑 Table，支持增删行：
| 字段 | 类型 |
|------|------|
| 标的代码 | 文本输入 |
| 类型 | 下拉：股票/期权 |
| 数量 | 数字输入 |
| 成本价 | 数字输入 |
| 当前价 | 数字输入（可选） |
| 第一或唯一 | 勾选框 |

右上角 [从成本记录导入] 按钮，调用 GET /api/positions 拉取持仓。

### 3.4 操作意图 + 波动率体感（IntentSelector）
两个 Radio.Group：
- **操作意图**（必选）：加仓 / 持有做成本 / 保护利润 / 期权攒股
- **波动率体感**（可选）：高波动 / 低波动 / 不确定

### 3.5 策略思考文本区（StrategyInput）
- 8 行 TextArea，最少 50 字校验
- 实时字数统计
- 可折叠写作引导面板（5 项提示）
- 三个按钮：生成 AI 策略方案（主按钮）/ 重置 / 保存策略

### 3.6 策略列表（StrategyList）
- 搜索过滤 + 已保存策略列表
- 每项显示：标题、状态 Tag、更新日期
- 选中高亮，悬停显示删除按钮（Popconfirm）

---

## 四、右栏输出区

### 4.1 AI 建议（AiSuggestions）
- **风险等级**：大号彩色 Tag（保守=绿/平衡=金/激进=红）
- **原则检查**：4 个图标检查项（保值优先/正Carry/2倍对冲/现金储备）
- **风险提示**：红色边框列表（如有）
- **优化建议**：蓝色边框列表（如有）

### 4.2 策略执行手册（StrategyPlaybook）

8 个可编辑区块，通过 `handlePlaybookChange` 回调统一更新：

#### 区块1：策略概览（StrategyOverview）
- 可编辑：策略标题、执行状态（规划中/执行中/已暂停/已完成）
- 只读：策略类型标签、标的目标、当前价格
- 可编辑：参考高价 → 自动计算跌幅

#### 区块2：建仓/加仓方案表（EntryPlanTable）
| 列 | 编辑 | 说明 |
|----|------|------|
| 档位 | 否 | 自动编号 |
| 价格 | 是 | InputNumber，$ |
| 股数 | 是 | InputNumber |
| 仓位占比 | 自动计算 | price × shares / totalCash |
| 累计仓位 | 自动计算 | 累加 |
| 加仓模型 | 是 | Select：金字塔/等份/菱形 |
| 触发条件 | 是 | Input |
| 距参考高价跌幅 | 自动计算 | (refHigh - price) / refHigh |

底部显示均摊成本。

#### 区块3：止盈/减仓方案表（ExitPlanTable）
| 列 | 编辑 | 说明 |
|----|------|------|
| 档位 | 否 | 自动编号 |
| 价格 | 是 | InputNumber |
| 卖出股数 | 是 | InputNumber |
| 剩余仓位 | 自动计算 | |
| 减仓模型 | 是 | Select：倒金字塔/等份 |
| 触发条件 | 是 | Input |
| 涨幅 | 自动计算 | (price - refLow) / refLow |

#### 区块4：期权组合方案表（OptionsPlanTable）
| 列 | 编辑 | 说明 |
|----|------|------|
| 层级 | 是 | Select：现金流层/保护层/进攻层/对冲层/防踏空层 |
| 工具 | 是 | Select：Short Put/Long Put/Long Call/Short Call |
| 适用状态 | 是 | Select：未持货/已持货/始终 |
| 方向 | 自动 | 根据工具推导 |
| 数量 | 是 | InputNumber |
| 行权价 | 是 | Input |
| 到期日 | 是 | Input |
| 预估成本/收入 | 是 | InputNumber |
| 核心功能 | 自动 | 根据层级推导 |

卡片标题显示净 Theta。

#### 区块5：风控铁律检查表（RiskControlChecklist）
- 总市值输入（可编辑）
- 现金底线（动态默认值：加仓15%/持有做成本20%/保护利润30%/期权攒股30%）
- 单标的上限 ≤ 20%：自动计算合规性 Tag
- 2倍对冲检查：Tag 通过/不通过
- 正Carry检查：Tag 通过/不通过
- 50%持仓底仓检查
- 两个确认勾选框：能力圈确认 / 纪律确认

#### 区块6：现金预算（CashSummary）
- 总现金输入（可编辑）
- 自动汇总：总买入成本、期权净收支、剩余现金
- 每档明细：价格/数量/预估花费/累计花费/剩余现金

#### 区块7：压力测试表（StressTestTable）
- 默认 4 情景：牛市+30%/震荡横盘/熊市-30%/黑天鹅-50%
- 可编辑：情景名称、价格变动%
- 自动计算：现货盈亏、期权盈亏、组合净盈亏
- 支持添加/删除行

#### 区块8：操作备忘（OperationMemo）
- 键值对表格（项目/内容）
- 可编辑、可增删

---

## 五、AI 集成（src/lib/ai.ts）

### 系统 Prompt 核心规则
1. 不预测市场涨跌，只构建应对方案
2. 保值优先，复利增长，反脆弱
3. 只投资用户理解的优质资产（行业第一或唯一）
4. 任何策略必须满足：正Carry、2倍对冲、现金底线

### 硬性约束
- 单标的 ≤ 20%
- 现金底线动态（15%/20%/30%）
- Long Put ≥ (现货/100 + Short Put) × 2
- 净Theta > 0
- 违规时自动调整至合规

### 技术参数
- API：https://api.deepseek.com/v1/chat/completions
- 模型：deepseek-chat，JSON Mode
- Temperature：0.3，Max Tokens：4096
- 容错：JSON 解析失败时正则提取，再次失败返回默认模板

### 用户 Prompt 结构
```
操作意图：{intent}
波动率体感：{ivEnv}
持仓结构：{holdings JSON}
策略思考：{userInput}
```

---

## 六、数据存储

`strategies` 表（Supabase PostgreSQL）：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid FK | 关联 auth.users |
| title | text | 策略标题 |
| status | text | 规划中/执行中/已暂停/已完成 |
| intent | text | 加仓/持有做成本/保护利润/期权攒股 |
| iv_level | text/null | 高波动/低波动/不确定 |
| holdings | jsonb | StrategyHolding[] |
| user_input | text | 用户原始策略描述 |
| ai_response | jsonb | AI 原始返回（完整JSON） |
| edited_playbook | jsonb | 用户编辑后的终稿 |
| risk_level | text | 保守/平衡/激进 |

双存储模式：`ai_response` 保留 AI 原始输出，`edited_playbook` 存储用户编辑版本。加载时优先使用 `edited_playbook`。

---

## 七、关键交互

### 7.1 草稿自动保存
- 所有输入状态每 1 秒自动保存到 localStorage（key: `yf_strategy_draft`）
- 刷新/重新打开自动恢复
- 保存成功或重置后清除

### 7.2 保存策略
- 弹窗选择：覆盖保存（PUT）或另存为副本（POST，标题加"V2"后缀）
- 确认时将 capabilityConfirmed / disciplineConfirmed 并入 playbook.riskControl

### 7.3 PDF 导出
- 使用 `window.print()` 按钮
- CSS `@media print` 规则隐藏左栏和导航栏

---

## 八、API 路由

| 路由 | 方法 | 说明 |
|------|------|------|
| /api/strategy/build | POST | 调用 DeepSeek AI 生成策略 |
| /api/strategies | GET/POST | 列表/新增 |
| /api/strategies/[id] | GET/PUT/DELETE | 详情/更新/删除 |

---

## 九、文件结构

```
src/app/strategy/
├── page.tsx                       # 主页面（593行）
└── components/
    ├── StrategyHistorySelect.tsx   # 历史策略选择
    ├── StrategyExamples.tsx        # 示例卡片
    ├── HoldingsTable.tsx           # 持仓编辑表格
    ├── IntentSelector.tsx          # 意图+波动率选择
    ├── StrategyInput.tsx           # 策略文本输入+操作按钮
    ├── AiSuggestions.tsx           # AI风险与优化建议
    ├── StrategyPlaybook.tsx        # 策略手册容器
    ├── StrategyOverview.tsx        # 策略概览卡
    ├── EntryPlanTable.tsx          # 建仓方案表
    ├── ExitPlanTable.tsx           # 止盈方案表
    ├── OptionsPlanTable.tsx        # 期权组合表
    ├── RiskControlChecklist.tsx    # 风控铁律检查
    ├── CashSummary.tsx             # 现金预算
    ├── StressTestTable.tsx         # 压力测试
    ├── OperationMemo.tsx           # 操作备忘
    ├── StrategyList.tsx            # 策略列表
    └── PdfExport.tsx               # PDF导出（已实现，当前使用window.print）
```
