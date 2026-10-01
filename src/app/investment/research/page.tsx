'use client';
import { Alert, App, Button, Card, Col, Empty, Form, Input, List, Modal, Row, Tabs, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import type { ResearchProfile, ResearchProfileInput } from '@/types/life-os';
import ResearchEditor from './components/ResearchEditor';
import HypothesisEvidencePanel from './components/HypothesisEvidencePanel';
import SnapshotList from './components/SnapshotList';
import CompanyDecisionList from './components/CompanyDecisionList';
import ResearchPdfExportButton from './components/ResearchPdfExportButton';

export default function ResearchPage() {
  const { message } = App.useApp(); const [newForm] = Form.useForm();
  const [profiles, setProfiles] = useState<ResearchProfile[]>([]); const [selected, setSelected] = useState<ResearchProfile | null>(null);
  const [creating, setCreating] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const load = useCallback(async () => { try { const response = await fetch('/api/investment/research'); const data = await response.json(); if (!response.ok) throw new Error(data.error || '研究档案加载失败'); setProfiles(data); setSelected((current) => current ? data.find((item: ResearchProfile) => item.id === current.id) ?? data[0] ?? null : data[0] ?? null); setError(''); } catch (err) { setError(err instanceof Error ? err.message : '研究档案加载失败'); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const save = async (input: ResearchProfileInput) => { setSaving(true); try { const response = await fetch('/api/investment/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...selected, ...input }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '保存失败'); message.success('当前研究已保存'); await load(); } catch (err) { message.error(err instanceof Error ? err.message : '保存失败'); } finally { setSaving(false); } };
  const create = async () => { const values = await newForm.validateFields(); const response = await fetch('/api/investment/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ asset_name: values.asset_name }) }); const data = await response.json(); if (!response.ok) return message.error(data.error || '创建失败'); setCreating(false); newForm.resetFields(); await load(); setSelected(data); };
  return <AuthGuard><div className="page-heading"><div><Typography.Title level={2}>公司研究</Typography.Title><Typography.Text type="secondary">用核心问题防止遗漏；证据和快照保留判断形成的过程。</Typography.Text></div><Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>新建研究</Button></div>
    {error && <Alert type="warning" showIcon message="研究模块暂时不可用" description={`${error}。结构化研究与快照需要执行迁移 010。`} style={{ marginBottom: 16 }} />}
    <Row gutter={[16, 16]}><Col xs={24} lg={6}><Card title={`研究公司 · ${profiles.length}`}>{profiles.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无研究档案" /> : <List dataSource={profiles} renderItem={(profile) => <List.Item className={selected?.id === profile.id ? 'research-selected' : ''} onClick={() => setSelected(profile)}><Typography.Text strong>{profile.asset_name}</Typography.Text></List.Item>} />}</Card></Col>
      <Col xs={24} lg={18}>{!selected ? <Card><Empty description="选择或新建一家公司" /></Card> : <><Card style={{ marginBottom: 16 }} extra={<ResearchPdfExportButton profileId={selected.id} assetName={selected.asset_name} />}><Typography.Title level={3}>{selected.asset_name}</Typography.Title><Typography.Text type="secondary">最近更新：{new Date(selected.updated_at).toLocaleString('zh-CN')}</Typography.Text>{selected.current_judgment && <Typography.Paragraph style={{ marginTop: 12 }}>{selected.current_judgment}</Typography.Paragraph>}</Card><Tabs items={[
        { key: 'current', label: '当前研究', children: <ResearchEditor initial={selected} saving={saving} onSubmit={save} /> },
        { key: 'evidence', label: '假设与证据', children: <HypothesisEvidencePanel profile={selected} /> },
        { key: 'snapshots', label: '研究快照', children: <SnapshotList profile={selected} /> },
        { key: 'decisions', label: '投资决策', children: <CompanyDecisionList profile={selected} /> },
      ]} /></>}</Col></Row>
    <Modal title="新建公司研究" open={creating} okText="创建" cancelText="取消" onCancel={() => setCreating(false)} onOk={create}><Form form={newForm} layout="vertical"><Form.Item name="asset_name" label="公司或标的" rules={[{ required: true, message: '请填写公司或标的名称' }]}><Input /></Form.Item></Form></Modal>
  </AuthGuard>;
}
