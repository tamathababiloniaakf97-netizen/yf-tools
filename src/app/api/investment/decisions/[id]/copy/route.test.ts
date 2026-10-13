// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ client: undefined as unknown }));
vi.mock('@/lib/supabase/server', () => ({ createServerSideClient: vi.fn(async () => state.client) }));

import { POST } from './route';

const source = {
  id: 'decision-1', user_id: 'user-1', research_profile_id: 'profile-1', research_snapshot_id: 'snapshot-1', asset_name: '腾讯',
  status: 'finalized', market_expectation: '低增长', personal_divergence: '广告更强', valuation_conclusion: '合理',
  valuation_assumptions: '利润增长', safety_margin: '可接受', investment_plan: '', error_signals: '现金流恶化',
  error_response: '停止加仓', do_not_list: [], decision_type: 'watch', final_reason: '等待价格', decision_date: '2026-10-01',
  source_type: 'manual', source_ref: null, review_status: 'approved', created_at: '2026-10-01', updated_at: '2026-10-02',
};

function client(record = source) {
  let inserted: unknown;
  const query: Record<string, unknown> = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.maybeSingle = vi.fn(async () => ({ data: record, error: null }));
  query.insert = vi.fn((value) => {
    inserted = value;
    return { select: () => ({ single: async () => ({ data: { ...(value as object), id: 'decision-2' }, error: null }) }) };
  });
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } } })) },
    from: vi.fn(() => query), query,
    inserted: () => inserted,
  };
}

const request = new Request('http://localhost/api/investment/decisions/decision-1/copy', { method: 'POST' });
const context = { params: Promise.resolve({ id: 'decision-1' }) };

describe('copy investment decision route', () => {
  beforeEach(() => vi.clearAllMocks());

  it('copies an owned finalized decision into a new draft', async () => {
    const supabase = client(); state.client = supabase;
    const response = await POST(request, context);
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ id: 'decision-2', status: 'draft', decision_date: null, source_ref: 'decision-1' });
    expect(supabase.inserted()).toMatchObject({ user_id: 'user-1', status: 'draft', research_snapshot_id: 'snapshot-1', decision_date: null, source_ref: 'decision-1' });
  });

  it('does not copy a draft decision', async () => {
    state.client = client({ ...source, status: 'draft' });
    expect((await POST(request, context)).status).toBe(409);
  });
});
