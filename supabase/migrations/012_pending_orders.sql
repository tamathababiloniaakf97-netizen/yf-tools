-- 未成交挂单独立于真实交易流水，避免进入现金、成本与净值计算。

create table if not exists public.pending_orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker_id uuid not null references public.tickers(id) on delete cascade,
  category text not null check (category in ('stock', 'option')),
  side text not null check (side in ('buy', 'sell')),
  option_action text check (option_action in ('open', 'close')),
  option_type text check (option_type in ('call', 'put')),
  position_id text,
  quantity numeric not null check (quantity > 0),
  price numeric not null check (price > 0),
  strike_price numeric check (strike_price > 0),
  expiration_date date,
  order_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (category = 'stock' and option_action is null and option_type is null and position_id is null and strike_price is null and expiration_date is null)
    or
    (category = 'option' and option_action is not null and option_type is not null and strike_price is not null and expiration_date is not null)
  ),
  check (category <> 'option' or option_action <> 'close' or position_id is not null)
);

create index if not exists idx_pending_orders_user_date
  on public.pending_orders(user_id, order_date desc, created_at desc);
create index if not exists idx_pending_orders_user_ticker
  on public.pending_orders(user_id, ticker_id);

alter table public.pending_orders enable row level security;

drop policy if exists "users_select_own_pending_orders" on public.pending_orders;
create policy "users_select_own_pending_orders" on public.pending_orders
  for select using (auth.uid() = user_id);
drop policy if exists "users_insert_own_pending_orders" on public.pending_orders;
create policy "users_insert_own_pending_orders" on public.pending_orders
  for insert with check (auth.uid() = user_id);
drop policy if exists "users_update_own_pending_orders" on public.pending_orders;
create policy "users_update_own_pending_orders" on public.pending_orders
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users_delete_own_pending_orders" on public.pending_orders;
create policy "users_delete_own_pending_orders" on public.pending_orders
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on table public.pending_orders to authenticated;

create or replace function public.convert_pending_order(p_order_id uuid, p_trade_date date)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order public.pending_orders%rowtype;
  v_currency text;
  v_transaction_id uuid;
  v_amount_orig numeric;
  v_amount_usd numeric;
  v_position_id text;
  v_open_quantity numeric;
  v_closed_quantity numeric;
begin
  if p_trade_date is null then
    raise exception '成交日期不能为空';
  end if;

  select * into v_order
  from public.pending_orders
  where id = p_order_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception '挂单不存在或无权操作';
  end if;

  select currency into v_currency
  from public.tickers
  where id = v_order.ticker_id and user_id = auth.uid();
  if not found then
    raise exception '标的不存在或无权操作';
  end if;

  if v_order.category = 'stock' then
    v_amount_orig := v_order.quantity * v_order.price;
    v_amount_usd := v_amount_orig * case v_currency when 'USD' then 1 when 'HKD' then 1.0 / 7.8 when 'CNY' then 1.0 / 7.2 else 0 end;
    if v_amount_usd <= 0 then raise exception '不支持的标的币种'; end if;

    insert into public.transactions (
      user_id, ticker_id, type, quantity, price, amount_orig, amount_usd,
      currency, option_detail, note, trade_date
    ) values (
      auth.uid(), v_order.ticker_id, v_order.side, v_order.quantity, v_order.price,
      v_amount_orig, v_amount_usd, v_currency, null, '由挂单成交转入', p_trade_date
    ) returning id into v_transaction_id;
  else
    v_position_id := coalesce(v_order.position_id, 'opt_' || replace(v_order.id::text, '-', ''));

    if v_order.option_action = 'close' then
      select
        coalesce(sum(case when option_detail->>'action' = 'open' then (option_detail->>'quantity')::numeric else 0 end), 0),
        coalesce(sum(case when option_detail->>'action' = 'close' then (option_detail->>'quantity')::numeric else 0 end), 0)
      into v_open_quantity, v_closed_quantity
      from public.transactions
      where user_id = auth.uid()
        and ticker_id = v_order.ticker_id
        and type = 'option_income'
        and option_detail->>'position_id' = v_position_id;

      if v_open_quantity - v_closed_quantity < v_order.quantity then
        raise exception '平仓数量超过剩余合约数';
      end if;
    end if;

    v_amount_usd := v_order.price * v_order.quantity * case when v_order.side = 'sell' then 1 else -1 end;
    insert into public.transactions (
      user_id, ticker_id, type, quantity, price, amount_orig, amount_usd,
      currency, option_detail, note, trade_date
    ) values (
      auth.uid(), v_order.ticker_id, 'option_income', null, null, null, v_amount_usd,
      'USD', jsonb_build_object(
        'direction', v_order.side,
        'type', v_order.option_type,
        'action', v_order.option_action,
        'position_id', v_position_id,
        'quantity', v_order.quantity,
        'price', v_order.price,
        'strike_price', v_order.strike_price,
        'expiration_date', v_order.expiration_date
      ), '由挂单成交转入', p_trade_date
    ) returning id into v_transaction_id;
  end if;

  delete from public.pending_orders where id = v_order.id and user_id = auth.uid();
  return v_transaction_id;
end;
$$;

grant execute on function public.convert_pending_order(uuid, date) to authenticated;
