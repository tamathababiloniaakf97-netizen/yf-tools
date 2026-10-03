-- Supabase SQL Editor 创建的表需要显式授予 authenticated 表权限。
-- RLS 仍然限制每位登录用户只能访问自己的记录；不授予 anon。

grant select, insert, update, delete on table
  public.goals,
  public.projects,
  public.plans,
  public.reminders,
  public.watchlist_items,
  public.research_profiles,
  public.research_hypotheses,
  public.evidence_records,
  public.investment_reviews,
  public.methodology_items
to authenticated;
