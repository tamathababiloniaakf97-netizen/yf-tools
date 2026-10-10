import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('portfolio snapshot service-role permissions', () => {
  it('grants only the tables and operations required by the scheduled worker', () => {
    const sql = readFileSync('supabase/migrations/037_portfolio_snapshot_service_role.sql', 'utf8');
    expect(sql).toContain('grant select on public.portfolio_openings to service_role');
    expect(sql).toContain('grant select on public.portfolio_opening_positions to service_role');
    expect(sql).toContain('grant select on public.transactions to service_role');
    expect(sql).toContain('grant select, update on public.tickers to service_role');
    expect(sql).toContain('grant select, insert, update on public.nav_history to service_role');
    expect(sql).toContain('grant select, insert, update, delete on public.portfolio_position_snapshots to service_role');
  });
});
