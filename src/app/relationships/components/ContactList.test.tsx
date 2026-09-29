import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Contact } from '@/types/life-os';
import ContactList from './ContactList';

function contact(id: string, overrides: Partial<Contact> = {}): Contact {
  return { id, user_id: 'u1', name: id, relationship_type: 'friend', role: '', met_context: '', family_context: '', work_context: '', important_notes: '', birthday_calendar: null, birthday_year: null, birthday_month: null, birthday_day: null, birthday_is_leap_month: false, birthday_reminder_enabled: true, holiday_contact_reminder_enabled: false, last_contact_at: null, next_contact_at: null, next_action: '', notes: '', source_type: 'manual', source_ref: null, review_status: 'approved', created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', ...overrides };
}

describe('ContactList', () => {
  it('separates due follow-ups while keeping every contact in the full list', () => {
    render(<ContactList contacts={[contact('已延期', { next_contact_at: '2026-09-27' }), contact('今天联系', { next_contact_at: '2026-09-28' }), contact('最近联系', { last_contact_at: '2026-09-27' }), contact('未安排')]} today="2026-09-28" onView={vi.fn()} onEdit={vi.fn()} onInteract={vi.fn()} />);
    expect(screen.getByRole('heading', { name: '需要跟进 · 2' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '最近联系 · 1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '全部联系人 · 4' })).toBeInTheDocument();
    expect(screen.getAllByText('已延期')).toHaveLength(2);
  });
  it('labels classmate relationships and uses relationship-history wording', () => {
    render(<ContactList contacts={[contact('老同学', { relationship_type: 'classmate' })]} today="2026-09-28" onView={vi.fn()} onEdit={vi.fn()} onInteract={vi.fn()} />);
    expect(screen.getByText('同学')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '记录往来' })).toHaveLength(1);
  });

  it('shows exact days since contact and an explicit empty state', () => {
    render(<ContactList contacts={[contact('已联系', { last_contact_at: '2026-09-09' }), contact('从未联系')]} today="2026-09-29" onView={vi.fn()} onEdit={vi.fn()} onInteract={vi.fn()} />);
    expect(screen.getAllByText('20天')).toHaveLength(2);
    expect(screen.getByText('未记录')).toBeInTheDocument();
  });
});
