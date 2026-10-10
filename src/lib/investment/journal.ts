import type { InvestmentJournalInput, InvestmentJournalReference, InvestmentJournalType, InvestmentReferenceType } from '@/types/life-os';

const journalTypes = new Set<InvestmentJournalType>(['decision_review', 'missed_opportunity', 'investment_note']);
const referenceTypes = new Set<InvestmentReferenceType>(['decision', 'research', 'hypothesis', 'material', 'journal']);

export function normalizeInvestmentJournalInput(input: Partial<InvestmentJournalInput>) {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push('请填写标题');
  if (!input.review_date) errors.push('请选择日期');
  if (!input.content?.trim()) errors.push('请填写正文');
  if (input.journal_type && !journalTypes.has(input.journal_type)) errors.push('请选择有效类型');
  if (errors.length) return { ok: false as const, errors };

  const tags = [...new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean))].slice(0, 8);
  const references = (input.references ?? []).flatMap((reference) => {
    const clean = normalizeReference(reference);
    return clean ? [clean] : [];
  }).slice(0, 12);

  return { ok: true as const, value: {
    title: input.title!.trim(),
    journal_type: input.journal_type ?? 'investment_note',
    review_date: input.review_date!,
    content: input.content!.trim(),
    asset_name: input.asset_name?.trim() ?? '',
    tags,
    references,
    decision_id: input.decision_id?.trim() || null,
    source_type: input.source_type ?? 'manual',
    source_ref: input.source_ref?.trim() || null,
    review_status: input.review_status ?? (input.source_type === 'automation' ? 'pending' : 'approved'),
  } };
}

function normalizeReference(reference: InvestmentJournalReference) {
  if (!referenceTypes.has(reference.type) || !reference.id?.trim() || !reference.title?.trim() || !reference.href?.startsWith('/investment/')) return null;
  return { type: reference.type, id: reference.id.trim(), title: reference.title.trim(), href: reference.href.trim() };
}

export function journalContent(item: { content?: string; original_reason?: string; actual_result?: string; correct_points?: string; mistake_points?: string; lesson?: string }) {
  if (item.content?.trim()) return item.content.trim();
  return [
    ['当初依据', item.original_reason], ['实际结果', item.actual_result], ['做对了', item.correct_points],
    ['需要改进', item.mistake_points], ['复盘结论', item.lesson],
  ].filter(([, value]) => value?.trim()).map(([label, value]) => `【${label}】\n${value!.trim()}`).join('\n\n');
}

export function filterInvestmentJournals<T extends { title: string; content: string; asset_name?: string; tags?: string[]; journal_type: string }>(items: T[], query: string, type: InvestmentJournalType | 'all') {
  const term = query.trim().toLocaleLowerCase();
  return items.filter((item) => {
    if (type !== 'all' && item.journal_type !== type) return false;
    if (!term) return true;
    return [item.title, item.content, item.asset_name ?? '', ...(item.tags ?? [])].join('\n').toLocaleLowerCase().includes(term);
  });
}
