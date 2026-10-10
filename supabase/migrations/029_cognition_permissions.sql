begin;

-- RLS 决定已登录用户可以访问哪些行；GRANT 决定该角色能否访问这些表。
-- 028 已在部分环境执行，因此单独补权限，避免重复创建策略。
grant select, insert, update, delete on table
  public.cognition_categories,
  public.cognition_journals,
  public.cognition_methods
to authenticated;

commit;
