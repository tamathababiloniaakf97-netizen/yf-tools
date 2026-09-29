'use client';
import { Alert, App, Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import ContactList from './components/ContactList';
import ContactEditor from './components/ContactEditor';
import InteractionEditor from './components/InteractionEditor';
import ContactDetail from './components/ContactDetail';
import type { Contact, ContactInput, ContactInteraction, ContactInteractionInput } from '@/types/life-os';

function todayInShanghai() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export default function RelationshipsPage() {
  const { message } = App.useApp();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [interacting, setInteracting] = useState<Contact | null>(null);
  const [viewing, setViewing] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<ContactInteraction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const initialContactHandled = useRef(false);

  const load = useCallback(async () => { try { const response = await fetch('/api/relationships'); const data = await response.json(); if (!response.ok) throw new Error(data.error || '加载失败'); setContacts(data); setError(''); } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const loadHistory = useCallback(async (contact: Contact) => {
    setViewing(contact); setHistoryLoading(true); setHistoryError('');
    try { const response = await fetch(`/api/relationships/${contact.id}/interactions`); const data = await response.json(); if (!response.ok) throw new Error(data.error || '加载失败'); setInteractions(data); }
    catch (err) { setInteractions([]); setHistoryError(err instanceof Error ? err.message : '加载失败'); }
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => {
    if (initialContactHandled.current || contacts.length === 0) return;
    initialContactHandled.current = true;
    const id = new URLSearchParams(window.location.search).get('contact');
    const contact = contacts.find((item) => item.id === id);
    if (contact) {
      const timer = window.setTimeout(() => void loadHistory(contact), 0);
      return () => window.clearTimeout(timer);
    }
  }, [contacts, loadHistory]);

  const saveContact = async (input: ContactInput) => { setSaving(true); try { const response = await fetch(editing ? `/api/relationships/${editing.id}` : '/api/relationships', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '保存失败'); message.success('联系人已保存'); setEditorOpen(false); setEditing(null); await load(); } catch (err) { message.error(err instanceof Error ? err.message : '保存失败'); } finally { setSaving(false); } };
  const saveInteraction = async (input: ContactInteractionInput) => { if (!interacting) return; setSaving(true); try { const response = await fetch(`/api/relationships/${interacting.id}/interactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '保存失败'); message.success('往来记录已保存'); setInteracting(null); await load(); if (viewing?.id === interacting.id) await loadHistory(interacting); } catch (err) { message.error(err instanceof Error ? err.message : '保存失败'); } finally { setSaving(false); } };

  return <AuthGuard><div className="page-heading"><div><Typography.Title level={2}>人际关系</Typography.Title><Typography.Text type="secondary">记住重要近况和人情往来，用具体行动维护关系。</Typography.Text></div><Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setEditorOpen(true); }}>新建联系人</Button></div>
    {error && <Alert type="warning" showIcon title="人际关系模块尚未连接" description="请执行数据库迁移 007 和 008。" style={{ marginBottom: 16 }} />}
    <ContactList contacts={contacts} today={todayInShanghai()} onView={(value) => void loadHistory(value)} onEdit={(value) => { setEditing(value); setEditorOpen(true); }} onInteract={setInteracting} />
    <ContactEditor open={editorOpen} initial={editing} saving={saving} onCancel={() => { setEditorOpen(false); setEditing(null); }} onSubmit={saveContact} />
    <InteractionEditor contact={interacting} saving={saving} onCancel={() => setInteracting(null)} onSubmit={saveInteraction} />
    <ContactDetail open={!!viewing} contact={viewing} interactions={interactions} loading={historyLoading} error={historyError} onRetry={() => viewing && void loadHistory(viewing)} onClose={() => { setViewing(null); setInteractions([]); window.history.replaceState(null, '', '/relationships'); }} />
  </AuthGuard>;
}
