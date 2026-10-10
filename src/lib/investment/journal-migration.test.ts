import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('investment journal migration', () => {
  const sql = readFileSync('supabase/migrations/027_investment_journal.sql', 'utf8');

  it('adds lightweight journal fields and backfills old reviews', () => {
    for (const field of ['title', 'journal_type', 'content', 'tags']) expect(sql).toContain(`add column if not exists ${field}`);
    expect(sql).toContain('add column if not exists "references"');
    expect(sql).toContain('begin;');
    expect(sql).toContain('commit;');
    expect(sql).toContain('update public.investment_reviews');
    expect(sql).toContain("'decision_review'");
  });
});
