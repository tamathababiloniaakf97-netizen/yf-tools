'use client';

import React, { useState } from 'react';
import { Card, Form, Input, Button, Tabs, App, Typography } from 'antd';
import { MailOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { message } = App.useApp();
  const supabase = createClient();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;
      message.success('登录成功');
      router.push('/cost');
    } catch (err: unknown) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { email: string; password: string; invite_code: string }) => {
    // 验证邀请码
    const expectedCode = process.env.NEXT_PUBLIC_INVITE_CODE || 'YF2024';
    if (values.invite_code !== expectedCode) {
      message.error('邀请码无效');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;
      message.success('注册成功，请查看邮箱确认链接。如未收到，可联系管理员直接激活。');
    } catch (err: unknown) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '70vh',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>远峯投资策略工作台</Title>
          <Text type="secondary">登录以继续</Text>
        </div>

        <Tabs
          centered
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form onFinish={handleLogin} layout="vertical" size="large">
                  <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
                    <Input prefix={<MailOutlined />} placeholder="your@email.com" />
                  </Form.Item>
                  <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>
                    登录
                  </Button>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form onFinish={handleRegister} layout="vertical" size="large">
                  <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
                    <Input prefix={<MailOutlined />} placeholder="your@email.com" />
                  </Form.Item>
                  <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="至少6位密码" />
                  </Form.Item>
                  <Form.Item name="invite_code" label="邀请码" rules={[{ required: true }]}>
                    <Input prefix={<KeyOutlined />} placeholder="请输入邀请码" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>
                    注册
                  </Button>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
