# 远峯投资策略工作台 — 成本记录页面需求文档

> 版本：v2.0（匹配实际实现） | 日期：2026-05-18

---

## 一、概述

成本记录页面是整个工作台的基础。用户手动记录每一笔交易，系统自动计算每个标的的持仓成本，展示总资产、总市值、净值曲线，并与标普500基准对比。

### 核心功能
- 交易流水录入：买入、卖出、分红、期权权利金、入金、出金
- 终身成本法计算持仓成本（清仓不重置）
- 账户总览卡片：总资产、现金、市值、盈亏、策略收益（TWR）、账户收益
- 净值曲线 vs SPY 基准对比
- 期权仓位管理：开仓/平仓，自动分组计算PnL

---

## 二、页面布局（从上到下）

```
┌─ 操作栏 ──────────────────────────────────────────────────┐
│  [添加标的]  [录入交易]  [刷新数据]                         │
├─ 账户总览卡片 ─────────────────────────────────────────────┤
│  总资产 | 现金余额 | 持仓市值 | 总投入 | 总盈亏 |           │
│  策略收益(TWR) | 账户收益 | 风格分配(进攻/平衡/防御)       │
├─ 持仓明细 ────────────────────────────────────────────────┤
│  [一键更新收盘价]                                          │
│  Table: 风格 | 标的 | 类型 | 持仓量 | 成本价 | 期权PnL |   │
│        现价(可编辑) | 市值 | 盈亏 | 盈亏% | 占比 | 操作    │
├─ 净值走势图 ──────────────────────────────────────────────┤
│  策略收益(TWR)% | 年化收益% | 最大回撤%                    │
│  ECharts 双线图: 用户净值(蓝) vs SPY(黄虚线)               │
├─ 交易流水 ────────────────────────────────────────────────┤
│  [股票流水 | 期权流水] (Segmented)  [导出Excel]             │
│  筛选: 类型/方向/日期范围                                   │
│  Table: 日期 | 类型 | 标的 | 数量 | 价格 | 金额 | 备注     │
│        期权: 方向 | CALL/PUT | 开/平 | 行权价 | 到期日     │
└───────────────────────────────────────────────────────────┘
```

---

## 三、账户总览卡片（AccountSummaryCards）

7-8 个指标卡片，响应式网格布局：

| 卡片 | 数据来源 | 格式 |
|------|----------|------|
| 总资产 | `summary.totalAssets` | $X.XX |
| 现金余额/占比 | `summary.cashBalance` | $X.XX (X%) |
| 持仓市值/占比 | `summary.marketValue` | $X.XX (X%) |
| 总投入 | `summary.totalInvested` | $X.XX |
| 总盈亏 | `summary.totalPnL` | $X.XX（红/绿） |
| 策略收益(TWR) | `calculateTWR()` | X.XX%（资金加权） |
| 账户收益 | `calculateAccountReturn()` | X.XX%（简单收益） |
| 风格分配 | 按 style 汇总市值占比 | 进攻/平衡/防御 Tag |

---

## 四、持仓明细表（PositionTable）

Ant Design Table，不分页，X轴可滚动。

| 列 | 说明 | 可编辑 |
|----|------|--------|
| 风格 | ticker.style，下拉选择（进攻/平衡/防御），PATCH 保存 | 是 |
| 标的名称 | ticker.name + ticker.code | 否 |
| 类型 | 美股/港股/A股/期权/加密（Tag） | 否 |
| 持仓量 | totalShares | 否 |
| 成本价(USD) | costPerShare，负成本显示"负成本" | 否 |
| 期权PnL | optionPnl（已平仓期权净收益） | 否 |
| 现价(USD) | currentPrice，点击内联编辑，Enter/失焦保存 | 是 |
| 市值(USD) | marketValue | 否 |
| 盈亏(USD) | pnl | 否 |
| 盈亏% | pnlPercent | 否 |
| 占比 | allocPercent | 否 |
| 操作 | "流水"按钮，滚动到交易面板并筛选该标的 | — |

表头右侧：[一键更新收盘价] 按钮，调用 POST /api/prices/sync 批量拉取实时价格。

---

## 五、净值走势图（NavChart）

ECharts 折线图，双系列对比：

- **策略净值（TWR）**：实线，蓝色，基金份额法计算
- **SPY 500**：虚线，黄色，来自东方财富 K线数据（标准化从1.0开始）

图表上方三个 Statistic 卡片：
- 策略收益(TWR)% — 下方灰色小字显示 SPY 同期对比
- 年化收益% — 数据不足60天显示"(不足60天)"，含 SPY 对比
- 最大回撤% — 含 SPY 对比

数据加载：用户净值由 `portfolio.ts` 的 `calculateAllMetrics()` 计算，SPY数据从 `/api/spy?start=YYYY-MM-DD` 获取。

---

## 六、交易流水面板（TransactionPanel）

双标签切换（Ant Design Segmented）：

### 股票流水标签
- 筛选器：交易类型（buy/sell/dividend/deposit/withdraw）、日期范围
- 表格列：日期、类型（彩色Tag）、标的、数量、价格、金额(USD)、备注、操作（编辑/删除）
- 金额流入绿色、流出红色

