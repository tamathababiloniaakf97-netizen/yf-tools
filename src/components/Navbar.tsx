'use client';

import React, { useEffect, useState } from 'react';
import { Layout, Menu, message, Button, Dropdown, Space } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import {
  CalculatorOutlined,
  FileTextOutlined,
  BulbOutlined,
  ExperimentOutlined,
  UserOutlined,
  LogoutOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const { Header } = Layout;

const menuItems = [
  {
    key: '/cost',
    label: '成本记录',
    icon: <CalculatorOutlined />,
    enabled: true,
  },
  {
    key: '/blog',
    label: '博客',
    icon: <FileTextOutlined />,
    enabled: false,
  },
  {
    key: '/strategy',
    label: 'AI策略构建',
    icon: <BulbOutlined />,
    enabled: true,
  },
  {
    key: '/execution',
    label: '策略执行',
    icon: <ExperimentOutlined />,
    enabled: true,
  },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('获取用户角色失败:', error.message, error.code);
          return;
        }
        if (data) {
          console.log('用户角色:', data.role);
          setRole(data.role);
        } else {
          console.log('未找到用户资料');
        }
      });
  }, [user, supabase]);

  const handleMenuClick = (info: { key: string }) => {
    const item = menuItems.find((m) => m.key === info.key);
    if (!item?.enabled) {
      message.info('该功能正在开发中');
      return;
    }
    router.push(info.key);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    message.success('已退出登录');
    router.push('/login');
  };

  const selectedKey = menuItems
    .filter((m) => m.enabled)
    .find((m) => pathname.startsWith(m.key));

  return (
    <Header
      className="yf-navbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{ fontSize: 18, fontWeight: 700, marginRight: 40, whiteSpace: 'nowrap', cursor: 'pointer' }}
        onClick={() => router.push('/about')}
      >
        远峯投资
      </div>

      <Menu
        mode="horizontal"
        selectedKeys={selectedKey ? [selectedKey.key] : []}
        items={menuItems.map((item) => ({
          key: item.key,
          label: (
            <span style={{ color: item.enabled ? undefined : '#bfbfbf', cursor: 'pointer' }}>
              {item.label}
            </span>
          ),
          icon: React.cloneElement(item.icon, {
            style: { color: item.enabled ? undefined : '#bfbfbf' },
          }),
        }))}
        onClick={handleMenuClick}
        style={{ flex: 1, border: 'none' }}
      />

      {user && (
        <Dropdown
          menu={{
            items: [
              {
                key: 'email',
                label: user.email,
                disabled: true,
              },
              ...(role === 'admin'
                ? [
                    {
                      key: 'admin-resources',
                      label: '资源管理',
                      icon: <FolderOutlined />,
                      onClick: () => router.push('/about/admin'),
                    },
                    { type: 'divider' as const },
                  ]
                : []),
              {
                key: 'logout',
                label: '退出登录',
                icon: <LogoutOutlined />,
                onClick: handleLogout,
              },
            ],
          }}
        >
          <Button type="text" icon={<UserOutlined />}>
            {user.email?.split('@')[0]}
          </Button>
        </Dropdown>
      )}
    </Header>
  );
}
