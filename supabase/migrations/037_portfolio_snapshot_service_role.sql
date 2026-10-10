grant select on public.portfolio_openings to service_role;
grant select on public.portfolio_opening_positions to service_role;
grant select on public.transactions to service_role;
grant select, update on public.tickers to service_role;
grant select, insert, update on public.nav_history to service_role;
grant select, insert, update, delete on public.portfolio_position_snapshots to service_role;
