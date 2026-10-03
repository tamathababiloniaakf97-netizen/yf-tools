-- 人生工作台核心数据：目标、项目、计划、提醒。
-- 只新增对象，不修改现有持仓、交易、净值和策略数据。

create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  year integer not null,
  description text not null default '',
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'cancelled')),
  source_type text not null default 'manual' check (source_type in ('manual', 'codex', 'automation', 'system')),
  source_ref text,
  review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  title text not null,
  description text not null default '',
  quarter smallint check (quarter between 1 and 4),
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'cancelled')),
  source_type text not null default 'manual' check (source_type in ('manual', 'codex', 'automation', 'system')),
  source_ref text,
  review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text not null default '',
  plan_type text not null check (plan_type in ('validation', 'research', 'trade', 'action', 'decision', 'life')),
  domain text not null check (domain in ('investment', 'annual_goal', 'life')),
  start_date date,
  due_date date,
  reminder_at timestamptz,
  recurrence_rule text,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed', 'paused', 'overdue', 'cancelled')),
  is_weekly_focus boolean not null default false,
  notes text not null default '',
  source_type text not null default 'manual' check (source_type in ('manual', 'codex', 'automation', 'system')),
  source_ref text,
  review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_date is null or start_date is null or due_date >= start_date),
  check (source_type <> 'automation' or source_ref is not null)
);

create table if not exists public.reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  remind_at timestamptz not null,
  recurrence_rule text,
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'dismissed', 'failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (plan_id, remind_at)
);

create index if not exists idx_goals_user_year on public.goals(user_id, year desc);
create index if not exists idx_projects_user_goal on public.projects(user_id, goal_id);
create index if not exists idx_plans_user_status_due on public.plans(user_id, status, due_date);
create index if not exists idx_plans_user_domain on public.plans(user_id, domain);
create index if not exists idx_reminders_user_due on public.reminders(user_id, status, remind_at);

create or replace function public.enforce_weekly_focus_limit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_weekly_focus and new.status not in ('completed', 'cancelled') then
    if (
      select count(*) from public.plans
      where user_id = new.user_id
        and is_weekly_focus = true
        and status not in ('completed', 'cancelled')
        and id <> new.id
    ) >= 3 then
      raise exception 'weekly focus limit exceeded';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists plans_weekly_focus_limit on public.plans;
create trigger plans_weekly_focus_limit
  before insert or update of is_weekly_focus, status on public.plans
  for each row execute function public.enforce_weekly_focus_limit();

alter table public.goals enable row level security;
alter table public.projects enable row level security;
alter table public.plans enable row level security;
alter table public.reminders enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['goals', 'projects', 'plans', 'reminders'] loop
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
