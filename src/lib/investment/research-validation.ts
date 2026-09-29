import { researchChecklistStatuses, researchHypothesisStatuses } from '@/types/life-os';
import type { ResearchChecklistState, ResearchHypothesisInput, ResearchProfileInput } from '@/types/life-os';

const textFields = [
  'investment_thesis', 'current_judgment', 'risks', 'invalidation_conditions',
  'business_model', 'customer_value', 'competitive_advantage', 'long_term_assumptions',
  'earnings_quality', 'management_culture', 'unknowns',
] as const;

function normalizeChecklist(input?: ResearchChecklistState): ResearchChecklistState {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  return Object.fromEntries(Object.entries(input).flatMap(([key, item]) => {
    if (!item || !researchChecklistStatuses.includes(item.status)) return [];
    return [[key, { status: item.status, note: String(item.note ?? '').trim() }]];
  }));
}

export function normalizeResearchProfileInput(input: ResearchProfileInput) {
  const assetName = input.asset_name?.trim();
  const errors: string[] = [];
  if (!assetName) errors.push('请填写公司或标的名称');
  if (input.source_type === 'automation' && !input.source_ref?.trim()) errors.push('自动化写入必须保留来源标识');
  if (errors.length) return { ok: false as const, errors };
  const normalized = Object.fromEntries(textFields.map((field) => [field, String(input[field] ?? '').trim()]));
  return {
    ok: true as const,
    value: {
      ...input,
      ...normalized,
      asset_name: assetName,
      ticker_id: input.ticker_id ?? null,
      checklist_state: normalizeChecklist(input.checklist_state),
      source_type: input.source_type ?? 'manual',
      source_ref: input.source_ref?.trim() || null,
      review_status: input.review_status ?? (input.source_type === 'automation' ? 'pending' : 'approved'),
    },
  };
}

const snapshotRequirements: Array<[keyof ResearchProfileInput, string]> = [
  ['business_model', '请回答：公司靠什么生意挣钱'],
  ['customer_value', '请回答：为什么客户持续付钱'],
  ['competitive_advantage', '请回答：为什么竞争者难以抢走'],
  ['long_term_assumptions', '请回答：五年后继续挣钱依赖哪些关键假设'],
  ['invalidation_conditions', '请回答：什么事实出现会证明判断错误'],
  ['earnings_quality', '请回答：挣到的钱质量如何'],
];

export function validateResearchSnapshotCore(input: ResearchProfileInput) {
  const errors = snapshotRequirements.flatMap(([field, message]) => String(input[field] ?? '').trim() ? [] : [message]);
  return { ok: errors.length === 0, errors };
}

export function normalizeHypothesisInput(input: ResearchHypothesisInput) {
  const errors: string[] = [];
  const statement = input.statement?.trim();
  if (!statement) errors.push('请填写假设内容');
  if (input.status && !researchHypothesisStatuses.includes(input.status)) errors.push('假设状态无效');
  if (errors.length) return { ok: false as const, errors };
  return {
    ok: true as const,
    value: {
      statement,
      key_variables: input.key_variables?.trim() ?? '',
      status: input.status ?? 'unverified',
      next_check_at: input.next_check_at || null,
    },
  };
}
