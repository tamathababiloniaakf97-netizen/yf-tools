'use client';
import { Alert, App, Button, Card, Drawer, Empty, Modal, Space, Spin, Tag, Typography } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';
import type { ResearchProfile, ResearchSnapshot } from '@/types/life-os';
import SnapshotDetail from './SnapshotDetail';

export default function SnapshotList({ profile }: { profile: ResearchProfile }) {
  return <CompanySnapshots key={profile.id} profile={profile} />;
}

function CompanySnapshots({ profile }: { profile: ResearchProfile }) {
  const { message } = App.useApp();
  const [items, setItems] = useState<ResearchSnapshot[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<ResearchSnapshot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResearchSnapshot | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const remove = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const response = await fetch(`/api/investment/research/${profile.id}/snapshots/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '快照删除失败');
      setItems(current => current.filter(item => item.id !== deleteTarget.id));
      setSelected(current => current?.id === deleteTarget.id ? null : current);
      setDeleteTarget(null);
      message.success('快照已删除');
    } catch (err) { setDeleteError(err instanceof Error ? err.message : '快照删除失败'); }
    finally { setDeleting(false); }
  };
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/investment/research/${profile.id}/snapshots`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '快照加载失败');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '快照加载失败');
    } finally { setLoading(false); }
  }, [profile.id]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const create = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/investment/research/${profile.id}/snapshots`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '快照保存失败');
      setItems(current => [data, ...current.filter(item => item.id !== data.id)]);
      setSelected(data);
      message.success(`研究快照 v${data.snapshot_version} 已保存`);
    } catch (err) { message.error(err instanceof Error ? err.message : '快照保存失败'); }
    finally { setSaving(false); }
  };
  return <>
    <Card title="研究快照" extra={<Button type="primary" icon={<CameraOutlined />} loading={saving} disabled={loading || !!error || deleting} onClick={create}>保存当前研究快照</Button>}>
      <Typography.Paragraph type="secondary">快照保留当时已保存的研究正文、假设和证据，方便日后核对决策依据。请先保存当前研究；未保存的表单修改不会包含在快照中。</Typography.Paragraph>
      {loading ? <div role="status" aria-label="正在加载快照"><Spin /></div> : error ? <Alert type="error" showIcon title="快照加载失败" description={error} action={<Button onClick={() => void load()}>重试</Button>} /> : items.length === 0 ? <Empty description="尚未保存研究快照" /> : <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>{items.map(item => <li key={item.id} style={{ padding: '16px 0', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><Space wrap><Typography.Text strong>版本 {item.snapshot_version}</Typography.Text><Tag>只读</Tag><Typography.Text type="secondary">{new Date(item.created_at).toLocaleString('zh-CN')}</Typography.Text></Space><Button danger disabled={saving || deleting} onClick={() => { setDeleteError(''); setDeleteTarget(item); }}>删除快照</Button></div>
        <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ marginTop: 8, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.snapshot_data.profile.investment_thesis?.trim() || item.snapshot_data.profile.current_judgment?.trim() || '此版本未填写研究摘要'}</Typography.Paragraph>
        <Space wrap size="large"><Typography.Text type="secondary">{item.snapshot_data.hypotheses.length} 条假设 · {item.evidence_snapshot.length} 条证据</Typography.Text><Button onClick={() => setSelected(item)}>查看快照</Button></Space>
      </li>)}</ul>}
    </Card>
    <Modal title={`删除研究快照 · 版本 ${deleteTarget?.snapshot_version ?? ''}`} open={!!deleteTarget} okText="确认删除" cancelText="取消" okButtonProps={{ danger: true }} confirmLoading={deleting} cancelButtonProps={{ disabled: deleting }} closable={!deleting} maskClosable={!deleting} onOk={() => void remove()} onCancel={() => { if (!deleting) setDeleteTarget(null); }}>
      <Typography.Paragraph>删除后无法恢复，此操作不会修改当前研究。已被投资决策引用的快照不能删除。</Typography.Paragraph>
      {deleteTarget && <Typography.Paragraph type="secondary">保存时间：{new Date(deleteTarget.created_at).toLocaleString('zh-CN')}</Typography.Paragraph>}
      {deleteError && <Alert type="error" showIcon title={deleteError} />}
    </Modal>
    <Drawer title="研究快照详情" open={!!selected} onClose={() => setSelected(null)} size={800} styles={{ wrapper: { maxWidth: '100vw' } }} destroyOnHidden>
      {selected && <SnapshotDetail snapshot={selected} />}
    </Drawer>
  </>;
}
