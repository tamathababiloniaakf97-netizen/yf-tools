'use client';

import { CopyOutlined } from '@ant-design/icons';
import { App, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DecisionCopyButton({ decisionId }: { decisionId: string }) {
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const copy = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/investment/decisions/${decisionId}/copy`, { method: 'POST' });
      const data = await response.json() as { id?: string; error?: string };
      if (!response.ok || !data.id) throw new Error(data.error || '复制失败');
      message.success('已复制为新草稿');
      router.push(`/investment/decisions/${data.id}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '复制失败');
    } finally {
      setLoading(false);
    }
  };

  return <Button aria-label="复制为新草稿" icon={<CopyOutlined />} loading={loading} disabled={loading} onClick={() => void copy()}>复制为新草稿</Button>;
}
