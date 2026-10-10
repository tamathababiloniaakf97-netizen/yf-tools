create table if not exists public.market_cycle_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_key text not null,
  name text not null,
  is_active boolean not null default true,
  current_phase text not null default '',
  confidence text check (confidence is null or confidence in ('low', 'medium', 'high')),
  summary text not null default '',
  support_evidence text not null default '',
  counter_evidence text not null default '',
  uncertainties text not null default '',
  last_reviewed_at date,
  next_review_at date,
  review_frequency_days integer not null check (review_frequency_days > 0),
  indicators jsonb not null default '[]'::jsonb check (jsonb_typeof(indicators) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cycle_key)
);

create table if not exists public.market_cycle_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.market_cycle_profiles(id) on delete cascade,
  reviewed_on date not null default current_date,
  phase text not null,
  confidence text check (confidence is null or confidence in ('low', 'medium', 'high')),
  summary text not null,
  support_evidence text not null default '',
  counter_evidence text not null default '',
  uncertainties text not null default '',
  next_review_at date not null,
  indicators jsonb not null default '[]'::jsonb check (jsonb_typeof(indicators) = 'array'),
  created_at timestamptz not null default now()
);

create index if not exists market_cycle_reviews_profile_date_idx on public.market_cycle_reviews(profile_id, reviewed_on desc);

alter table public.market_cycle_profiles enable row level security;
alter table public.market_cycle_reviews enable row level security;

drop policy if exists "market cycle profiles are owned" on public.market_cycle_profiles;
create policy "market cycle profiles are owned" on public.market_cycle_profiles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "market cycle reviews are readable by owner" on public.market_cycle_reviews;
create policy "market cycle reviews are readable by owner" on public.market_cycle_reviews for select to authenticated using (auth.uid() = user_id);
drop policy if exists "market cycle reviews are insertable by owner" on public.market_cycle_reviews;
create policy "market cycle reviews are insertable by owner" on public.market_cycle_reviews for insert to authenticated with check (auth.uid() = user_id);

grant select, insert, update, delete on public.market_cycle_profiles to authenticated;
grant select, insert on public.market_cycle_reviews to authenticated;
