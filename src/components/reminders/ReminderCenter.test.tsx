import { fireEvent, render, screen } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ReminderCenter from './ReminderCenter';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
afterEach(() => vi.unstubAllGlobals());

describe('ReminderCenter', () => {
  it('labels the bell popover as due reminders rather than a second action list', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
    render(<App><ReminderCenter enabled /></App>);
    fireEvent.click(screen.getByRole('button', { name: '提醒' }));
    expect(await screen.findByText('到期提醒 · 0')).toBeInTheDocument();
    expect(screen.queryByText(/需要处理/)).not.toBeInTheDocument();
  });
});
