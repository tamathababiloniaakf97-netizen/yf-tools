// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ client: undefined as unknown }));
const buildResearchReport = vi.hoisted(() => vi.fn(() => ({ meta: { assetName: '腾讯' } })));
const renderResearchPdf = vi.hoisted(() => vi.fn(async () => Buffer.from('%PDF-test')));

vi.mock('@/lib/supabase/server', () => ({ createServerSideClient: vi.fn(async () => state.client) }));
vi.mock('@/lib/investment/research-report', () => ({
  buildResearchReport,
  buildResearchPdfFilename: vi.fn(() => '腾讯-当前公司研究-2026-10-01.pdf'),
}));
vi.mock('@/lib/investment/research-pdf', () => ({ renderResearchPdf }));

import { GET } from './route';

type QueryResult = { data: unknown; error: { message: string } | null };

function query(result: QueryResult, single = false) {
  const api: Record<string, unknown> = {};
  api.select = vi.fn(() => api);
  api.eq = vi.fn(() => api);
  api.order = vi.fn(() => api);
  api.maybeSingle = vi.fn(async () => result);
  api.then = (resolve: (value: QueryResult) => unknown) => Promise.resolve(resolve(result));
  api.insert = vi.fn(); api.update = vi.fn(); api.upsert = vi.fn(); api.delete = vi.fn();
  if (single) delete api.then;
  return api;
}

function client(options: { user?: { id: string } | null; profile?: QueryResult; hypotheses?: QueryResult; evidence?: QueryResult } = {}) {
  const profileQuery = query(options.profile ?? { data: { id: 'profile-1', user_id: 'user-1', asset_name: '腾讯' }, error: null }, true);
  const hypothesisQuery = query(options.hypotheses ?? { data: [], error: null });
  const evidenceQuery = query(options.evidence ?? { data: [], error: null });
  const tables: Record<string, Record<string, unknown>> = { research_profiles: profileQuery, research_hypotheses: hypothesisQuery, evidence_records: evidenceQuery };
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: options.user === undefined ? { id: 'user-1' } : options.user } })) },
    from: vi.fn((table: string) => tables[table]),
    tables,
  };
}

const request = new Request('http://localhost/api/investment/research/profile-1/export');
const context = { params: Promise.resolve({ id: 'profile-1' }) } as RouteContext<'/api/investment/research/[id]/export'>;

describe('company research PDF export route', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('rejects unauthenticated requests', async () => {
    state.client = client({ user: null });
    expect((await GET(request, context)).status).toBe(401);
  });

  it('returns 404 when the ownership-scoped profile is absent', async () => {
    state.client = client({ profile: { data: null, error: null } });
    expect((await GET(request, context)).status).toBe(404);
  });

  it('returns 500 when a related query fails', async () => {
    state.client = client({ hypotheses: { data: null, error: { message: 'query failed' } } });
    expect((await GET(request, context)).status).toBe(500);
  });

  it('queries every table by user ownership and returns a private PDF download', async () => {
    const supabase = client(); state.client = supabase;
    const response = await GET(request, context);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('content-disposition')).toContain("filename*=UTF-8''");
    expect(supabase.tables.research_profiles.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(supabase.tables.research_hypotheses.eq).toHaveBeenCalledWith('research_profile_id', 'profile-1');
    expect(supabase.tables.research_hypotheses.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(supabase.tables.evidence_records.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(supabase.tables.evidence_records.eq).toHaveBeenCalledWith('asset_name', '腾讯');
    for (const table of Object.values(supabase.tables)) {
      expect(table.insert).not.toHaveBeenCalled(); expect(table.update).not.toHaveBeenCalled();
      expect(table.upsert).not.toHaveBeenCalled(); expect(table.delete).not.toHaveBeenCalled();
    }
    expect(buildResearchReport).toHaveBeenCalledOnce();
    expect(renderResearchPdf).toHaveBeenCalledOnce();
  });
});
