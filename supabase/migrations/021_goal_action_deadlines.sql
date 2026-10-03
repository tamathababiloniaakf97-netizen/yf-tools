alter table public.goals
  add column if not exists next_action_due_at date;

alter table public.goal_progress_updates
  add column if not exists next_action_due_at date;

create index if not exists idx_goals_user_next_action_due
  on public.goals(user_id, next_action_due_at)
  where status = 'active' and review_status = 'approved';

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
    next_action, next_action_due_at, current_value, habit_completed_count
  ) values (
    auth.uid(), p_goal_id, (p_update->>'occurred_at')::date, p_update->>'progress_note',
    coalesce(p_update->>'current_state', ''), coalesce(p_update->>'current_milestone', ''),
    p_update->>'next_action', (p_update->>'next_action_due_at')::date,
    nullif(p_update->>'current_value', '')::numeric,
    nullif(p_update->>'habit_completed_count', '')::integer
  ) returning id into v_progress_id;

  update public.goals set
    current_state = case when v_goal_type = 'direction' then coalesce(p_update->>'current_state', '') else current_state end,
    current_milestone = case when v_goal_type = 'project' then coalesce(p_update->>'current_milestone', '') else current_milestone end,
    current_value = case when v_goal_type = 'result' then (p_update->>'current_value')::numeric else current_value end,
    habit_completed_count = case when v_goal_type = 'habit' then (p_update->>'habit_completed_count')::integer else habit_completed_count end,
    next_action = p_update->>'next_action',
    next_action_due_at = (p_update->>'next_action_due_at')::date,
    last_progress_at = now(),
    updated_at = now()
  where id = p_goal_id and user_id = auth.uid();

  return v_progress_id;
end;
$$;

grant execute on function public.save_goal_progress(uuid, jsonb) to authenticated;
