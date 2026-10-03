alter table public.household_entry_reviews
  add column if not exists checks jsonb not null default '{}'::jsonb;

update public.household_entry_reviews
set checks = jsonb_build_object(
  'business', true,
  'household', true,
  'repayments', true,
  'capital', true,
  'cash_balances', true,
  'liability_balances', true,
  'investment_ready', true
)
where checks = '{}'::jsonb;

alter table public.household_entry_reviews
  drop constraint if exists household_entry_reviews_checks_object;
alter table public.household_entry_reviews
  add constraint household_entry_reviews_checks_object check (jsonb_typeof(checks) = 'object');
