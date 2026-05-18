'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import AuthGuard from '@/components/AuthGuard';
import { createClient } from '@/lib/supabase';
import ResourceList from './components/ResourceList';

export default function AdminResourcesPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile?.role !== 'admin') {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }
    })();
  }, [supabase]);

  if (isAdmin === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 720, margin: '60px auto', textAlign: 'center' }}>
        <h2>无权限</h2>
        <p style={{ color: '#6b6b6b' }}>仅管理员可访问此页面。</p>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 0' }}>
        <ResourceList />
      </div>
    </AuthGuard>
  );
}
