create table if not exists public.portfolio_account_locations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  account_type text not null check (account_type in ('brokerage', 'bank', 'crypto_wallet', 'other')),
  login_url text not null default '',
  login_account text not null default '',
  password_hint text not null default '',
  two_factor_hint text not null default '',
  location_note text not null default '',
  broker_reported_total_usd numeric check (broker_reported_total_usd is null or broker_reported_total_usd >= 0),
  cash_balances jsonb not null default '[]'::jsonb,
  positions jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_portfolio_account_locations_user on public.portfolio_account_locations(user_id, sort_order);

alter table public.portfolio_account_locations enable row level security;
drop policy if exists "users_manage_own_portfolio_account_locations" on public.portfolio_account_locations;
create policy "users_manage_own_portfolio_account_locations" on public.portfolio_account_locations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.save_portfolio_account_locations(p_accounts jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_account jsonb;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if jsonb_typeof(coalesce(p_accounts, '[]'::jsonb)) <> 'array' then raise exception 'accounts must be an array'; end if;

  delete from public.portfolio_account_locations where user_id = auth.uid();
  for v_account in select * from jsonb_array_elements(coalesce(p_accounts, '[]'::jsonb)) loop
    insert into public.portfolio_account_locations (
      user_id, name, account_type, login_url, login_account, password_hint, two_factor_hint,
      location_note, broker_reported_total_usd, cash_balances, positions, sort_order
    ) values (
      auth.uid(), v_account->>'name', v_account->>'account_type', coalesce(v_account->>'login_url', ''),
      coalesce(v_account->>'login_account', ''), coalesce(v_account->>'password_hint', ''),
      coalesce(v_account->>'two_factor_hint', ''), coalesce(v_account->>'location_note', ''),
      nullif(v_account->>'broker_reported_total_usd', '')::numeric,
      coalesce(v_account->'cash_balances', '[]'::jsonb), coalesce(v_account->'positions', '[]'::jsonb),
      coalesce((v_account->>'sort_order')::integer, 0)
    );
  end loop;
end;
$$;

grant select, insert, update, delete on public.portfolio_account_locations to authenticated;
grant execute on function public.save_portfolio_account_locations(jsonb) to authenticated;
