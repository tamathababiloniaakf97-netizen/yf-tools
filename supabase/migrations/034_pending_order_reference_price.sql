-- 参考价格只用于待成交股票挂单的比较，不参与转流水。
alter table public.pending_orders
  add column if not exists reference_price numeric;

alter table public.pending_orders
  drop constraint if exists pending_orders_reference_price_positive;
alter table public.pending_orders
  add constraint pending_orders_reference_price_positive
  check (reference_price is null or reference_price > 0);

alter table public.pending_orders
  drop constraint if exists pending_orders_stock_reference_price_only;
alter table public.pending_orders
  add constraint pending_orders_stock_reference_price_only
  check (category = 'stock' or reference_price is null);
