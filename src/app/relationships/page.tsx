'use client';
import { Alert, App, Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import ContactList from './components/ContactList';
import ContactEditor from './components/ContactEditor';
import InteractionEditor from './components/InteractionEditor';
import type { Contact, ContactInput, ContactInteractionInput } from '@/types/life-os';
export default function RelationshipsPage() {
  const { message } = App.useApp(); const [contacts, setContacts] = useState<Contact[]>([]); const [editing, setEditing] = useState<Contact | null>(null); const [interacting, setInteracting] = useState<Contact | null>(null); const [editorOpen, setEditorOpen] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const load = useCallback(async () => { try { const response = await fetch('/api/relationships'); const data = await response.json(); if (!response.ok) throw new Error(data.error || '加载失败'); setContacts(data); setError(''); } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const saveContact = async (input: ContactInput) => { setSaving(true); try { const response = await fetch(editing ? `/api/relationships/${editing.id}` : '/api/relationships', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '保存失败'); message.success('联系人已保存'); setEditorOpen(false); setEditing(null); await load(); } catch (err) { message.error(err instanceof Error ? err.message : '保存失败'); } finally { setSaving(false); } };
  const saveInteraction = async (input: ContactInteractionInput) => { if (!interacting) return; setSaving(true); try { const response = await fetch(`/api/relationships/${interacting.id}/interactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '保存失败'); message.success('联系记录已保存'); setInteracting(null); await load(); } catch (err) { message.error(err instanceof Error ? err.message : '保存失败'); } finally { setSaving(false); } };
  return <AuthGuard><div className="page-heading"><div><Typography.Title level={2}>人际关系</Typography.Title><Typography.Text type="secondary">记住重要近况和下一步联系，不给关系打分。</Typography.Text></div><Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setEditorOpen(true); }}>新建联系人</Button></div>{error && <Alert type="warning" showIcon title="人际关系模块尚未连接" description="请执行数据库迁移 007_goals_relationships.sql。" style={{ marginBottom: 16 }} />}<ContactList contacts={contacts} today={new Date().toISOString().slice(0, 10)} onEdit={(value) => { setEditing(value); setEditorOpen(true); }} onInteract={setInteracting} /><ContactEditor open={editorOpen} initial={editing} saving={saving} onCancel={() => { setEditorOpen(false); setEditing(null); }} onSubmit={saveContact} /><InteractionEditor contact={interacting} saving={saving} onCancel={() => setInteracting(null)} onSubmit={saveInteraction} /></AuthGuard>;
}
