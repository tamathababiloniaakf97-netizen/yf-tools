-- 周期可选关联用户自行选择的价格标的；删除标的时保留周期记录。

alter table public.market_cycle_profiles
  add column if not exists ticker_id uuid references public.tickers(id) on delete set null;

create index if not exists market_cycle_profiles_ticker_id_idx
  on public.market_cycle_profiles(ticker_id);
