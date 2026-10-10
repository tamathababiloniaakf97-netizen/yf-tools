import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('market cycle observer migration', () => {
  const sql=readFileSync('supabase/migrations/031_market_cycle_observer.sql','utf8');
  const dynamicSql=readFileSync('supabase/migrations/032_dynamic_market_cycles.sql','utf8');
  const progressSql=readFileSync('supabase/migrations/033_cycle_anchor_progress.sql','utf8');
  const benchmarkSql=readFileSync('supabase/migrations/035_cycle_price_benchmark.sql','utf8');
  it('creates profiles and immutable review snapshots with RLS grants',()=>{
    expect(sql).toContain('create table if not exists public.market_cycle_profiles');
    expect(sql).toContain('create table if not exists public.market_cycle_reviews');
    expect(sql.match(/enable row level security/g)).toHaveLength(2);
    expect(sql).toContain('to authenticated');
    expect(sql).toContain('unique (user_id, cycle_key)');
    expect(sql).toContain('is_active boolean not null default true');
    expect(sql).not.toContain("check (cycle_key in ('ai_global'");
    expect(dynamicSql).toContain('add column if not exists is_active');
    expect(dynamicSql).toContain('drop constraint if exists market_cycle_profiles_cycle_key_check');
  });
  it('adds nullable anchors and immutable calculated review values',()=>{
    for(const field of ['cycle_started_on','cycle_start_price','latest_price','latest_price_on','return_percent','running_days']) {
      expect(progressSql.match(new RegExp(`add column if not exists ${field}(?:\\s|,)`,'g'))).toHaveLength(2);
    }
    expect(progressSql).toContain('cycle_start_price > 0');
    expect(progressSql).toContain('latest_price > 0');
  });
  it('adds an optional ticker benchmark without deleting the ticker',()=>{
    expect(benchmarkSql).toContain('add column if not exists ticker_id');
    expect(benchmarkSql).toContain('references public.tickers(id) on delete set null');
    expect(benchmarkSql).toContain('market_cycle_profiles_ticker_id_idx');
  });
});
