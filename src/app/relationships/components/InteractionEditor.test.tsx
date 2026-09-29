import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Contact } from '@/types/life-os';
import InteractionEditor from './InteractionEditor';

const contact: Contact = {
  id: 'c1', user_id: 'u1', name: '胡琴', relationship_type: 'friend', role: '', met_context: '',
  family_context: '', work_context: '', important_notes: '', birthday_calendar: null,
  birthday_year: null, birthday_month: null, birthday_day: null, birthday_is_leap_month: false,
  birthday_reminder_enabled: true, holiday_contact_reminder_enabled: false, last_contact_at: null, next_contact_at: null, next_action: '',
  notes: '', source_type: 'manual', source_ref: null, review_status: 'approved',
  created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z',
};

describe('InteractionEditor', () => {
  it('records typed relationship history with action-oriented copy', async () => {
    render(<InteractionEditor contact={contact} saving={false} onCancel={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText('记录往来 · 胡琴')).toBeInTheDocument();
    expect(screen.getByLabelText('往来类型')).toBeInTheDocument();
    expect(screen.getByLabelText('往来日期')).toBeInTheDocument();
    expect(screen.getByLabelText('我的下一步行动')).toBeInTheDocument();
    expect(screen.getByLabelText('计划联系日期')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByLabelText('往来类型'));
    fireEvent.click(await screen.findByText('我送礼/表达感谢'));
    expect(await screen.findByPlaceholderText(/事由、礼物、对方回应/)).toBeInTheDocument();
  });
});
