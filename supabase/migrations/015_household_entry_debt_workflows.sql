alter table public.household_ledger_entries
  add column if not exists liability_id uuid references public.household_liabilities(id) on delete restrict,
  add column if not exists transaction_group_id uuid;

alter table public.household_ledger_entries drop constraint if exists household_ledger_entries_kind_check;
alter table public.household_ledger_entries add constraint household_ledger_entries_kind_check check (kind in (
  'business_income','business_expense','business_refund','household_income','household_expense','investment_income',
  'security_buy','security_sell','asset_purchase','asset_sale','loan_drawdown','loan_principal_payment','loan_interest',
  'credit_card_payment','investment_transfer_in','investment_transfer_out','internal_transfer','adjustment'
));

create index if not exists household_ledger_entries_liability_id_idx on public.household_ledger_entries(liability_id);
create index if not exists household_ledger_entries_transaction_group_id_idx on public.household_ledger_entries(transaction_group_id);

create or replace function public.record_household_repayment(
  p_entry_date date, p_liability_id uuid, p_principal numeric, p_interest numeric,
  p_currency text, p_original_principal numeric, p_original_interest numeric, p_fx_rate numeric, p_note text
) returns uuid language plpgsql security invoker set search_path = public as $$
declare v_group_id uuid := uuid_generate_v4();
begin
  if not exists(select 1 from household_liabilities where id=p_liability_id and user_id=auth.uid()) then raise exception '负债不存在或无权操作'; end if;
  if exists(select 1 from household_period_closures where user_id=auth.uid() and period_month=date_trunc('month', p_entry_date)::date and status='closed') then raise exception '该月份已结账，请先重新打开月份'; end if;
  if coalesce(p_principal,0) <= 0 and coalesce(p_interest,0) <= 0 then raise exception '本金和利息至少填写一项'; end if;
  if coalesce(p_principal,0) > 0 then
    insert into household_ledger_entries(user_id,entry_date,kind,amount_cny,currency,original_amount,fx_rate,liability_id,transaction_group_id,note)
    values(auth.uid(),p_entry_date,'loan_principal_payment',p_principal,p_currency,p_original_principal,p_fx_rate,p_liability_id,v_group_id,coalesce(p_note,''));
  end if;
  if coalesce(p_interest,0) > 0 then
    insert into household_ledger_entries(user_id,entry_date,kind,amount_cny,currency,original_amount,fx_rate,liability_id,transaction_group_id,note)
    values(auth.uid(),p_entry_date,'loan_interest',p_interest,p_currency,p_original_interest,p_fx_rate,p_liability_id,v_group_id,coalesce(p_note,''));
  end if;
  return v_group_id;
end $$;
grant execute on function public.record_household_repayment(date,uuid,numeric,numeric,text,numeric,numeric,numeric,text) to authenticated;
