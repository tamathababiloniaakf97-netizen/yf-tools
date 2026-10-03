alter table public.evidence_records
  add column if not exists research_field text;

alter table public.evidence_records
  drop constraint if exists evidence_records_research_field_check;

alter table public.evidence_records
  add constraint evidence_records_research_field_check check (
    research_field is null or research_field in (
      'business_model', 'customer_value', 'competitive_advantage',
      'long_term_assumptions', 'invalidation_conditions', 'earnings_quality',
      'management_culture', 'current_judgment', 'risks', 'unknowns', 'investment_thesis'
    )
  );

create index if not exists idx_evidence_research_field
  on public.evidence_records(user_id, asset_name, research_field)
  where research_field is not null;
