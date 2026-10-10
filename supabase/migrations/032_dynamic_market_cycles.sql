alter table public.market_cycle_profiles
  add column if not exists is_active boolean not null default true;

alter table public.market_cycle_profiles
  drop constraint if exists market_cycle_profiles_cycle_key_check;

comment on column public.market_cycle_profiles.is_active is
  'Inactive profiles stay available for historical review snapshots but are hidden from the active workspace.';
