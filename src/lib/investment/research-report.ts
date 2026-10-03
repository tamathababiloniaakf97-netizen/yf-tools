import type { EvidenceRecord, ResearchField, ResearchHypothesis, ResearchMaterial, ResearchProfile } from '@/types/life-os';

export interface ResearchReportInput {
  profile: ResearchProfile;
  hypotheses: ResearchHypothesis[];
  evidence: EvidenceRecord[];
  materials?: ResearchMaterial[];
  exportedAt: string;
}

export interface ResearchReport {
  meta: { assetName: string; status: '当前研究' | '研究进行中'; updatedAt: string; exportedAt: string };
  summary: Array<{ label: string; value: string }>;
  sections: Array<{ label: string; value: string }>;
  checklist: Array<{ label: string; statusLabel: string; note: string }>;
  hypotheses: Array<{ id: string; statement: string; keyVariables: string; statusLabel: string; nextCheckAt: string | null }>;
  evidence: Array<{ content: string; impactLabel: string; sourceName: string; sourceUrl: string | null; occurredAt: string | null; hypothesisStatement: string | null }>;
  currentResearchCitations: Array<{ fieldLabel: string; items: Array<{ title: string; excerpt: string; impactLabel: string; sourceName: string; sourceDate: string | null; personalNote: string }> }>;
  gaps: { missingCoreFields: string[]; unresolvedHypothesisCount: number; evidenceWithoutSourceCount: number };
}

const coreFields: Array<[keyof ResearchProfile, string]> = [
  ['business_model', '业务模式'],
  ['customer_value', '客户价值'],
  ['competitive_advantage', '竞争优势'],
  ['long_term_assumptions', '长期关键假设'],
  ['invalidation_conditions', '判断失效条件'],
  ['earnings_quality', '盈利质量'],
];

const hypothesisLabels: Record<ResearchHypothesis['status'], string> = {
  unverified: '未验证', supported: '支持', challenged: '受到挑战', inconclusive: '结论不明确',
};
const impactLabels: Record<EvidenceRecord['impact'], string> = {
  support: '支持', challenge: '挑战', mixed: '混合', neutral: '中性',
};
const checklistLabels = { considered: '已考虑', not_applicable: '不适用', needs_validation: '需要验证' } as const;
const researchFieldLabels: Record<ResearchField, string> = {
  business_model: '业务模式', customer_value: '客户价值', competitive_advantage: '竞争优势', long_term_assumptions: '长期关键假设',
  invalidation_conditions: '判断失效条件', earnings_quality: '盈利质量', management_culture: '管理层与文化',
  current_judgment: '当前判断', risks: '主要风险', unknowns: '仍不知道的事项', investment_thesis: '投资逻辑',
};

function valueOf(profile: ResearchProfile, key: keyof ResearchProfile) {
  const value = profile[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function buildResearchReport({ profile, hypotheses, evidence, materials = [], exportedAt }: ResearchReportInput): ResearchReport {
  const missingCoreFields = coreFields.filter(([key]) => !valueOf(profile, key)).map(([, label]) => label);
  const hypothesisById = new Map(hypotheses.map((item) => [item.id, item.statement]));
  const materialById = new Map(materials.map((item) => [item.id, item]));
  const orderedEvidence = evidence.map((item, index) => ({ item, index })).sort((left, right) => {
    const leftTime = Date.parse(left.item.occurred_at || left.item.created_at) || 0;
    const rightTime = Date.parse(right.item.occurred_at || right.item.created_at) || 0;
    return rightTime - leftTime || left.index - right.index;
  });

  const currentResearchCitations = Object.entries(researchFieldLabels).map(([field, fieldLabel]) => ({
    fieldLabel,
    items: orderedEvidence.filter(({ item }) => item.research_field === field && item.material_id && materialById.has(item.material_id)).map(({ item }) => {
      const material = materialById.get(item.material_id!)!;
      return { title: material.title, excerpt: item.content, impactLabel: impactLabels[item.impact], sourceName: material.source_name ?? '', sourceDate: material.source_date, personalNote: material.personal_note ?? '' };
    }),
  })).filter((group) => group.items.length);

  return {
    meta: { assetName: profile.asset_name, status: missingCoreFields.length ? '研究进行中' : '当前研究', updatedAt: profile.updated_at, exportedAt },
    summary: [
      ['当前判断', profile.current_judgment], ['投资逻辑', profile.investment_thesis],
      ['主要风险', profile.risks], ['判断失效条件', profile.invalidation_conditions],
    ].map(([label, value]) => ({ label, value: value.trim() })).filter((item) => item.value),
    sections: [
      ['业务模式', profile.business_model], ['客户价值', profile.customer_value],
      ['竞争优势', profile.competitive_advantage], ['长期关键假设', profile.long_term_assumptions],
      ['盈利质量', profile.earnings_quality], ['管理层与文化', profile.management_culture],
      ['仍不知道的事项', profile.unknowns],
    ].map(([label, value]) => ({ label, value: value.trim() })).filter((item) => item.value),
    checklist: Object.entries(profile.checklist_state ?? {}).filter(([, item]) => Boolean(item.note.trim()) || item.status !== 'needs_validation').map(([key, item]) => ({
      label: key.replaceAll('_', ' '), statusLabel: checklistLabels[item.status], note: item.note.trim(),
    })),
    hypotheses: hypotheses.map((item) => ({ id: item.id, statement: item.statement, keyVariables: item.key_variables, statusLabel: hypothesisLabels[item.status], nextCheckAt: item.next_check_at })),
    evidence: orderedEvidence.filter(({ item }) => !item.research_field).map(({ item }) => ({
      content: item.content, impactLabel: impactLabels[item.impact], sourceName: item.source_name.trim(), sourceUrl: item.source_url,
      occurredAt: item.occurred_at, hypothesisStatement: item.hypothesis_id ? hypothesisById.get(item.hypothesis_id) ?? null : null,
    })),
    currentResearchCitations,
    gaps: {
      missingCoreFields,
      unresolvedHypothesisCount: hypotheses.filter((item) => item.status === 'unverified' || item.status === 'inconclusive' || item.status === 'challenged').length,
      evidenceWithoutSourceCount: evidence.filter((item) => !item.source_name.trim() && !item.source_url?.trim()).length,
    },
  };
}

export function buildResearchPdfFilename(assetName: string, exportedAt: Date) {
  const safeName = assetName.replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '-').replace(/-+/g, '-').replace(/^[ .-]+|[ .-]+$/g, '') || '公司';
  const year = exportedAt.getFullYear();
  const month = String(exportedAt.getMonth() + 1).padStart(2, '0');
  const day = String(exportedAt.getDate()).padStart(2, '0');
  return `${safeName}-当前公司研究-${year}-${month}-${day}.pdf`;
}
