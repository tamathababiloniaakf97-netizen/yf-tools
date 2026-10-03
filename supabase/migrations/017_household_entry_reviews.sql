alter table public.household_finance_settings
  add column if not exists entry_review_started_month date;

update public.household_finance_settings
set entry_review_started_month = date_trunc('month', timezone('Asia/Shanghai', now()))::date
where entry_review_started_month is null;

alter table public.household_finance_settings
  alter column entry_review_started_month set not null;

create table if not exists public.household_entry_reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_month date not null,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, period_month),
  check (period_month = date_trunc('month', period_month)::date)
);

alter table public.household_entry_reviews enable row level security;
drop policy if exists users_manage_own on public.household_entry_reviews;
create policy users_manage_own on public.household_entry_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.household_entry_reviews to authenticated;
