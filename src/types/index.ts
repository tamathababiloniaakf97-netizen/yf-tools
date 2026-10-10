// ============================================================
// 数据库行类型
// ============================================================

export interface UserProfile {
  id: string;
  nickname: string;
  role: 'admin' | 'student';
  created_at: string;
}

export type TickerType = 'stock_us' | 'stock_hk' | 'stock_a' | 'option' | 'crypto';
export type TickerStyle = 'offensive' | 'balanced' | 'defensive';
export type Currency = 'USD' | 'HKD' | 'CNY';
export type TransactionType = 'buy' | 'sell' | 'dividend' | 'option_income' | 'deposit' | 'withdraw';
export type OptionDirection = 'buy' | 'sell';
export type OptionCallPut = 'call' | 'put';
export type OptionAction = 'open' | 'close';

export interface Ticker {
  id: string;
  user_id: string;
  name: string;
  code: string;
  type: TickerType;
  currency: Currency;
  current_price: number | null;
  price_updated_at: string | null;
  style: TickerStyle | null;
  created_at: string;
}

// ============================================================
// 期权类型
// ============================================================

/**
 * 期权交易详情
 *
 * 核心规则：
 *  - direction=sell → 现金增加（+price × quantity）
 *  - direction=buy  → 现金减少（-price × quantity）
 *  - SELL PUT / SELL CALL 已平仓 → PnL 可降低股票成本
 *  - BUY PUT / BUY CALL 已平仓 → PnL 不计入股票成本
 */
export interface OptionDetail {
  direction: OptionDirection;       // 交易方向：BUY=支出, SELL=收入
  type: OptionCallPut;              // 期权类型：CALL / PUT
  action: OptionAction;             // 开仓/平仓
  position_id: string;              // 仓位分组 ID（自动管理）
  quantity: number;                 // 合约数量（始终为正）
  price: number;                    // 每张合约权利金 USD（始终为正）
  strike_price?: number;
  expiration_date?: string;
  /** 旧版兼容：option_type（例如 "sell_put"），新交易不再使用 */
  option_type?: string;
}

/** 从旧版 option_type 解析 direction 和 type */
export function parseLegacyOptionType(ot: string): { direction: OptionDirection; type: OptionCallPut } | null {
  const parts = ot.split('_');
  if (parts.length === 2 && (parts[0] === 'buy' || parts[0] === 'sell') && (parts[1] === 'call' || parts[1] === 'put')) {
    return { direction: parts[0], type: parts[1] };
  }
  return null;
}

/**
 * 期权仓位（内存模型）
 *
 * 同一个 position_id 的所有交易构成一个完整仓位生命周期。
 * 支持部分平仓：remainingQuantity > 0 视为 still open。
 */
export interface OptionPosition {
  position_id: string;
  ticker_id: string;
  ticker_name?: string;
  direction: OptionDirection;       // 原始开仓方向
  type: OptionCallPut;              // CALL / PUT
  strike_price?: number;
  expiration_date?: string;
  status: 'open' | 'closed';
  totalQuantity: number;            // 总开仓合约数
  closedQuantity: number;           // 总平仓合约数
  remainingQuantity: number;        // 剩余持仓 = totalQuantity - closedQuantity
  totalPremiumIn: number;           // 累计权利金收入
  totalPremiumOut: number;          // 累计权利金支出
  pnl: number;                      // 净盈亏 = totalPremiumIn - totalPremiumOut
  openedAt: string;
  closedAt?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  ticker_id: string | null;
  type: TransactionType;
  quantity: number | null;
  price: number | null;
  amount_orig: number | null;
  amount_usd: number | null;
  currency: Currency;
  option_detail: OptionDetail | null;
  note: string;
  trade_date: string;
  created_at: string;
}

export type PendingOrderCategory = 'stock' | 'option';

export interface PendingOrder {
  id: string;
  user_id: string;
  ticker_id: string;
  category: PendingOrderCategory;
  side: 'buy' | 'sell';
  option_action: OptionAction | null;
  option_type: OptionCallPut | null;
  position_id: string | null;
  quantity: number;
  price: number;
  reference_price?: number | null;
  strike_price: number | null;
  expiration_date: string | null;
  order_date: string;
  created_at: string;
  updated_at: string;
  tickers?: Pick<Ticker, 'name' | 'code' | 'currency'>;
}

