import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('portfolio daily history migration', () => {
  it('adds auditable daily account and position snapshots with own-row access', () => {
    const sql = readFileSync('supabase/migrations/036_portfolio_daily_history.sql', 'utf8');
    ['market_value', 'external_flow', 'valuation_status', 'price_errors', 'benchmark_price', 'benchmark_nav', 'updated_at']
      .forEach((column) => expect(sql).toContain(column));
    expect(sql).toContain('create table if not exists public.portfolio_position_snapshots');
    expect(sql).toContain('unique(user_id, snapshot_date, ticker_id)');
    expect(sql).toContain('enable row level security');
    expect(sql).toContain('auth.uid() = user_id');
    expect(sql).toContain('grant select on public.nav_history to authenticated');
    expect(sql).toContain('grant select on public.portfolio_position_snapshots to authenticated');
  });
});
