import type { CognitionJournalInput, CognitionMethodInput } from '@/types/life-os';

const cleanList = (items: string[] | undefined, limit = 8) => [...new Set((items ?? []).map((item) => item.trim()).filter(Boolean))].slice(0, limit);
const clean = (value: string | undefined) => value?.trim() ?? '';

export function normalizeCognitionJournalInput(input: Partial<CognitionJournalInput>) {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push('请填写标题');
  if (!input.occurred_on) errors.push('请选择日期');
  if (!input.category_id?.trim()) errors.push('请选择分类');
  if (!input.content?.trim()) errors.push('请填写正文');
  if (errors.length) return { ok: false as const, errors };
  return { ok: true as const, value: {
    title: clean(input.title), occurred_on: input.occurred_on!, category_id: clean(input.category_id), content: clean(input.content),
    context: clean(input.context), tags: cleanList(input.tags), error_tags: cleanList(input.error_tags), facts: clean(input.facts),
    initial_judgment: clean(input.initial_judgment), judgment_basis: clean(input.judgment_basis), discovered_error: clean(input.discovered_error),
    counterevidence: clean(input.counterevidence), next_action: clean(input.next_action), method_id: input.method_id?.trim() || null,
  } };
}

export function normalizeCognitionMethodInput(input: Partial<CognitionMethodInput>) {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push('请填写标题');
  if (!input.category_id?.trim()) errors.push('请选择分类');
  if (!input.content?.trim()) errors.push('请填写正文');
  if (errors.length) return { ok: false as const, errors };
  return { ok: true as const, value: {
    title: clean(input.title), category_id: clean(input.category_id), content: clean(input.content), applicable_context: clean(input.applicable_context),
    evidence_basis: clean(input.evidence_basis), action_rule: clean(input.action_rule), exceptions: clean(input.exceptions), status: input.status ?? 'unverified',
    source_journal_id: input.source_journal_id?.trim() || null,
  } };
}

export function buildCognitionOverview(journals: Array<{ id: string; occurred_on: string; error_tags: string[]; method_id: string | null }>, methods: Array<{ id: string; status: string }>, now = new Date()) {
  const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30);
  const counts = new Map<string, number>();
  const recentJournals = journals.filter((item) => new Date(`${item.occurred_on}T23:59:59`) >= cutoff);
  recentJournals.forEach((item) => item.error_tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
  return {
    unprocessedJournalIds: recentJournals.filter((item) => !item.method_id).map((item) => item.id),
    unverifiedMethodIds: methods.filter((item) => item.status === 'unverified').map((item) => item.id),
    repeatedErrors: [...counts].filter(([, count]) => count >= 2).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-CN')),
  };
}
