-- 年度目标真实进展字段与私人关系跟进模块。
-- 仅新增字段和表，不修改现有持仓、交易或投资研究数据。

alter table public.goals
  add column if not exists goal_type text not null default 'direction'
    check (goal_type in ('result', 'project', 'habit', 'direction')),
  add column if not exists completion_criteria text not null default '',
  add column if not exists current_state text not null default '',
  add column if not exists current_milestone text not null default '',
  add column if not exists next_action text not null default '',
  add column if not exists target_value numeric,
  add column if not exists current_value numeric,
  add column if not exists value_unit text not null default '',
  add column if not exists habit_target_count integer check (habit_target_count > 0),
  add column if not exists habit_completed_count integer check (habit_completed_count >= 0),
  add column if not exists habit_period text check (habit_period in ('weekly', 'monthly', 'quarterly')),
  add column if not exists last_progress_at timestamptz;

create table if not exists public.contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relationship_type text not null check (relationship_type in ('family', 'friend', 'work', 'professional', 'other')),
  role text not null default '',
  met_context text not null default '',
  family_context text not null default '',
  work_context text not null default '',
  important_notes text not null default '',
  last_contact_at date,
  next_contact_at date,
  next_action text not null default '',
  notes text not null default '',
  source_type text not null default 'manual' check (source_type in ('manual', 'codex', 'automation', 'system')),
  source_ref text,
  review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_type <> 'automation' or source_ref is not null),
  check (next_contact_at is null or last_contact_at is null or next_contact_at >= last_contact_at)
);

create table if not exists public.contact_interactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  occurred_at date not null,
  summary text not null,
  next_action text not null default '',
  next_contact_at date,
  source_type text not null default 'manual' check (source_type in ('manual', 'codex', 'automation', 'system')),
  source_ref text,
  review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  check (source_type <> 'automation' or source_ref is not null),
  check (next_contact_at is null or next_contact_at >= occurred_at)
);

create index if not exists idx_contacts_user_next_contact on public.contacts(user_id, next_contact_at);
create index if not exists idx_contacts_user_recent on public.contacts(user_id, last_contact_at desc);
create index if not exists idx_contact_interactions_user_contact on public.contact_interactions(user_id, contact_id, occurred_at desc);

create or replace function public.apply_contact_interaction()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.contacts
  set last_contact_at = new.occurred_at,
      next_action = new.next_action,
      next_contact_at = new.next_contact_at,
      updated_at = now()
  where id = new.contact_id and user_id = new.user_id;
  if not found then
    raise exception 'contact not found for user';
  end if;
  return new;
end;
$$;

drop trigger if exists contact_interactions_apply_to_contact on public.contact_interactions;
create trigger contact_interactions_apply_to_contact
  after insert on public.contact_interactions
  for each row execute function public.apply_contact_interaction();

alter table public.contacts enable row level security;
alter table public.contact_interactions enable row level security;

drop policy if exists "users_select_own_contacts" on public.contacts;
create policy "users_select_own_contacts" on public.contacts for select using (auth.uid() = user_id);
drop policy if exists "users_insert_own_contacts" on public.contacts;
create policy "users_insert_own_contacts" on public.contacts for insert with check (auth.uid() = user_id);
drop policy if exists "users_update_own_contacts" on public.contacts;
create policy "users_update_own_contacts" on public.contacts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users_delete_own_contacts" on public.contacts;
create policy "users_delete_own_contacts" on public.contacts for delete using (auth.uid() = user_id);

drop policy if exists "users_select_own_contact_interactions" on public.contact_interactions;
create policy "users_select_own_contact_interactions" on public.contact_interactions for select using (auth.uid() = user_id);
drop policy if exists "users_insert_own_contact_interactions" on public.contact_interactions;
create policy "users_insert_own_contact_interactions" on public.contact_interactions for insert with check (auth.uid() = user_id);
drop policy if exists "users_update_own_contact_interactions" on public.contact_interactions;
create policy "users_update_own_contact_interactions" on public.contact_interactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users_delete_own_contact_interactions" on public.contact_interactions;
create policy "users_delete_own_contact_interactions" on public.contact_interactions for delete using (auth.uid() = user_id);

grant select, insert, update, delete on table public.contacts, public.contact_interactions to authenticated;
