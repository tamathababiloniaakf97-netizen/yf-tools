begin;

create table if not exists public.cognition_categories (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, is_active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (user_id, name)
);
create table if not exists public.cognition_methods (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.cognition_categories(id), title text not null, content text not null,
  applicable_context text not null default '', evidence_basis text not null default '', action_rule text not null default '', exceptions text not null default '',
  status text not null default 'unverified' check (status in ('unverified','verified','retired')),
  source_journal_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.cognition_journals (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.cognition_categories(id), title text not null, occurred_on date not null, content text not null,
  context text not null default '', tags jsonb not null default '[]', error_tags jsonb not null default '[]', facts text not null default '',
  initial_judgment text not null default '', judgment_basis text not null default '', discovered_error text not null default '',
  counterevidence text not null default '', next_action text not null default '', method_id uuid references public.cognition_methods(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.cognition_methods add constraint cognition_methods_source_journal_fk foreign key (source_journal_id) references public.cognition_journals(id) on delete set null;

alter table public.cognition_categories enable row level security;
alter table public.cognition_journals enable row level security;
alter table public.cognition_methods enable row level security;
grant select, insert, update, delete on table public.cognition_categories, public.cognition_journals, public.cognition_methods to authenticated;
do $$ declare t text; begin foreach t in array array['cognition_categories','cognition_journals','cognition_methods'] loop
  execute format('create policy "users_select_own_%1$s" on public.%1$I for select using (auth.uid() = user_id)', t);
  execute format('create policy "users_insert_own_%1$s" on public.%1$I for insert with check (auth.uid() = user_id)', t);
  execute format('create policy "users_update_own_%1$s" on public.%1$I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  execute format('create policy "users_delete_own_%1$s" on public.%1$I for delete using (auth.uid() = user_id)', t);
end loop; end $$;
commit;
