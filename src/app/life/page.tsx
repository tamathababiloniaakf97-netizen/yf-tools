'use client';

import { PlusOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Col, Empty, Row, Skeleton, Space, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import type { LifeReinforcementProject, LifeReinforcementProjectInput, LifeTrainingRecord, LifeTrainingRecordInput } from '@/types/life-os';
import LifeProjectCard from './components/LifeProjectCard';
import LifeProjectEditor from './components/LifeProjectEditor';
import LifeRecordEditor from './components/LifeRecordEditor';

async function responseData<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '操作失败');
  return data as T;
}

export default function LifePage() {
  const { message } = App.useApp();
  const [projects, setProjects] = useState<LifeReinforcementProject[]>([]);
  const [records, setRecords] = useState<Record<string, LifeTrainingRecord[]>>({});
  const [openRecords, setOpenRecords] = useState<Set<string>>(new Set());
  const [loadingRecords, setLoadingRecords] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [projectEditorOpen, setProjectEditorOpen] = useState(false);
  const [recordEditorOpen, setRecordEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<LifeReinforcementProject | null>(null);
  const [recordProject, setRecordProject] = useState<LifeReinforcementProject | null>(null);
  const [editingRecord, setEditingRecord] = useState<LifeTrainingRecord | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await responseData<LifeReinforcementProject[]>(await fetch('/api/life/projects')));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '生活补强项目加载失败');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void loadProjects(), 0); return () => window.clearTimeout(timer); }, [loadProjects]);

  const loadRecords = async (projectId: string) => {
    setLoadingRecords((current) => new Set(current).add(projectId));
    try {
      const data = await responseData<LifeTrainingRecord[]>(await fetch(`/api/life/projects/${projectId}/records`));
      setRecords((current) => ({ ...current, [projectId]: data }));
    } catch (err) { message.error(err instanceof Error ? err.message : '训练记录加载失败'); }
    finally { setLoadingRecords((current) => { const next = new Set(current); next.delete(projectId); return next; }); }
  };

  const toggleRecords = async (project: LifeReinforcementProject) => {
    if (openRecords.has(project.id)) {
      setOpenRecords((current) => { const next = new Set(current); next.delete(project.id); return next; });
      return;
    }
    setOpenRecords((current) => new Set(current).add(project.id));
    await loadRecords(project.id);
  };

  const saveProject = async (input: LifeReinforcementProjectInput) => {
    setSaving(true);
    try {
      await responseData(await fetch(editingProject ? `/api/life/projects/${editingProject.id}` : '/api/life/projects', {
        method: editingProject ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
      }));
      message.success(editingProject ? '项目已更新' : '项目已创建');
      setProjectEditorOpen(false); setEditingProject(null); await loadProjects();
    } catch (err) { message.error(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  const deleteProject = async (project: LifeReinforcementProject) => {
    try {
      await responseData(await fetch(`/api/life/projects/${project.id}`, { method: 'DELETE' }));
      message.success('项目已删除'); await loadProjects();
    } catch (err) { message.error(err instanceof Error ? err.message : '删除失败'); }
  };

  const saveRecord = async (input: LifeTrainingRecordInput) => {
    if (!recordProject) return;
    setSaving(true);
    try {
      await responseData(await fetch(editingRecord ? `/api/life/records/${editingRecord.id}` : `/api/life/projects/${recordProject.id}/records`, {
        method: editingRecord ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
      }));
      message.success(editingRecord ? '记录已更新' : '训练已记录');
      setRecordEditorOpen(false); setEditingRecord(null);
      setOpenRecords((current) => new Set(current).add(recordProject.id));
      await loadRecords(recordProject.id);
    } catch (err) { message.error(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  const deleteRecord = async (project: LifeReinforcementProject, record: LifeTrainingRecord) => {
    try {
      await responseData(await fetch(`/api/life/records/${record.id}`, { method: 'DELETE' }));
      message.success('记录已删除'); await loadRecords(project.id);
    } catch (err) { message.error(err instanceof Error ? err.message : '删除失败'); }
  };

  const visibleProjects = projects.filter((project) => project.is_active || showInactive);
  return <AuthGuard>
    <div className="page-heading">
      <div><Typography.Title level={2}>生活补强</Typography.Title><Typography.Text type="secondary">维护自己的训练方向，记录实际做过的事。内容仅在本页面使用。</Typography.Text></div>
      <Space wrap>
        {projects.some((project) => !project.is_active) && <Button onClick={() => setShowInactive((value) => !value)}>{showInactive ? '隐藏已停用' : '查看已停用'}</Button>}
        <Button type="primary" icon={<PlusOutlined aria-hidden />} onClick={() => { setEditingProject(null); setProjectEditorOpen(true); }}>新增项目</Button>
      </Space>
    </div>

    {error && <Alert type="warning" showIcon title="生活补强尚未连接" description={error} action={<Button onClick={() => void loadProjects()}>重试</Button>} style={{ marginBottom: 16 }} />}
    {loading && <Card><Skeleton active /></Card>}
    {!loading && !error && visibleProjects.length === 0 && <Card><Empty description="还没有补强项目" /></Card>}
    <Row gutter={[16, 16]}>
      {visibleProjects.map((project) => <Col xs={24} xl={12} key={project.id}><LifeProjectCard
        project={project} records={records[project.id]} recordsOpen={openRecords.has(project.id)} loadingRecords={loadingRecords.has(project.id)}
        onEdit={() => { setEditingProject(project); setProjectEditorOpen(true); }}
        onAddRecord={() => { setRecordProject(project); setEditingRecord(null); setRecordEditorOpen(true); }}
        onToggleRecords={() => void toggleRecords(project)}
        onEditRecord={(record) => { setRecordProject(project); setEditingRecord(record); setRecordEditorOpen(true); }}
        onDeleteRecord={(record) => void deleteRecord(project, record)}
        onDeleteProject={() => void deleteProject(project)}
      /></Col>)}
    </Row>

    <LifeProjectEditor open={projectEditorOpen} initial={editingProject} saving={saving}
      onCancel={() => { setProjectEditorOpen(false); setEditingProject(null); }} onSubmit={saveProject} />
    <LifeRecordEditor open={recordEditorOpen} initial={editingRecord} stages={recordProject?.stages ?? []} saving={saving}
      onCancel={() => { setRecordEditorOpen(false); setEditingRecord(null); }} onSubmit={saveRecord} />
  </AuthGuard>;
}
