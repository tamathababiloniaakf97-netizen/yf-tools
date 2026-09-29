'use client';
import { App, Button, Card, Empty, List, Space, Tag } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';
import type { ResearchProfile, ResearchSnapshot } from '@/types/life-os';

export default function SnapshotList({ profile }: { profile: ResearchProfile }) {
  const { message } = App.useApp(); const [items, setItems] = useState<ResearchSnapshot[]>([]); const [saving, setSaving] = useState(false);
  const load = useCallback(async () => { const response = await fetch(`/api/investment/research/${profile.id}/snapshots`); if (response.ok) setItems(await response.json()); }, [profile.id]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const create = async () => { setSaving(true); try { const response = await fetch(`/api/investment/research/${profile.id}/snapshots`, { method: 'POST' }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '快照保存失败'); message.success(`研究快照 v${data.snapshot_version} 已保存`); await load(); } catch (error) { message.error(error instanceof Error ? error.message : '快照保存失败'); } finally { setSaving(false); } };
  return <Card title="研究快照" extra={<Button type="primary" icon={<CameraOutlined />} loading={saving} onClick={create}>保存当前研究快照</Button>}>{items.length === 0 ? <Empty description="尚未保存研究快照" /> : <List dataSource={items} renderItem={(item) => <List.Item><List.Item.Meta title={<Space><span>版本 {item.snapshot_version}</span><Tag>只读</Tag></Space>} description={new Date(item.created_at).toLocaleString('zh-CN')} /></List.Item>} />}</Card>;
}
