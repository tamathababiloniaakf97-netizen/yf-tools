create table if not exists public.portfolio_openings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  opening_date date not null,
  opening_cash numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_opening_positions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker_id uuid not null references public.tickers(id) on delete cascade,
  quantity numeric not null check (quantity > 0),
  total_cost_usd numeric not null check (total_cost_usd >= 0),
  opening_market_value_usd numeric not null check (opening_market_value_usd >= 0),
  unique(user_id, ticker_id)
);

alter table public.portfolio_openings enable row level security;
alter table public.portfolio_opening_positions enable row level security;

drop policy if exists "users_manage_own_portfolio_opening" on public.portfolio_openings;
create policy "users_manage_own_portfolio_opening" on public.portfolio_openings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users_manage_own_portfolio_opening_positions" on public.portfolio_opening_positions;
create policy "users_manage_own_portfolio_opening_positions" on public.portfolio_opening_positions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.portfolio_openings to authenticated;
grant select, insert, update, delete on public.portfolio_opening_positions to authenticated;

create or replace function public.save_portfolio_opening(
  p_opening_date date,
  p_opening_cash numeric,
  p_positions jsonb
) returns void
language plpgsql security invoker set search_path = public
as $$
declare
  v_position jsonb;
begin
  insert into public.portfolio_openings(user_id, opening_date, opening_cash, updated_at)
  values (auth.uid(), p_opening_date, p_opening_cash, now())
  on conflict (user_id) do update set opening_date = excluded.opening_date, opening_cash = excluded.opening_cash, updated_at = now();

  delete from public.portfolio_opening_positions where user_id = auth.uid();
  for v_position in select * from jsonb_array_elements(coalesce(p_positions, '[]'::jsonb)) loop
    if not exists (select 1 from public.tickers where id = (v_position->>'ticker_id')::uuid and user_id = auth.uid()) then
      raise exception '期初持仓标的不存在或无权操作';
    end if;
    insert into public.portfolio_opening_positions(user_id, ticker_id, quantity, total_cost_usd, opening_market_value_usd)
    values (auth.uid(), (v_position->>'ticker_id')::uuid, (v_position->>'quantity')::numeric,
      (v_position->>'total_cost_usd')::numeric, (v_position->>'opening_market_value_usd')::numeric);
  end loop;
end;
$$;

grant execute on function public.save_portfolio_opening(date, numeric, jsonb) to authenticated;
