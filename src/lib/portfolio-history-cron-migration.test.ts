import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('portfolio snapshot cron migration', () => {
  it('schedules one daily Edge Function call using a Vault secret', () => {
    const sql = readFileSync('supabase/migrations/038_portfolio_snapshot_cron.sql', 'utf8');
    expect(sql).toContain('create extension if not exists pg_cron');
    expect(sql).toContain('create extension if not exists pg_net');
    expect(sql).toContain("'30 0 * * *'");
    expect(sql).toContain('portfolio-daily-snapshot');
    expect(sql).toContain('vault.decrypted_secrets');
    expect(sql).toContain("name = 'portfolio_snapshot_cron_secret'");
    expect(sql).not.toContain('2f20fd277a8f4adca79298ae0a56e742');
  });
});
