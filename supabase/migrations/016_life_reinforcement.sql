create table if not exists public.life_reinforcement_projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  long_term_goal text not null default '',
  practical_method text not null default '',
  stages jsonb not null default '[]'::jsonb check (jsonb_typeof(stages) = 'array'),
  default_key text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, default_key)
);

create table if not exists public.life_training_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.life_reinforcement_projects(id) on delete cascade,
  trained_on date not null,
  stage_name text not null default '',
  session_goal text not null default '',
  activity text not null,
  result_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_life_projects_user_active on public.life_reinforcement_projects(user_id, is_active, created_at);
create index if not exists idx_life_records_project_date on public.life_training_records(user_id, project_id, trained_on desc, created_at desc);

alter table public.life_reinforcement_projects enable row level security;
alter table public.life_training_records enable row level security;

create policy "users_manage_own_life_projects" on public.life_reinforcement_projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_manage_own_life_records" on public.life_training_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.life_reinforcement_projects, public.life_training_records to authenticated;

create or replace function public.initialize_life_reinforcement_projects()
returns void language plpgsql security invoker set search_path = public as $$
declare current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'not authenticated'; end if;
  insert into public.life_reinforcement_projects
    (user_id, name, long_term_goal, practical_method, stages, default_key, is_default)
  values
    (current_user_id, '表达能力', '让听众能迅速理解并记住重点，而不是追求听起来流利。', '每次先写一句“希望听众记住什么”，再按“结论—两个理由—一个例子—重申结论”完成 3 分钟表达。', '["结构化表达","短视频实战","真实对话"]', 'expression', true),
    (current_user_id, '人际关系', '记住对方的真实近况，并用具体行动延续关系。', '每周选择一位值得维护的联系人，准备一个与对方真实情况有关的问题。', '["记住重要信息","主动联系","深度交流与持续跟进"]', 'relationships', true),
    (current_user_id, '形象管理与审美', '形成对颜色、比例和材质的判断，并建立稳定风格。', '收集并比较适合自己的参考搭配，记录它在颜色、比例、材质和场景上为什么有效。', '["基础整洁","场景穿搭","审美判断与稳定风格"]', 'appearance', true),
    (current_user_id, '组织能力', '把想法转化为可启动、可检查的行动。', '先写出可验证的完成标准，再把第一步缩小为 30 分钟内可启动的动作。', '["明确结果","拆解行动","推进与复盘"]', 'organization', true)
  on conflict (user_id, default_key) do nothing;
end;
$$;

grant execute on function public.initialize_life_reinforcement_projects() to authenticated;
