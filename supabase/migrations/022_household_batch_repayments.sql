create or replace function public.record_household_repayments_batch(p_rows jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v jsonb;
  v_type text;
  v_group_id uuid;
  v_groups jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 or jsonb_array_length(p_rows) > 50 then
    raise exception '批量还款数量必须为 1 至 50 行';
  end if;
  for v in select * from jsonb_array_elements(p_rows) loop
    v_type := v->>'repayment_type';
    if not exists(select 1 from household_liabilities where id=(v->>'liability_id')::uuid and user_id=auth.uid()) then raise exception '负债不存在或无权操作'; end if;
    if exists(select 1 from household_period_closures where user_id=auth.uid() and period_month=date_trunc('month',(v->>'entry_date')::date)::date and status='closed') then raise exception '该月份已结账，请先重新打开月份'; end if;
    if v_type in ('mortgage_repayment','credit_loan_repayment') then
      if coalesce((v->>'principal_cny')::numeric,0) < 0 or coalesce((v->>'interest_cny')::numeric,0) < 0 or coalesce((v->>'principal_cny')::numeric,0) + coalesce((v->>'interest_cny')::numeric,0) <= 0 then raise exception '本金和利息至少填写一项正数'; end if;
      v_group_id := public.record_household_repayment((v->>'entry_date')::date,(v->>'liability_id')::uuid,coalesce((v->>'principal_cny')::numeric,0),coalesce((v->>'interest_cny')::numeric,0),coalesce(v->>'currency','CNY'),(v->>'original_principal')::numeric,(v->>'original_interest')::numeric,(v->>'fx_rate')::numeric,coalesce(v->>'note',''));
    elsif v_type = 'credit_card_payment' then
      if coalesce((v->>'amount_cny')::numeric,0) <= 0 then raise exception '信用卡还款金额必须大于 0'; end if;
      v_group_id := gen_random_uuid();
      insert into household_ledger_entries(user_id,entry_date,kind,amount_cny,currency,original_amount,fx_rate,liability_id,transaction_group_id,note)
      values(auth.uid(),(v->>'entry_date')::date,'credit_card_payment',(v->>'amount_cny')::numeric,coalesce(v->>'currency','CNY'),(v->>'original_amount')::numeric,(v->>'fx_rate')::numeric,(v->>'liability_id')::uuid,v_group_id,coalesce(v->>'note',''));
    else raise exception '无效还款类型';
    end if;
    v_groups := v_groups || to_jsonb(v_group_id::text);
  end loop;
  return v_groups;
end $$;

grant execute on function public.record_household_repayments_batch(jsonb) to authenticated;
