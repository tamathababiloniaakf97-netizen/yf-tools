-- 投资复盘和方法论：只记录可复用的决策经验，不引入评分体系。

create table if not exists public.investment_reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker_id uuid references public.tickers(id) on delete set null,
  asset_name text not null,
  review_date date not null,
  decision_type text not null check (decision_type in ('buy', 'sell', 'hold', 'skip')),
  original_reason text not null,
  actual_result text not null default '',
  correct_points text not null default '',
  mistake_points text not null default '',
  lesson text not null,
  source_type text not null default 'manual' check (source_type in ('manual', 'codex', 'automation', 'system')),
  source_ref text,
  review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_type not in ('codex', 'automation') or source_ref is not null)
);

create table if not exists public.methodology_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  category text not null check (category in ('selection', 'valuation', 'position', 'discipline', 'review')),
  status text not null default 'active' check (status in ('active', 'retired')),
  source_type text not null default 'manual' check (source_type in ('manual', 'codex', 'automation', 'system')),
  source_ref text,
  review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_type not in ('codex', 'automation') or source_ref is not null)
);

create index if not exists idx_investment_reviews_user_date on public.investment_reviews(user_id, review_date desc);
create index if not exists idx_methodology_user_status on public.methodology_items(user_id, status, category);

alter table public.investment_reviews enable row level security;
alter table public.methodology_items enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['investment_reviews', 'methodology_items'] loop
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
