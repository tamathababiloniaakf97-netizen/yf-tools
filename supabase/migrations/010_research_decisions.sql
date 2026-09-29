-- 公司研究快照与投资决策。仅增量扩展，不重写已有研究、证据、复盘、持仓或交易。

alter table public.research_profiles
  add column if not exists business_model text not null default '',
  add column if not exists customer_value text not null default '',
  add column if not exists competitive_advantage text not null default '',
  add column if not exists long_term_assumptions text not null default '',
  add column if not exists earnings_quality text not null default '',
  add column if not exists management_culture text not null default '',
  add column if not exists unknowns text not null default '',
  add column if not exists checklist_state jsonb not null default '{}'::jsonb;

create table if not exists public.research_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  research_profile_id uuid not null references public.research_profiles(id) on delete cascade,
  snapshot_version integer not null check (snapshot_version > 0),
  snapshot_data jsonb not null,
  evidence_snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (research_profile_id, snapshot_version)
);

create table if not exists public.investment_decisions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  research_profile_id uuid not null references public.research_profiles(id) on delete cascade,
  research_snapshot_id uuid references public.research_snapshots(id) on delete restrict,
  asset_name text not null,
  status text not null default 'draft' check (status in ('draft', 'finalized')),
  market_expectation text not null default '',
  personal_divergence text not null default '',
  valuation_conclusion text not null default '',
  valuation_assumptions text not null default '',
  safety_margin text not null default '',
  investment_plan text not null default '',
  error_signals text not null default '',
  error_response text not null default '',
  do_not_list jsonb not null default '[]'::jsonb,
  decision_type text check (decision_type in ('buy', 'add', 'hold', 'reduce', 'sell', 'watch', 'skip')),
  final_reason text not null default '',
  decision_date date,
  source_type text not null default 'manual' check (source_type in ('manual', 'codex', 'automation', 'system')),
  source_ref text,
  review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_type <> 'automation' or source_ref is not null),
  check (status <> 'finalized' or (research_snapshot_id is not null and decision_date is not null))
);

alter table public.investment_reviews
  add column if not exists decision_id uuid references public.investment_decisions(id) on delete set null;

create index if not exists idx_research_snapshots_profile_version on public.research_snapshots(research_profile_id, snapshot_version desc);
create index if not exists idx_research_snapshots_user_created on public.research_snapshots(user_id, created_at desc);
create index if not exists idx_investment_decisions_user_status on public.investment_decisions(user_id, status, updated_at desc);
create index if not exists idx_investment_decisions_profile_date on public.investment_decisions(research_profile_id, decision_date desc);
create index if not exists idx_investment_reviews_decision on public.investment_reviews(decision_id);

alter table public.research_snapshots enable row level security;
alter table public.investment_decisions enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['research_snapshots', 'investment_decisions'] loop
    execute format('drop policy if exists "users_select_own_%1$s" on public.%1$I', table_name);
    execute format('create policy "users_select_own_%1$s" on public.%1$I for select using (auth.uid() = user_id)', table_name);
    execute format('drop policy if exists "users_insert_own_%1$s" on public.%1$I', table_name);
    execute format('create policy "users_insert_own_%1$s" on public.%1$I for insert with check (auth.uid() = user_id)', table_name);
    execute format('drop policy if exists "users_update_own_%1$s" on public.%1$I', table_name);
    execute format('create policy "users_update_own_%1$s" on public.%1$I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name);
    execute format('drop policy if exists "users_delete_own_%1$s" on public.%1$I', table_name);
    execute format('create policy "users_delete_own_%1$s" on public.%1$I for delete using (auth.uid() = user_id)', table_name);
  end loop;
end $$;

grant select, insert, update, delete on table
  public.research_snapshots,
  public.investment_decisions
to authenticated;