### 期权流水标签
- 筛选器：方向（SELL/BUY）、CALL/PUT、开仓/平仓、日期范围
- 表格列：交易日期、类型（卖出开仓/买入平仓等组合Tag）、标的、方向、CALL/PUT、开平、合约数、权利金、金额(USD)、行权价、到期日、备注、操作

共同功能：
- 分页（pageSize=20，支持切换）
- Excel 导出（xlsx 库，按标签分别导出）
- 删除带 Popconfirm 确认
- 点击编辑打开 TransactionModal

---

## 七、交易弹窗（TransactionModal）

520px 宽 Modal，Ant Design Form，字段根据交易类型动态切换：

| 交易类型 | 显示字段 |
|----------|----------|
| buy / sell | 标的选择器、数量、单价（原币种）、日期、备注 |
| dividend | 标的选择器、金额（原币种）、日期、备注 |
| deposit / withdraw | 金额（USD）、日期、备注 |
| option_income | 标的、开平仓、条件字段 |

### 期权限定字段
- **开仓**：方向(SELL/BUY)、类型(CALL/PUT)、数量、权利金/张(USD)、行权价(可选)、到期日(可选)，自动计算总金额预览
- **平仓**：选择已开仓仓位下拉框、数量、权利金，自动显示平仓方向
- position_id 自动生成：`opt_<timestamp36>_<random6>`

编辑模式下预填充所有字段，平仓时显示"[已平仓]"选项。

---

## 八、标的弹窗（TickerModal）

简单表单：名称(必填)、代码(必填，含市场格式提示)、类型(必填，Select)、币种(必填，Select)、风格(可选)

---

## 九、核心算法

### 9.1 终身成本法（cost-engine.ts）

```
持仓成本 = (累计买入USD - 累计卖出USD - 累计分红USD - 已平仓期权PnL) ÷ 当前持仓量
现金余额 = 入金 - 出金 + 卖出收入 - 买入支出 + 分红 + 已平仓期权净收益
总资产 = 持仓市值 + 现金余额
总盈亏 = 总资产 - (入金 - 出金)
```

关键规则：
- 卖出不减成本，只减持仓量（成本价不变）
- 已平仓 SELL PUT/CALL PnL 计入成本抵扣；已平仓 BUY PUT/CALL PnL 不计入
- 期权未平仓仓位单独跟踪，不影响成本

### 9.2 净值计算（portfolio.ts / nav-engine.ts）

基金份额法：
- 初始净值 = 1.0
- 入金/出金调整份额，不变净值
- 每日净值仅随市值波动变化
- 自动插入虚拟初始入金（避免首次交易前出现负现金）

### 9.3 收益指标

- **TWR** = (期末净值 / 期初净值) - 1
- **年化收益** = (期末/期初)^(365/天数) - 1（需≥60天）
- **最大回撤** = 滚动峰值法
- **账户收益** = (总资产 - 净入金) / 净入金

### 9.4 汇率换算（exchange.ts）

固定汇率：USD=1, HKD=1/7.8, CNY=1/7.2

---

## 十、价格数据源

| 市场 | 数据源 | 说明 |
|------|--------|------|
| 美股 | 东方财富 push2.eastmoney.com | 前缀 105(NASDAQ)/106(NYSE)/107(AMEX) |
| 港股 | 东方财富 | 前缀 116 |
| A股 | 东方财富 | 前缀 1(上交所)/0(深交所) |
| 加密 | Binance api.binance.com | `{code}USDT` 交易对 |
| SPY基准 | 东方财富 push2his.eastmoney.com | secid=107.SPY，1小时缓存 |

价格同步：POST /api/prices/sync 并发获取所有标的实时价格，写入 tickers.current_price。

---

## 十一、API 路由

| 路由 | 方法 | 说明 |
|------|------|------|
| /api/positions | GET | 返回 tickers + transactions |
| /api/transactions | GET/POST | 列表(支持筛选)/新增 |
| /api/transactions/[id] | PATCH/DELETE | 编辑/删除 |
| /api/tickers | GET/POST | 列表/新增 |
| /api/tickers/[id] | PATCH/DELETE | 更新(价格/风格)/删除 |
| /api/prices/sync | POST | 批量拉取实时价格 |
| /api/spy | GET | SPY 净值序列（?start=日期） |

所有路由需认证，修改操作需所有权校验。

---

## 十二、文件结构

```
src/app/cost/
├── page.tsx                       # 主页面
└── components/
    ├── AccountSummaryCards.tsx     # 账户总览卡片
    ├── PositionTable.tsx           # 持仓明细表
    ├── TransactionModal.tsx        # 交易录入/编辑弹窗
    ├── TickerModal.tsx             # 标的添加弹窗
    ├── TransactionPanel.tsx        # 交易流水面板（双标签）
    └── NavChart.tsx               # 净值走势图

src/lib/
├── cost-engine.ts                 # 成本计算引擎
├── portfolio.ts                   # 组合收益指标
├── nav-engine.ts                  # 净值序列计算
└── exchange.ts                    # 汇率换算
```
