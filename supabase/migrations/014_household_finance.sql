create table if not exists public.household_finance_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled_date date not null,
  base_currency text not null default 'CNY' check (base_currency = 'CNY'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.household_ledger_entries (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  kind text not null check (kind in ('business_income','business_expense','business_refund','household_expense','investment_income','security_buy','security_sell','asset_purchase','asset_sale','loan_drawdown','loan_principal_payment','loan_interest','internal_transfer','adjustment')),
  amount_cny numeric not null check (amount_cny > 0), currency text not null default 'CNY',
  original_amount numeric, fx_rate numeric, owner text not null default 'joint' check (owner in ('self','spouse','joint')),
  note text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((currency = 'CNY') or (original_amount > 0 and fx_rate > 0))
);

create table if not exists public.household_accounts (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, category text not null, owner text not null check (owner in ('self','spouse','joint')),
  note text not null default '', active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.household_assets (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, category text not null, owner text not null check (owner in ('self','spouse','joint')),
  note text not null default '', active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.household_liabilities (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, category text not null, owner text not null check (owner in ('self','spouse','joint')),
  note text not null default '', active boolean not null default true, created_at timestamptz not null default now()
);

create table if not exists public.household_account_snapshots (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.household_accounts(id) on delete cascade, snapshot_date date not null,
  value_cny numeric not null, created_at timestamptz not null default now(), unique(account_id, snapshot_date)
);
create table if not exists public.household_asset_snapshots (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null references public.household_assets(id) on delete cascade, snapshot_date date not null,
  value_cny numeric not null check (value_cny >= 0), created_at timestamptz not null default now(), unique(asset_id, snapshot_date)
);
create table if not exists public.household_liability_snapshots (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  liability_id uuid not null references public.household_liabilities(id) on delete cascade, snapshot_date date not null,
  value_cny numeric not null check (value_cny >= 0), created_at timestamptz not null default now(), unique(liability_id, snapshot_date)
);
create table if not exists public.household_investment_snapshots (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null, investment_value_usd numeric not null, usd_cny_rate numeric not null check (usd_cny_rate > 0),
  investment_value_cny numeric not null, securities_cny numeric not null default 0, cash_cny numeric not null default 0,
  valuation_status text not null default 'confirmed', created_at timestamptz not null default now(), unique(user_id, snapshot_date)
);
create table if not exists public.household_period_closures (
  user_id uuid not null references auth.users(id) on delete cascade, period_month date not null,
  status text not null default 'closed' check (status in ('closed','reopened')),
  actual_cash_cny numeric not null, theoretical_cash_cny numeric not null, unexplained_difference_cny numeric not null,
  closed_at timestamptz not null default now(), primary key(user_id, period_month)
);

alter table public.household_finance_settings enable row level security;
alter table public.household_ledger_entries enable row level security;
alter table public.household_accounts enable row level security;
alter table public.household_assets enable row level security;
alter table public.household_liabilities enable row level security;
alter table public.household_account_snapshots enable row level security;
alter table public.household_asset_snapshots enable row level security;
alter table public.household_liability_snapshots enable row level security;
alter table public.household_investment_snapshots enable row level security;
alter table public.household_period_closures enable row level security;

do $$ declare t text; begin
  foreach t in array array['household_finance_settings','household_ledger_entries','household_accounts','household_assets','household_liabilities','household_account_snapshots','household_asset_snapshots','household_liability_snapshots','household_investment_snapshots','household_period_closures'] loop
    execute format('drop policy if exists users_manage_own on public.%I', t);
    execute format('create policy users_manage_own on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

create or replace function public.close_household_month(
  p_period_month date, p_snapshot_date date, p_actual_cash numeric, p_theoretical_cash numeric,
  p_investment_value_usd numeric, p_securities_usd numeric, p_investment_cash_usd numeric, p_usd_cny_rate numeric, p_account_snapshots jsonb, p_liability_snapshots jsonb
) returns void language plpgsql security invoker set search_path = public as $$
declare v jsonb;
begin
  for v in select * from jsonb_array_elements(coalesce(p_account_snapshots, '[]'::jsonb)) loop
    if not exists(select 1 from household_accounts where id=(v->>'id')::uuid and user_id=auth.uid()) then raise exception '现金账户不存在或无权操作'; end if;
    insert into household_account_snapshots(user_id, account_id, snapshot_date, value_cny)
    values(auth.uid(), (v->>'id')::uuid, p_snapshot_date, (v->>'value_cny')::numeric)
    on conflict(account_id, snapshot_date) do update set value_cny=excluded.value_cny;
  end loop;
  for v in select * from jsonb_array_elements(coalesce(p_liability_snapshots, '[]'::jsonb)) loop
    if not exists(select 1 from household_liabilities where id=(v->>'id')::uuid and user_id=auth.uid()) then raise exception '负债不存在或无权操作'; end if;
    insert into household_liability_snapshots(user_id, liability_id, snapshot_date, value_cny)
    values(auth.uid(), (v->>'id')::uuid, p_snapshot_date, (v->>'value_cny')::numeric)
    on conflict(liability_id, snapshot_date) do update set value_cny=excluded.value_cny;
  end loop;
  insert into household_investment_snapshots(user_id, snapshot_date, investment_value_usd, usd_cny_rate, investment_value_cny, securities_cny, cash_cny)
  values(auth.uid(), p_snapshot_date, p_investment_value_usd, p_usd_cny_rate, p_investment_value_usd*p_usd_cny_rate, p_securities_usd*p_usd_cny_rate, p_investment_cash_usd*p_usd_cny_rate)
  on conflict(user_id, snapshot_date) do update set investment_value_usd=excluded.investment_value_usd, usd_cny_rate=excluded.usd_cny_rate, investment_value_cny=excluded.investment_value_cny, securities_cny=excluded.securities_cny, cash_cny=excluded.cash_cny;
  insert into household_period_closures(user_id, period_month, status, actual_cash_cny, theoretical_cash_cny, unexplained_difference_cny, closed_at)
  values(auth.uid(), date_trunc('month', p_period_month)::date, 'closed', p_actual_cash, p_theoretical_cash, p_actual_cash-p_theoretical_cash, now())
  on conflict(user_id, period_month) do update set status='closed', actual_cash_cny=excluded.actual_cash_cny, theoretical_cash_cny=excluded.theoretical_cash_cny, unexplained_difference_cny=excluded.unexplained_difference_cny, closed_at=now();
end $$;
grant execute on function public.close_household_month(date,date,numeric,numeric,numeric,numeric,numeric,numeric,jsonb,jsonb) to authenticated;
