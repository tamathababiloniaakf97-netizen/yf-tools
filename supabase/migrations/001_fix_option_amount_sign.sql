-- ============================================================
-- Migration: 修复期权交易金额符号
-- 规则：BUY 必须 ≤ 0，SELL 必须 ≥ 0
-- ============================================================

-- 修复：BUY 方向但金额为正 → 取反
update public.transactions
set amount_usd = -abs(amount_usd)
where type = 'option_income'
  and option_detail is not null
  and option_detail->>'direction' = 'buy'
  and (amount_usd > 0 or amount_usd is null);

-- 修复：SELL 方向但金额为负 → 取反
update public.transactions
set amount_usd = abs(amount_usd)
where type = 'option_income'
  and option_detail is not null
  and option_detail->>'direction' = 'sell'
  and (amount_usd < 0 or amount_usd is null);

-- 修复：无 direction 但有 option_type 的历史数据
-- option_type = 'buy_put' / 'buy_call' → BUY → 金额必须为负
update public.transactions
set amount_usd = -abs(amount_usd)
where type = 'option_income'
  and option_detail is not null
  and (option_detail->>'direction' is null or option_detail->>'direction' = '')
  and option_detail->>'option_type' like 'buy_%'
  and (amount_usd > 0 or amount_usd is null);

-- option_type = 'sell_put' / 'sell_call' → SELL → 金额必须为正
update public.transactions
set amount_usd = abs(amount_usd)
where type = 'option_income'
  and option_detail is not null
  and (option_detail->>'direction' is null or option_detail->>'direction' = '')
  and option_detail->>'option_type' like 'sell_%'
  and (amount_usd < 0 or amount_usd is null);
