-- 用更明确的假设生命周期替代含义重叠的“结论不明确”。
update public.research_hypotheses
set status = 'unverified'
where status = 'inconclusive';

alter table public.research_hypotheses
  drop constraint if exists research_hypotheses_status_check;

alter table public.research_hypotheses
  add constraint research_hypotheses_status_check
  check (status in ('unverified', 'supported', 'challenged', 'not_applicable'));
