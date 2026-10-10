-- 轻量行业研究与对象级外部变量。仅增量扩展现有公司研究。

create table if not exists public.industry_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  summary_judgment text not null default '',
  upstream_overview text not null default '',
  industry_overview text not null default '',
  downstream_overview text not null default '',
  key_drivers text not null default '',
  risks_and_reversal_signals text not null default '',
  notes text not null default '',
  source_type text not null default 'manual' check (source_type in ('manual', 'codex', 'automation', 'system')),
  source_ref text,
  review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name),
  check (source_type <> 'automation' or source_ref is not null)
);

alter table public.research_profiles
  add column if not exists industry_profile_id uuid references public.industry_profiles(id) on delete set null,
  add column if not exists industry_impact text not null default '';

create table if not exists public.industry_companies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  industry_profile_id uuid not null references public.industry_profiles(id) on delete cascade,
  name text not null,
  stage text not null default 'industry' check (stage in ('upstream', 'industry', 'downstream')),
  role text not null default 'other' check (role in ('leader', 'challenger', 'supplier', 'customer', 'substitute', 'other')),
  importance text not null default '',
  research_profile_id uuid references public.research_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.industry_indicators (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  industry_profile_id uuid not null references public.industry_profiles(id) on delete cascade,
  name text not null,
  current_observation text not null default '',
  watch_for text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.external_variables (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  owner_type text not null check (owner_type in ('industry', 'company')),
  industry_profile_id uuid references public.industry_profiles(id) on delete cascade,
  research_profile_id uuid references public.research_profiles(id) on delete cascade,
  name text not null,
  current_state text not null default '',
  impact text not null default '',
  watch_for text not null default '',
  reversal_signal text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((owner_type = 'industry' and industry_profile_id is not null and research_profile_id is null)
    or (owner_type = 'company' and research_profile_id is not null and industry_profile_id is null))
);

create index if not exists idx_industry_profiles_user_updated on public.industry_profiles(user_id, updated_at desc);
create index if not exists idx_industry_companies_profile on public.industry_companies(industry_profile_id, created_at);
create index if not exists idx_industry_indicators_profile on public.industry_indicators(industry_profile_id, created_at);
create index if not exists idx_external_variables_industry on public.external_variables(industry_profile_id, created_at);
create index if not exists idx_external_variables_company on public.external_variables(research_profile_id, created_at);
create index if not exists idx_research_profiles_industry on public.research_profiles(industry_profile_id);

alter table public.industry_profiles enable row level security;
alter table public.industry_companies enable row level security;
alter table public.industry_indicators enable row level security;
alter table public.external_variables enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['industry_profiles', 'industry_companies', 'industry_indicators', 'external_variables'] loop
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

grant select, insert, update, delete on table public.industry_profiles, public.industry_companies, public.industry_indicators, public.external_variables to authenticated;
