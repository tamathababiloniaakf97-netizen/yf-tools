alter table public.investment_tasks
  add column if not exists ticker_id uuid references public.tickers(id) on delete set null,
  add column if not exists price numeric;

alter table public.investment_tasks
  drop constraint if exists investment_tasks_price_positive;
alter table public.investment_tasks
  add constraint investment_tasks_price_positive check (price is null or price > 0);

alter table public.investment_tasks
  drop constraint if exists investment_tasks_price_requires_ticker;
alter table public.investment_tasks
  add constraint investment_tasks_price_requires_ticker check (price is null or ticker_id is not null);

create index if not exists idx_investment_tasks_user_price
  on public.investment_tasks(user_id, updated_at desc)
  where price is not null;
