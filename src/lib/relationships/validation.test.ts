import { describe, expect, it } from 'vitest';
import { validateContactInput, validateContactInteractionInput } from './validation';

describe('relationship validation', () => {
  it('accepts and trims a manual contact', () => {
    expect(validateContactInput({ name: ' 王律师 ', relationship_type: 'professional', role: ' 律师 ' })).toMatchObject({ ok: true, value: { name: '王律师', role: '律师', review_status: 'approved' } });
  });

  it('rejects blank names, invalid types and reversed dates', () => {
    expect(validateContactInput({ name: ' ', relationship_type: 'friend' }).ok).toBe(false);
    expect(validateContactInput({ name: '甲', relationship_type: 'invalid' as 'friend' }).ok).toBe(false);
    expect(validateContactInput({ name: '甲', relationship_type: 'friend', last_contact_at: '2026-10-10', next_contact_at: '2026-10-01' }).ok).toBe(false);
  });

  it('requires automation provenance and defaults it to pending', () => {
    expect(validateContactInput({ name: '甲', relationship_type: 'work', source_type: 'automation' }).ok).toBe(false);
    expect(validateContactInput({ name: '甲', relationship_type: 'work', source_type: 'automation', source_ref: 'job:1' })).toMatchObject({ ok: true, value: { review_status: 'pending' } });
  });

  it('validates an interaction and its next-contact date', () => {
    expect(validateContactInteractionInput({ occurred_at: '2026-10-01', summary: ' 深入交流 ', next_contact_at: '2026-10-10' })).toMatchObject({ ok: true, value: { summary: '深入交流' } });
    expect(validateContactInteractionInput({ occurred_at: '2026-10-10', summary: '交流', next_contact_at: '2026-10-01' }).ok).toBe(false);
  });
});
