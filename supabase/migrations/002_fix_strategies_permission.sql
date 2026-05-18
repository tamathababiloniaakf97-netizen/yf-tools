-- 修复 strategies 表权限
-- schema.sql 中 grant all 在 strategies 建表之前执行，导致新表未授权

grant all on table public.strategies to anon, authenticated;
grant all on table public.strategies to authenticated;
