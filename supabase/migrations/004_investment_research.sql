-- 投资研究最小闭环。与现有 tickers/transactions 关联，不复制持仓数据。

create table if not exists public.watchlist_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker_id uuid references public.tickers(id) on delete set null,
  asset_name text not null,
  reason text not null,
  entry_condition text not null,
  status text not null default 'watching' check (status in ('watching', 'near_condition', 'validating', 'paused')),
  next_check_at date,
  notes text not null default '',
  source_type text not null default 'manual' check (source_type in ('manual', 'codex', 'automation', 'system')),
  source_ref text,
  review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_type <> 'automation' or source_ref is not null)
);

create table if not exists public.research_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker_id uuid references public.tickers(id) on delete set null,
  asset_name text not null,
  investment_thesis text not null default '',
  current_judgment text not null default '',
  risks text not null default '',
  invalidation_conditions text not null default '',
  source_type text not null default 'manual' check (source_type in ('manual', 'codex', 'automation', 'system')),
  source_ref text,
  review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, asset_name)
);

create table if not exists public.research_hypotheses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  research_profile_id uuid not null references public.research_profiles(id) on delete cascade,
  statement text not null,
  key_variables text not null default '',
  status text not null default 'unverified' check (status in ('unverified', 'supported', 'challenged', 'inconclusive')),
  next_check_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evidence_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker_id uuid references public.tickers(id) on delete set null,
  asset_name text not null,
  hypothesis_id uuid references public.research_hypotheses(id) on delete set null,
  content text not null,
  impact text not null check (impact in ('support', 'challenge', 'mixed', 'neutral')),
  source_name text not null default '',
  source_url text,
  occurred_at date,
  source_type text not null default 'manual' check (source_type in ('manual', 'codex', 'automation', 'system')),
  source_ref text,
  review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  check (source_type <> 'automation' or source_ref is not null)
);

create index if not exists idx_watchlist_user_status on public.watchlist_items(user_id, status, next_check_at);
create index if not exists idx_research_user_asset on public.research_profiles(user_id, asset_name);
create index if not exists idx_hypotheses_profile on public.research_hypotheses(research_profile_id, status);
create index if not exists idx_evidence_user_asset on public.evidence_records(user_id, asset_name, occurred_at desc);

alter table public.watchlist_items enable row level security;
alter table public.research_profiles enable row level security;
alter table public.research_hypotheses enable row level security;
alter table public.evidence_records enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['watchlist_items', 'research_profiles', 'research_hypotheses', 'evidence_records'] loop
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
