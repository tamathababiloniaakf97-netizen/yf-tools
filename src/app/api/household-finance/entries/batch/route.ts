import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { assertHouseholdPeriodEditable } from '@/lib/household-finance/period-lock';
import { validateLedgerEntry } from '@/lib/household-finance/validation';
import type { HouseholdEntryKind, HouseholdLedgerEntry } from '@/types/household-finance';

const batchKinds = new Set<HouseholdEntryKind>([
  'business_income', 'business_expense', 'business_refund', 'household_income', 'household_expense',
]);

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await request.json() as { entries?: Partial<HouseholdLedgerEntry>[] };
  if (!Array.isArray(body.entries) || body.entries.length === 0) return NextResponse.json({ error: '请至少填写一行' }, { status: 400 });
  if (body.entries.length > 50) return NextResponse.json({ error: '一次最多保存 50 行' }, { status: 400 });

  const rows: HouseholdLedgerEntry[] = [];
  for (const [index, entry] of body.entries.entries()) {
    const validation = validateLedgerEntry(entry);
    if (!validation.ok) return NextResponse.json({ error: `第 ${index + 1} 行：${validation.error}` }, { status: 400 });
    if (!batchKinds.has(validation.value.kind)) return NextResponse.json({ error: `第 ${index + 1} 行：该类型不支持批量录入` }, { status: 400 });
    rows.push(validation.value);
  }

  const { data: closures, error: closureError } = await supabase.from('household_period_closures').select('period_month,status').eq('user_id', user.id);
  if (closureError) return NextResponse.json({ error: closureError.message }, { status: 500 });
  for (const [index, row] of rows.entries()) {
    const editable = assertHouseholdPeriodEditable(row.entry_date, closures ?? []);
    if (!editable.ok) return NextResponse.json({ error: `第 ${index + 1} 行：${editable.error}` }, { status: 409 });
  }

  const { data, error } = await supabase.from('household_ledger_entries').insert(rows.map((row) => ({ ...row, user_id: user.id }))).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
