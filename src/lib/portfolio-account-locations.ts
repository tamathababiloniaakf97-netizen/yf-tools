import type { PortfolioAccountLocation, PortfolioAccountType, Position } from '@/types';

export interface CalculatedPortfolioAccount extends PortfolioAccountLocation {
  cash_value_usd: number;
  position_value_usd: number;
  calculated_total_usd: number;
  broker_difference_usd: number | null;
}

export interface PortfolioPositionReconciliation {
  ticker_id: string;
  ticker_name: string;
  ticker_code: string;
  expected_quantity: number;
  allocated_quantity: number;
  difference: number;
}

const accountTypes: PortfolioAccountType[] = ['brokerage', 'bank', 'crypto_wallet', 'other'];
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const rounded = (value: number, digits = 8) => Number(value.toFixed(digits));

export function validatePortfolioAccounts(input: unknown): { ok: true; value: PortfolioAccountLocation[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: '账户数据格式不正确' };
  if (input.length > 100) return { ok: false, error: '账户数量过多' };

  const value: PortfolioAccountLocation[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const raw = input[index];
    if (!raw || typeof raw !== 'object') return { ok: false, error: `第 ${index + 1} 个账户格式不正确` };
    const row = raw as Record<string, unknown>;
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!name) return { ok: false, error: `第 ${index + 1} 个账户缺少名称` };
    const accountType = row.account_type;
    if (typeof accountType !== 'string' || !accountTypes.includes(accountType as PortfolioAccountType)) return { ok: false, error: `${name} 的账户类型无效` };

    const cashInput = Array.isArray(row.cash_balances) ? row.cash_balances : [];
    const cash_balances = [];
    for (const rawCash of cashInput) {
      if (!rawCash || typeof rawCash !== 'object') return { ok: false, error: `${name} 的现金数据无效` };
      const cash = rawCash as Record<string, unknown>;
      const currency = typeof cash.currency === 'string' ? cash.currency.trim().toUpperCase() : '';
      if (!currency || !finite(cash.amount) || !finite(cash.usd_rate) || cash.usd_rate <= 0) return { ok: false, error: `${name} 的现金金额或汇率无效` };
      cash_balances.push({ currency, amount: cash.amount, usd_rate: cash.usd_rate });
    }

    const positionInput = Array.isArray(row.positions) ? row.positions : [];
    const positions = [];
    for (const rawPosition of positionInput) {
      if (!rawPosition || typeof rawPosition !== 'object') return { ok: false, error: `${name} 的持仓数据无效` };
      const position = rawPosition as Record<string, unknown>;
      const tickerId = typeof position.ticker_id === 'string' ? position.ticker_id.trim() : '';
      if (!tickerId || !finite(position.quantity) || position.quantity < 0) return { ok: false, error: `${name} 的持仓数量无效` };
      positions.push({ ticker_id: tickerId, quantity: position.quantity });
    }

    const brokerTotal = row.broker_reported_total_usd;
    if (brokerTotal != null && (!finite(brokerTotal) || brokerTotal < 0)) return { ok: false, error: `${name} 的券商总资产无效` };
    const text = (key: string) => typeof row[key] === 'string' ? (row[key] as string).trim() : '';
    value.push({
      id: text('id') || undefined,
      name,
      account_type: accountType as PortfolioAccountType,
      login_url: text('login_url'),
      login_account: text('login_account'),
      password_hint: text('password_hint'),
      two_factor_hint: text('two_factor_hint'),
      location_note: text('location_note'),
      broker_reported_total_usd: brokerTotal == null ? null : brokerTotal,
      cash_balances,
      positions,
      sort_order: finite(row.sort_order) ? Math.max(0, Math.trunc(row.sort_order)) : index,
    });
  }
  return { ok: true, value };
}

export function calculatePortfolioAccountLocations(accounts: PortfolioAccountLocation[], marketPositions: Position[], expectedCashUsd: number) {
  const positionMap = new Map(marketPositions.map(position => [position.ticker.id, position]));
  const calculatedAccounts: CalculatedPortfolioAccount[] = accounts.map(account => {
    const cashValue = account.cash_balances.reduce((sum, cash) => sum + cash.amount * cash.usd_rate, 0);
    const positionValue = account.positions.reduce((sum, allocation) => {
      const position = positionMap.get(allocation.ticker_id);
      return sum + allocation.quantity * (position?.currentPrice ?? 0);
    }, 0);
    const calculatedTotal = cashValue + positionValue;
    return {
      ...account,
      cash_value_usd: cashValue,
      position_value_usd: positionValue,
      calculated_total_usd: calculatedTotal,
      broker_difference_usd: account.broker_reported_total_usd == null ? null : account.broker_reported_total_usd - calculatedTotal,
    };
  });

  const positionReconciliation = marketPositions.map(position => {
    const allocated = accounts.reduce((sum, account) => sum + account.positions.filter(item => item.ticker_id === position.ticker.id).reduce((value, item) => value + item.quantity, 0), 0);
    return {
      ticker_id: position.ticker.id,
      ticker_name: position.ticker.name,
      ticker_code: position.ticker.code,
      expected_quantity: position.totalShares,
      allocated_quantity: allocated,
      difference: rounded(allocated - position.totalShares),
    };
  });
  const allocatedCash = calculatedAccounts.reduce((sum, account) => sum + account.cash_value_usd, 0);
  const cashDifference = rounded(allocatedCash - expectedCashUsd, 2);
  return {
    accounts: calculatedAccounts,
    calculated_total_usd: calculatedAccounts.reduce((sum, account) => sum + account.calculated_total_usd, 0),
    allocated_cash_usd: allocatedCash,
    cash_difference_usd: cashDifference,
    position_reconciliation: positionReconciliation,
    is_reconciled: Math.abs(cashDifference) < 0.01 && positionReconciliation.every(item => Math.abs(item.difference) < 1e-8),
  };
}
