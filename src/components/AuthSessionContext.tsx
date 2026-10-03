'use client';

import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

export type AuthSessionState = { user: User | null; loading: boolean };

export const AuthSessionContext = createContext<AuthSessionState>({ user: null, loading: true });

export function useAuthSession() {
  return useContext(AuthSessionContext);
}
