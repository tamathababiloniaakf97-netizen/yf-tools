alter table public.nav_history
  add column if not exists market_value numeric not null default 0,
  add column if not exists external_flow numeric not null default 0,
  add column if not exists valuation_status text not null default 'complete'
    check (valuation_status in ('complete', 'partial', 'failed')),
  add column if not exists price_errors jsonb not null default '[]'::jsonb,
  add column if not exists benchmark_price numeric,
  add column if not exists benchmark_nav numeric,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.portfolio_position_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null,
  ticker_id uuid not null,
  ticker_name text not null,
  ticker_code text not null,
  quantity numeric not null,
  price_usd numeric not null check (price_usd > 0),
  market_value_usd numeric not null,
  price_source text not null,
  price_date date,
  used_fallback boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, snapshot_date, ticker_id)
);

create index if not exists idx_portfolio_position_snapshots_user_date
  on public.portfolio_position_snapshots(user_id, snapshot_date desc);

alter table public.portfolio_position_snapshots enable row level security;

drop policy if exists "users_read_own_portfolio_position_snapshots" on public.portfolio_position_snapshots;
create policy "users_read_own_portfolio_position_snapshots"
  on public.portfolio_position_snapshots for select
  using (auth.uid() = user_id);

grant select on public.nav_history to authenticated;
grant select on public.portfolio_position_snapshots to authenticated;

comment on table public.nav_history is 'Daily portfolio NAV snapshots written by the scheduled service function.';
comment on table public.portfolio_position_snapshots is 'Auditable per-position valuation details for each daily portfolio snapshot.';
