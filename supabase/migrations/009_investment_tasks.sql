-- 独立、轻量的投资待办；不修改通用计划、持仓或交易数据。

create table if not exists public.investment_tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_name text not null default '',
  task_type text not null check (task_type in ('price', 'research', 'validation', 'financial_report', 'other')),
  title text not null,
  condition_note text not null default '',
  reminder_date date,
  status text not null default 'pending' check (status in ('pending', 'waiting', 'completed', 'cancelled')),
  notes text not null default '',
  completed_at timestamptz,
  source_type text not null default 'manual' check (source_type in ('manual', 'codex', 'automation', 'system')),
  source_ref text,
  review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(btrim(title)) > 0),
  check (source_type <> 'automation' or source_ref is not null),
  check ((status = 'completed' and completed_at is not null) or (status <> 'completed' and completed_at is null))
);

create index if not exists idx_investment_tasks_user_status on public.investment_tasks(user_id, status, updated_at desc);
create index if not exists idx_investment_tasks_user_reminder on public.investment_tasks(user_id, reminder_date) where reminder_date is not null;

alter table public.investment_tasks enable row level security;

drop policy if exists "users_select_own_investment_tasks" on public.investment_tasks;
create policy "users_select_own_investment_tasks" on public.investment_tasks for select using (auth.uid() = user_id);
drop policy if exists "users_insert_own_investment_tasks" on public.investment_tasks;
create policy "users_insert_own_investment_tasks" on public.investment_tasks for insert with check (auth.uid() = user_id);
drop policy if exists "users_update_own_investment_tasks" on public.investment_tasks;
create policy "users_update_own_investment_tasks" on public.investment_tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users_delete_own_investment_tasks" on public.investment_tasks;
create policy "users_delete_own_investment_tasks" on public.investment_tasks for delete using (auth.uid() = user_id);

grant select, insert, update, delete on table public.investment_tasks to authenticated;
