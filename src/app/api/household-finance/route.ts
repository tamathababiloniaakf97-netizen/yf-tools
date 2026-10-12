import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { buildHouseholdStatements, periodBounds } from '@/lib/household-finance/statements';
import type { HouseholdLedgerEntry } from '@/types/household-finance';
import { deriveLiabilityBalances } from '@/lib/household-finance/liability-balances';

function latestValues<T extends { snapshot_date: string; value_cny: number; account_id?: string; asset_id?: string; liability_id?: string }>(rows: T[], end: string) {
  const latest = new Map<string, T>();
  rows.filter(row => row.snapshot_date <= end).sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)).forEach(row => {
    const key = row.account_id || row.asset_id || row.liability_id || '';
    latest.set(key, row);
  });
  return [...latest.values()];
}

export async function GET(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const url = new URL(request.url);
  const year = Number(url.searchParams.get('year')) || new Date().getFullYear();
  const mode = (url.searchParams.get('mode') || 'quarter') as 'month' | 'quarter' | 'year';
  const index = Number(url.searchParams.get('index')) || (mode === 'month' ? new Date().getMonth() + 1 : mode === 'quarter' ? Math.floor(new Date().getMonth() / 3) + 1 : 1);
  const bounds = periodBounds(year, mode, index);
  const tables = ['household_finance_settings','household_ledger_entries','household_accounts','household_assets','household_liabilities','household_item_categories','household_account_snapshots','household_asset_snapshots','household_liability_snapshots','household_investment_snapshots','household_period_closures','household_entry_reviews'] as const;
  const results = await Promise.all(tables.map(table => supabase.from(table).select('*').eq('user_id', user.id)));
  const failed = results.find(result => result.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });
  const [settings, entries, accounts, assets, liabilities, categories, accountSnapshots, assetSnapshots, liabilitySnapshots, investments, closures, entryReviews] = results.map(result => result.data ?? []);
  const accountValues = latestValues(accountSnapshots as never[], bounds.end);
  const assetValues = latestValues(assetSnapshots as never[], bounds.end);
  const liabilityBalances = deriveLiabilityBalances(liabilitySnapshots as never[], entries as HouseholdLedgerEntry[], bounds.end);
  const liabilityValues = [...liabilityBalances].map(([liability_id, balance]) => ({ liability_id, snapshot_date: balance.calculated_through_date, value_cny: balance.value_cny }));
  const investment = [...investments].filter(row => row.snapshot_date <= bounds.end).sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date))[0] ?? null;
  const statements = buildHouseholdStatements({ start: bounds.start, end: bounds.end, entries: entries as HouseholdLedgerEntry[], assets: [...accountValues, ...assetValues], liabilities: liabilityValues, investment: investment ? { securities_cny: Number(investment.securities_cny), cash_cny: Number(investment.cash_cny), unrealized_change_cny: 0 } : null });
  return NextResponse.json({ enabled: settings.length > 0, settings: settings[0] ?? null, bounds, entries, accounts, assets, liabilities, categories, accountSnapshots, assetSnapshots, liabilitySnapshots, investment, closures, entryReviews, statements });
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await request.json() as { enabled_date?: string };
  if (!body.enabled_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.enabled_date)) return NextResponse.json({ error: '请选择有效启用日' }, { status: 400 });
  const { error } = await supabase.from('household_finance_settings').upsert({ user_id: user.id, enabled_date: body.enabled_date, entry_review_started_month: `${body.enabled_date.slice(0, 7)}-01`, base_currency: 'CNY', updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const defaultCategories=[
    ['account','现金','cash'],['account','银行卡','bank'],
    ['asset','房产','real_estate'],['asset','车辆','vehicle'],['asset','其他资产','other_asset'],
    ['liability','房贷','mortgage'],['liability','信用贷','credit_loan'],['liability','信用卡','credit_card'],['liability','其他负债','other_liability'],
  ].map(([item_type,name,system_key])=>({user_id:user.id,item_type,name,system_key,is_active:true}));
  const {error:categoryError}=await supabase.from('household_item_categories').upsert(defaultCategories,{onConflict:'user_id,item_type,name',ignoreDuplicates:true});
  if(categoryError)return NextResponse.json({error:categoryError.message},{status:500});
  return NextResponse.json({ success: true });
}
