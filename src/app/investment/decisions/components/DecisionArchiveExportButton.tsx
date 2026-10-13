'use client';

import { DownloadOutlined } from '@ant-design/icons';
import { App, Button } from 'antd';
import { useState } from 'react';
import { buildDecisionArchivePdfFilename } from '@/lib/investment/decision-report';

export default function DecisionArchiveExportButton({ profileId, assetName }: { profileId: string; assetName: string }) {
  const { message } = App.useApp(); const [loading, setLoading] = useState(false);
  const download = async () => { setLoading(true); let objectUrl: string | null = null; try { const response = await fetch(`/api/investment/research/${profileId}/decisions/export`); if (!response.ok) { const body = await response.json().catch(() => null) as { error?: string } | null; throw new Error(body?.error || 'PDF 导出失败'); } objectUrl = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a'); anchor.href = objectUrl; anchor.download = buildDecisionArchivePdfFilename(assetName); anchor.click(); } catch (error) { message.error(error instanceof Error ? error.message : 'PDF 导出失败'); } finally { if (objectUrl) URL.revokeObjectURL(objectUrl); setLoading(false); } };
  return <Button aria-label="导出全部决策" icon={<DownloadOutlined />} loading={loading} disabled={loading} onClick={() => void download()}>导出全部决策</Button>;
}