export type PendingOrderInput = Omit<
  PendingOrder,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'tickers'
>;

export interface PortfolioOpening {
  user_id: string;
  opening_date: string;
  opening_cash: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioOpeningPosition {
  id?: string;
  user_id?: string;
  ticker_id: string;
  quantity: number;
  total_cost_usd: number;
  opening_market_value_usd: number;
}

export interface PortfolioOpeningInput {
  opening_date: string;
  opening_cash: number;
  positions: PortfolioOpeningPosition[];
}

export interface NavHistory {
  id: string;
  user_id: string;
  date: string;
  total_assets: number;
  cash_balance: number;
  nav: number;
  shares: number;
  created_at: string;
}

// ============================================================
// 业务逻辑类型
// ============================================================

export interface Position {
  ticker: Ticker;
  totalShares: number;
  costPerShare: number;     // USD
  totalCost: number;        // USD
  currentPrice: number;     // USD (手动输入)
  marketValue: number;      // USD
  optionPnl: number;        // 该标的已平仓期权净收益（仅展示，不计入持仓成本）
  pnl: number;              // USD
  pnlPercent: number;       // %
  allocPercent: number;     // %
  isNegativeCost: boolean;
}

export interface AccountSummary {
  totalAssets: number;
  cashBalance: number;
  marketValue: number;
  totalInvested: number;
  totalPnL: number;
  pnlPercent: number | null; // null 当总投入≤0
  positions: Position[];
  openOptions: OptionPosition[]; // 未平仓期权仓位
  openingConfigured?: boolean;
  netContributions?: number | null;
  cumulativePnl?: number | null;
  holdingUnrealizedPnl?: number;
  xirr?: number | null;
  stockExposurePercent?: number;
  leverageMultiple?: number;
}

export type PortfolioAccountType = 'brokerage' | 'bank' | 'crypto_wallet' | 'other';

export interface PortfolioAccountCashBalance {
  currency: string;
  amount: number;
  usd_rate: number;
}

export interface PortfolioAccountPositionAllocation {
  ticker_id: string;
  quantity: number;
}

export interface PortfolioAccountLocation {
  id?: string;
  user_id?: string;
  name: string;
  account_type: PortfolioAccountType;
  login_url: string;
  login_account: string;
  password_hint: string;
  two_factor_hint: string;
  location_note: string;
  broker_reported_total_usd: number | null;
  cash_balances: PortfolioAccountCashBalance[];
  positions: PortfolioAccountPositionAllocation[];
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CostBasisResult {
  costPerShare: number;
  totalCost: number;
  totalShares: number;
  isNegativeCost: boolean;
  optionPnl: number;  // 该标的已平仓期权净收益
}

// 筛选条件
export interface TransactionFilters {
  ticker_id?: string;
  type?: TransactionType;
  date_from?: string;
  date_to?: string;
}

// ============================================================
// 策略构建类型
// ============================================================

export type StrategyIntent = '加仓' | '持有做成本' | '保护利润' | '期权攒股';
export type StrategyIVLevel = '高波动' | '低波动' | '不确定';
export type StrategyStatus = '规划中' | '执行中' | '已暂停' | '已完成';
export type StrategyRiskLevel = '保守' | '平衡' | '激进';

export interface StrategyHolding {
  ticker: string;
  type: string;
  quantity: number;
  costPrice: number;
  currentPrice?: number;
  isFirstOrOnly: boolean;
}

export interface Strategy {
  id: string;
  user_id: string;
  title: string;
  status: StrategyStatus;
  intent: StrategyIntent;
  iv_level: StrategyIVLevel | null;
  holdings: StrategyHolding[];
  user_input: string | null;
  ai_response: unknown | null;
  edited_playbook: unknown | null;
  risk_level: StrategyRiskLevel | null;
  created_at: string;
  updated_at: string;
}

export interface StrategySummary {
  id: string;
  title: string;
  status: StrategyStatus;
  risk_level: StrategyRiskLevel | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// 资源/资料库类型
// ============================================================

export type ResourceType = 'pdf' | 'link';

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  description: string | null;
  url: string;
  file_path: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
