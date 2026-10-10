'use client';

import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Dropdown, Layout } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import AppSidebar from './AppSidebar';
import ReminderCenter from '@/components/reminders/ReminderCenter';
import { AuthSessionContext } from '@/components/AuthSessionContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setAuthLoading(false); });
    return () => subscription.unsubscribe();
  }, []);

  if (pathname === '/login') return <AuthSessionContext.Provider value={{ user, loading: authLoading }}>{children}</AuthSessionContext.Provider>;

  const logout = async () => {
    await createClient().auth.signOut();
    router.push('/login');
  };

  return (
    <AuthSessionContext.Provider value={{ user, loading: authLoading }}>
      <Layout className="life-os-layout">
      <Layout.Sider className="life-os-sider" width={232} breakpoint="lg" collapsedWidth={0} theme="dark">
        <AppSidebar pathname={pathname} onNavigate={(href) => router.push(href)} onPrefetch={(href) => router.prefetch(href)} />
      </Layout.Sider>
      <Layout className="life-os-content-layout">
        <header className="life-os-topbar">
          <span />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ReminderCenter enabled={!!user} />
          {user && (
            <Dropdown menu={{ items: [
              { key: 'email', label: user.email, disabled: true },
              { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: logout },
            ] }}>
              <Button type="text" icon={<UserOutlined />}>{user.email?.split('@')[0]}</Button>
            </Dropdown>
          )}
          </div>
        </header>
        <Layout.Content className="life-os-main">{children}</Layout.Content>
      </Layout>
      </Layout>
    </AuthSessionContext.Provider>
  );
}
