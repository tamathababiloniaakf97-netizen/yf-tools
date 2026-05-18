# 远峯投资策略工作台 (YF-tools)

@AGENTS.md

个人投资策略管理工具，用于记录交易成本、AI 辅助构建投资策略、跟踪策略执行。用户为管理员（李锋锋）+ 不超过 100 名学员。

## 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 框架 | Next.js App Router | 16.x |
| UI | Ant Design + Tailwind CSS v4 | 6.x / 4.x |
| 图表 | ECharts (echarts-for-react) | 6.x |
| 语言 | TypeScript (strict) | 5.x |
| 数据库 | Supabase (PostgreSQL) | — |
| 认证 | Supabase Auth (邮箱 + 邀请码) | — |
| AI | DeepSeek Chat API (JSON Mode) | — |

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # 根布局 (AntdProvider + Navbar)
│   ├── page.tsx            # 重定向到 /cost
│   ├── cost/               # 成本记录页面
│   │   ├── page.tsx
│   │   └── components/     # 6 个组件
│   ├── strategy/           # AI策略构建页面
│   │   ├── page.tsx
│   │   └── components/     # 17 个组件
│   ├── execution/          # 策略执行页面
│   │   ├── page.tsx
│   │   └── components/     # 10 个组件
│   ├── about/              # 个人主页 + 资源管理
│   ├── login/              # 登录/注册
│   └── api/                # REST API (13 个路由)
├── components/             # 共享组件 (Navbar, AuthGuard, AntdProvider)
├── lib/                    # 核心引擎 (cost-engine, portfolio, ai, exchange)
└── types/                  # TypeScript 类型定义
```

## 开发命令

```bash
npm run dev        # 启动开发服务器
npm run build      # 生产构建
npx tsc --noEmit   # TypeScript 类型检查
```

## 架构规范

### 客户端/服务端划分
- `'use client'` 组件：所有页面（cost, strategy, execution, login）、Navbar、AuthGuard、AntdProvider
- 服务端组件：about 页面（async，直接查询 Supabase）
- API 路由：全部使用服务端 Supabase 客户端（`createServerSideClient`）

### 认证模式
- 页面级别：`<AuthGuard>` 包裹（检查 session，未登录跳转 /login）
- API 级别：每个路由调用 `supabase.auth.getUser()`，401 拦截
- 数据库级别：Row Level Security 强制执行数据隔离

### 数据流
- 前端 → API Routes → Supabase → PostgreSQL
- 不直接从客户端组件调用 Supabase（API 路由是唯一数据通道）
- 第三方接口（DeepSeek、东方财富、Binance 等）统一在 API Routes 中调用，客户端不直接请求外网
- 实时价格通过 POST /api/prices/sync 批量拉取

### 状态管理
- 纯 React useState/useEffect/useCallback，无外部状态库
- 策略页面使用 localStorage 做草稿持久化
- 成本页面使用 localStorage 做价格缓存

### 路径别名
- `@/` → `src/`

## 关键引擎（src/lib/）

| 文件 | 用途 |
|------|------|
| `cost-engine.ts` | 终身成本法计算：持仓成本、账户汇总、期权仓位 PnL |
| `portfolio.ts` | 组合指标：NAV序列、TWR、年化收益、最大回撤 |
| `nav-engine.ts` | 净值计算（基金份额法） |
| `exchange.ts` | 固定汇率换算（USD/HKD/CNY） |
| `ai.ts` | DeepSeek API 封装：策略构建 Prompt + JSON 解析 |
| `about.ts` | about 页面数据获取（Supabase + 静态回退） |

## 数据库

完整的 idempotent DDL 在 `supabase/schema.sql`，包含：
- `user_profiles` — 用户扩展（角色: admin/student）
- `tickers` — 标的库（支持 5 种类型 + 3 种风格）
- `transactions` — 交易流水（6 种类型，含期权 JSONB 详情）
- `nav_history` — 每日净值快照
- `exchange_rates` — 汇率
- `strategies` — AI 策略（双存储：ai_response + edited_playbook）
- `about_*` — 公开内容表（里程碑/案例/资源）

所有表启用 RLS，用户数据隔离。

## 命名与格式

- 组件文件 PascalCase，工具函数 camelCase
- 中文 UI 文案，英文代码标识符
- 类型集中定义在 `src/types/index.ts`
- 注释写业务规则的 WHY，不写代码逻辑的 WHAT。反直觉的设计决策、隐含的业务约束、数值的推导依据，必须写注释

## 开发规范

### 代码质量
- **代码精简**：只保留必要逻辑与校验，去掉无用判断、永远不会触发的分支、为未来预留的抽象
- **复用优先**：优先使用项目已有组件、lib/ 工具方法、Ant Design 组件，不重复造轮子
- **逻辑分离**：页面组件只负责视图展示，业务逻辑抽离到 `src/lib/` 下
- **禁止 Mock**：必须对接真实接口，不允许在代码中写死假数据

### 样式规范
- 层级：Ant Design 主题 → globals.css 全局样式 → Tailwind 原子类 → 内联样式
- 不引入新的样式方案（如 CSS Modules、styled-components）

### 变更边界
- **不动历史代码**：稳定运行的代码不随意重构，修改前先沟通
- **不动全局配置**：`next.config.ts`、`tsconfig.json`、`tailwind.config.ts`、`.env.local`、`globals.css` 等文件不擅自修改
- **贴合原有风格**：新增功能沿用项目已有的架构模式（客户端组件 + API Routes + Supabase），不引入新的状态管理库、新的数据获取方案、新的样式方案

## 文档索引

- [网站架构总纲](docs/0.网站构思总纲.md)
- [成本记录页面 需求文档](docs/成本记录页面_需求文档.md)
- [成本记录页面 PRD](docs/成本记录页面_PRD.md)
- [AI策略构建页面 PRD](docs/AI策略构建页面_PRD.md)
- [策略执行页面 PRD](docs/策略执行页面_PRD.md)
- [AI辅助构建策略依据](docs/AI辅助构建策略依据.md) — 投资哲学基础
