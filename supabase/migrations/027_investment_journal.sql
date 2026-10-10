begin;

alter table public.investment_reviews
  add column if not exists title text,
  add column if not exists journal_type text not null default 'decision_review',
  add column if not exists content text,
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists "references" jsonb not null default '[]'::jsonb;

update public.investment_reviews
set
  title = coalesce(nullif(title, ''), case when asset_name <> '' then asset_name || '投资复盘' else '投资复盘' end),
  content = coalesce(nullif(content, ''), concat_ws(E'\n\n',
    case when original_reason <> '' then '【当初依据】' || E'\n' || original_reason end,
    case when actual_result <> '' then '【实际结果】' || E'\n' || actual_result end,
    case when correct_points <> '' then '【做对了】' || E'\n' || correct_points end,
    case when mistake_points <> '' then '【需要改进】' || E'\n' || mistake_points end,
    case when lesson <> '' then '【复盘结论】' || E'\n' || lesson end
  ));

alter table public.investment_reviews
  alter column title set not null,
  alter column content set not null,
  alter column asset_name set default '',
  alter column decision_type set default 'hold',
  alter column original_reason set default '',
  alter column lesson set default '';

alter table public.investment_reviews drop constraint if exists investment_reviews_journal_type_check;
alter table public.investment_reviews add constraint investment_reviews_journal_type_check
  check (journal_type in ('decision_review', 'missed_opportunity', 'investment_note'));
alter table public.investment_reviews drop constraint if exists investment_reviews_tags_array_check;
alter table public.investment_reviews add constraint investment_reviews_tags_array_check
  check (jsonb_typeof(tags) = 'array' and jsonb_array_length(tags) <= 8);
alter table public.investment_reviews drop constraint if exists investment_reviews_references_array_check;
alter table public.investment_reviews add constraint investment_reviews_references_array_check
  check (jsonb_typeof("references") = 'array' and jsonb_array_length("references") <= 12);

create index if not exists idx_investment_reviews_user_journal_type
  on public.investment_reviews(user_id, journal_type, review_date desc);

commit;
