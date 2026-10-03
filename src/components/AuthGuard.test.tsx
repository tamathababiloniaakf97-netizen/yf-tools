import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

import AuthGuard from './AuthGuard';
import { AuthSessionContext } from './AuthSessionContext';

describe('AuthGuard', () => {
  it('reuses the shell session instead of performing another auth request', () => {
    render(<AuthSessionContext.Provider value={{ user: { id: 'u1' } as User, loading: false }}><AuthGuard><div>已登录内容</div></AuthGuard></AuthSessionContext.Provider>);
    expect(screen.getByText('已登录内容')).toBeInTheDocument();
  });

  it('redirects after the shared session resolves without a user', async () => {
    push.mockClear();
    render(<AuthSessionContext.Provider value={{ user: null, loading: false }}><AuthGuard><div>私密内容</div></AuthGuard></AuthSessionContext.Provider>);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText('私密内容')).not.toBeInTheDocument();
  });
});
