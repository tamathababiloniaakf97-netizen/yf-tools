create table if not exists public.household_item_categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('account','asset','liability')),
  name text not null check (length(trim(name)) > 0),
  system_key text check (system_key in ('cash','bank','real_estate','vehicle','other_asset','mortgage','credit_loan','credit_card','other_liability')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, item_type, name),
  unique(user_id, item_type, system_key)
);

alter table public.household_item_categories enable row level security;
drop policy if exists users_manage_own on public.household_item_categories;
create policy users_manage_own on public.household_item_categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.household_item_categories to authenticated;

insert into public.household_item_categories(user_id,item_type,name,system_key)
select distinct user_id,'account',category,
  case when category='现金' then 'cash' when category='银行卡' then 'bank' end
from public.household_accounts
on conflict(user_id,item_type,name) do nothing;
insert into public.household_item_categories(user_id,item_type,name,system_key)
select distinct user_id,'asset',category,
  case when category='房产' then 'real_estate' when category='车辆' then 'vehicle' end
from public.household_assets
on conflict(user_id,item_type,name) do nothing;
insert into public.household_item_categories(user_id,item_type,name,system_key)
select distinct user_id,'liability',category,
  case when category='房贷' then 'mortgage' when category='信用贷' then 'credit_loan' when category='信用卡' then 'credit_card' end
from public.household_liabilities
on conflict(user_id,item_type,name) do nothing;

with finance_users as (
  select user_id from public.household_finance_settings
  union select user_id from public.household_accounts
  union select user_id from public.household_assets
  union select user_id from public.household_liabilities
), category_defaults(item_type,name,system_key) as (values
  ('account','现金','cash'),('account','银行卡','bank'),
  ('asset','房产','real_estate'),('asset','车辆','vehicle'),('asset','其他资产','other_asset'),
  ('liability','房贷','mortgage'),('liability','信用贷','credit_loan'),('liability','信用卡','credit_card'),('liability','其他负债','other_liability')
)
insert into public.household_item_categories(user_id,item_type,name,system_key)
select finance_users.user_id,category_defaults.item_type,category_defaults.name,category_defaults.system_key
from finance_users cross join category_defaults
on conflict(user_id,item_type,name) do update set system_key=coalesce(household_item_categories.system_key,excluded.system_key);

alter table public.household_accounts add column if not exists category_id uuid references public.household_item_categories(id) on delete restrict;
alter table public.household_assets add column if not exists category_id uuid references public.household_item_categories(id) on delete restrict;
alter table public.household_liabilities add column if not exists category_id uuid references public.household_item_categories(id) on delete restrict;

update public.household_accounts i set category_id=c.id from public.household_item_categories c
where c.user_id=i.user_id and c.item_type='account' and c.name=i.category and i.category_id is null;
update public.household_assets i set category_id=c.id from public.household_item_categories c
where c.user_id=i.user_id and c.item_type='asset' and c.name=i.category and i.category_id is null;
update public.household_liabilities i set category_id=c.id from public.household_item_categories c
where c.user_id=i.user_id and c.item_type='liability' and c.name=i.category and i.category_id is null;

alter table public.household_accounts alter column category_id set not null;
alter table public.household_assets alter column category_id set not null;
alter table public.household_liabilities alter column category_id set not null;

