import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Contact, ContactInteraction } from '@/types/life-os';
import ContactDetail from './ContactDetail';

const contact: Contact = {
  id: 'c1', user_id: 'u1', name: '胡琴', relationship_type: 'classmate', role: '跨境电商', met_context: '大学同学',
  family_context: '有一个孩子', work_context: '测试小红书获客', important_notes: '重视明确分工', birthday_calendar: 'lunar',
  birthday_year: null, birthday_month: 8, birthday_day: 15, birthday_is_leap_month: false, birthday_reminder_enabled: true,
  holiday_contact_reminder_enabled: true,
  last_contact_at: '2026-09-29', next_contact_at: '2026-10-10', next_action: '发推广案例', notes: '', source_type: 'manual', source_ref: null,
  review_status: 'approved', created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-29T00:00:00Z',
};
const interaction = (id: string, occurred_at: string, interaction_type: ContactInteraction['interaction_type'], summary: string): ContactInteraction => ({
  id, user_id: 'u1', contact_id: 'c1', occurred_at, interaction_type, summary, next_action: '', next_contact_at: null,
  source_type: 'manual', source_ref: null, review_status: 'approved', created_at: `${occurred_at}T00:00:00Z`,
});

describe('ContactDetail', () => {
  it('separates the current profile from descending append-only history', () => {
    render(<ContactDetail open contact={contact} interactions={[
      interaction('old', '2026-09-20', 'advice_received', '请教合同问题'),
      interaction('new', '2026-09-29', 'gift_given', '中秋节送茶致谢'),
    ]} loading={false} error="" onClose={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByText('当前档案')).toBeInTheDocument();
    expect(screen.getByText('农历八月十五')).toBeInTheDocument();
    expect(screen.getByText('我送礼/表达感谢')).toBeInTheDocument();
    expect(screen.getByText('我向对方请教')).toBeInTheDocument();
    const dates = screen.getAllByText(/^2026-09-/);
    expect(dates[0]).toHaveTextContent('2026-09-29');
    expect(dates[1]).toHaveTextContent('2026-09-20');
  });
});
