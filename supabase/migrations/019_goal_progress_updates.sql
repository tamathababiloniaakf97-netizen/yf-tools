create table if not exists public.goal_progress_updates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  occurred_at date not null,
  progress_note text not null,
  current_state text not null default '',
  current_milestone text not null default '',
  next_action text not null,
  current_value numeric,
  habit_completed_count integer check (habit_completed_count is null or habit_completed_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_goal_progress_updates_goal_date on public.goal_progress_updates(user_id, goal_id, occurred_at desc, created_at desc);
alter table public.goal_progress_updates enable row level security;
drop policy if exists "users_manage_own_goal_progress_updates" on public.goal_progress_updates;
create policy "users_manage_own_goal_progress_updates" on public.goal_progress_updates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.save_goal_progress(p_goal_id uuid, p_update jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_goal_type text;
  v_progress_id uuid;
begin
  select goal_type into v_goal_type from public.goals where id = p_goal_id and user_id = auth.uid();
  if v_goal_type is null then raise exception 'goal not found'; end if;

  insert into public.goal_progress_updates (
    user_id, goal_id, occurred_at, progress_note, current_state, current_milestone,
    next_action, current_value, habit_completed_count
  ) values (
    auth.uid(), p_goal_id, (p_update->>'occurred_at')::date, p_update->>'progress_note',
    coalesce(p_update->>'current_state', ''), coalesce(p_update->>'current_milestone', ''),
    p_update->>'next_action', nullif(p_update->>'current_value', '')::numeric,
    nullif(p_update->>'habit_completed_count', '')::integer
  ) returning id into v_progress_id;

  update public.goals set
    current_state = case when v_goal_type = 'direction' then coalesce(p_update->>'current_state', '') else current_state end,
    current_milestone = case when v_goal_type = 'project' then coalesce(p_update->>'current_milestone', '') else current_milestone end,
    current_value = case when v_goal_type = 'result' then (p_update->>'current_value')::numeric else current_value end,
    habit_completed_count = case when v_goal_type = 'habit' then (p_update->>'habit_completed_count')::integer else habit_completed_count end,
    next_action = p_update->>'next_action',
    last_progress_at = now(),
    updated_at = now()
  where id = p_goal_id and user_id = auth.uid();

  return v_progress_id;
end;
$$;

grant select, insert, update, delete on public.goal_progress_updates to authenticated;
grant execute on function public.save_goal_progress(uuid, jsonb) to authenticated;
