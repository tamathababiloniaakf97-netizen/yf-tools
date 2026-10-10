-- 可选的手工周期起点与复核价格；不获取行情，不改写旧记录。

alter table public.market_cycle_profiles
  add column if not exists cycle_started_on date,
  add column if not exists cycle_start_price numeric,
  add column if not exists latest_price numeric,
  add column if not exists latest_price_on date,
  add column if not exists return_percent numeric,
  add column if not exists running_days integer,
  drop constraint if exists market_cycle_profiles_start_price_positive,
  add constraint market_cycle_profiles_start_price_positive check (cycle_start_price is null or cycle_start_price > 0),
  drop constraint if exists market_cycle_profiles_latest_price_positive,
  add constraint market_cycle_profiles_latest_price_positive check (latest_price is null or latest_price > 0),
  drop constraint if exists market_cycle_profiles_price_pair,
  add constraint market_cycle_profiles_price_pair check ((latest_price is null) = (latest_price_on is null)),
  drop constraint if exists market_cycle_profiles_date_order,
  add constraint market_cycle_profiles_date_order check (cycle_started_on is null or latest_price_on is null or latest_price_on >= cycle_started_on);

alter table public.market_cycle_reviews
  add column if not exists cycle_started_on date,
  add column if not exists cycle_start_price numeric,
  add column if not exists latest_price numeric,
  add column if not exists latest_price_on date,
  add column if not exists return_percent numeric,
  add column if not exists running_days integer,
  drop constraint if exists market_cycle_reviews_start_price_positive,
  add constraint market_cycle_reviews_start_price_positive check (cycle_start_price is null or cycle_start_price > 0),
  drop constraint if exists market_cycle_reviews_latest_price_positive,
  add constraint market_cycle_reviews_latest_price_positive check (latest_price is null or latest_price > 0),
  drop constraint if exists market_cycle_reviews_price_pair,
  add constraint market_cycle_reviews_price_pair check ((latest_price is null) = (latest_price_on is null)),
  drop constraint if exists market_cycle_reviews_date_order,
  add constraint market_cycle_reviews_date_order check (cycle_started_on is null or latest_price_on is null or latest_price_on >= cycle_started_on);
