'use client';

import { DownloadOutlined } from '@ant-design/icons';
import { App, Button } from 'antd';
import { useState } from 'react';
import { buildResearchPdfFilename } from '@/lib/investment/research-report';

export default function ResearchPdfExportButton({ profileId, assetName }: { profileId: string; assetName: string }) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    let objectUrl: string | null = null;
    try {
      const response = await fetch(`/api/investment/research/${profileId}/export`);
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error || 'PDF 导出失败');
      }
      objectUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = buildResearchPdfFilename(assetName, new Date());
      anchor.click();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'PDF 导出失败');
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setLoading(false);
    }
  };

  return <Button aria-label="导出 PDF" icon={<DownloadOutlined />} loading={loading} disabled={loading} onClick={() => void download()}>导出 PDF</Button>;
}
