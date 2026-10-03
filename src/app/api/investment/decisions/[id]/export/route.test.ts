// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ client: undefined as unknown }));
const buildDecisionReport = vi.hoisted(() => vi.fn(() => ({ meta: { assetName: '腾讯' } })));
const renderDecisionPdf = vi.hoisted(() => vi.fn(async () => Buffer.from('%PDF-test')));

vi.mock('@/lib/supabase/server', () => ({ createServerSideClient: vi.fn(async () => state.client) }));
vi.mock('@/lib/investment/decision-report', () => ({
  buildDecisionReport,
  buildDecisionPdfFilename: vi.fn(() => '腾讯-投资决策-2026-10-01.pdf'),
}));
vi.mock('@/lib/investment/decision-pdf', () => ({ renderDecisionPdf }));

import { GET } from './route';

type QueryResult = { data: unknown; error: { message: string } | null };

function query(result: QueryResult) {
  const api: Record<string, unknown> = {};
  api.select = vi.fn(() => api);
  api.eq = vi.fn(() => api);
  api.maybeSingle = vi.fn(async () => result);
  api.insert = vi.fn(); api.update = vi.fn(); api.upsert = vi.fn(); api.delete = vi.fn();
  return api;
}

function client(options: { user?: { id: string } | null; decision?: QueryResult; snapshot?: QueryResult } = {}) {
  const decisionQuery = query(options.decision ?? { data: { id: 'decision-1', user_id: 'user-1', status: 'finalized', asset_name: '腾讯', research_snapshot_id: 'snapshot-1', decision_date: '2026-10-01' }, error: null });
  const snapshotQuery = query(options.snapshot ?? { data: { id: 'snapshot-1', user_id: 'user-1', snapshot_version: 1, snapshot_data: { profile: {}, hypotheses: [] }, evidence_snapshot: [] }, error: null });
  const tables: Record<string, Record<string, unknown>> = { investment_decisions: decisionQuery, research_snapshots: snapshotQuery };
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: options.user === undefined ? { id: 'user-1' } : options.user } })) },
    from: vi.fn((table: string) => tables[table]), tables,
  };
}

const request = new Request('http://localhost/api/investment/decisions/decision-1/export');
const context = { params: Promise.resolve({ id: 'decision-1' }) } as RouteContext<'/api/investment/decisions/[id]/export'>;

describe('investment decision PDF export route', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('rejects unauthenticated requests', async () => {
    state.client = client({ user: null });
    expect((await GET(request, context)).status).toBe(401);
  });

  it('returns 404 when the ownership-scoped decision is absent', async () => {
    state.client = client({ decision: { data: null, error: null } });
    expect((await GET(request, context)).status).toBe(404);
  });

  it('rejects draft decisions without rendering a PDF', async () => {
    state.client = client({ decision: { data: { id: 'decision-1', status: 'draft' }, error: null } });
    expect((await GET(request, context)).status).toBe(409);
    expect(renderDecisionPdf).not.toHaveBeenCalled();
  });

  it('returns 404 when the linked snapshot is absent', async () => {
    state.client = client({ snapshot: { data: null, error: null } });
    expect((await GET(request, context)).status).toBe(404);
  });

  it('scopes both records to the user and returns a private PDF download', async () => {
    const supabase = client(); state.client = supabase;
    const response = await GET(request, context);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('content-disposition')).toContain("filename*=UTF-8''");
    expect(supabase.tables.investment_decisions.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(supabase.tables.research_snapshots.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(supabase.tables.research_snapshots.eq).toHaveBeenCalledWith('id', 'snapshot-1');
    for (const table of Object.values(supabase.tables)) {
      expect(table.insert).not.toHaveBeenCalled(); expect(table.update).not.toHaveBeenCalled();
      expect(table.upsert).not.toHaveBeenCalled(); expect(table.delete).not.toHaveBeenCalled();
    }
    expect(buildDecisionReport).toHaveBeenCalledOnce();
    expect(renderDecisionPdf).toHaveBeenCalledOnce();
  });
});
