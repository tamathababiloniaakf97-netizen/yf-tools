'use client';
import { App, Form, Input, Modal, Select } from 'antd';
import { useEffect, useState } from 'react';
import type { ResearchField, ResearchHypothesis, ResearchMaterial, ResearchProfile } from '@/types/life-os';

const researchFieldOptions: Array<{ value: ResearchField; label: string }> = [
  { value: 'business_model', label: '公司靠什么生意挣钱' }, { value: 'customer_value', label: '为什么客户持续付钱' },
  { value: 'competitive_advantage', label: '竞争优势' }, { value: 'long_term_assumptions', label: '长期关键假设' },
  { value: 'invalidation_conditions', label: '失效条件' }, { value: 'earnings_quality', label: '经济质量' },
  { value: 'management_culture', label: '管理者与文化' }, { value: 'current_judgment', label: '当前结论' },
  { value: 'risks', label: '主要风险' }, { value: 'unknowns', label: '仍不知道的事情' },
  { value: 'investment_thesis', label: '研究摘要' },
];

export default function MaterialCitationModal({ material, open, onCancel }: { material: ResearchMaterial | null; open: boolean; onCancel: () => void }) {
  const { message } = App.useApp(); const [form] = Form.useForm(); const destination = Form.useWatch('destination', form);
  const [profiles, setProfiles] = useState<ResearchProfile[]>([]); const [hypotheses, setHypotheses] = useState<ResearchHypothesis[]>([]); const [saving, setSaving] = useState(false);
  useEffect(() => { if (!open) return; form.resetFields(); form.setFieldsValue({ asset_name: material?.asset_name ?? undefined, content: material?.content, impact: 'neutral', destination: 'general' }); void fetch('/api/investment/research').then((response) => response.json()).then(setProfiles); }, [form, material, open]);
  const selectCompany = async (assetName: string) => { const profile = profiles.find((item) => item.asset_name === assetName); setHypotheses(profile ? await fetch(`/api/investment/research/${profile.id}/hypotheses`).then((response) => response.json()) : []); };
  const save = async () => { const values = await form.validateFields(); setSaving(true); try { const response = await fetch('/api/investment/evidence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ asset_name: values.asset_name, content: values.content, impact: values.impact, material_id: material?.id, hypothesis_id: values.destination === 'hypothesis' ? values.hypothesis_id : null, research_field: values.destination === 'current' ? values.research_field : null, source_name: material?.source_name ?? '', source_url: material?.source_url }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '引用失败'); message.success('已引用到研究'); onCancel(); } catch (error) { message.error(error instanceof Error ? error.message : '引用失败'); } finally { setSaving(false); } };
  return <Modal title="引用到研究" open={open} okText="确认引用" cancelText="取消" confirmLoading={saving} onCancel={onCancel} onOk={save}><Form form={form} layout="vertical"><Form.Item name="asset_name" label="公司" rules={[{ required: true, message: '请选择公司' }]}><Select showSearch options={profiles.map((item) => ({ value: item.asset_name, label: item.asset_name }))} onChange={selectCompany} /></Form.Item><Form.Item name="destination" label="引用位置"><Select options={[{ value: 'general', label: '公司研究的一般资料' }, { value: 'current', label: '当前研究栏目' }, { value: 'hypothesis', label: '研究假设' }]} /></Form.Item>{destination === 'current' && <Form.Item name="research_field" label="当前研究栏目" rules={[{ required: true, message: '请选择栏目' }]}><Select options={researchFieldOptions} /></Form.Item>}{destination === 'hypothesis' && <Form.Item name="hypothesis_id" label="研究假设" rules={[{ required: true, message: '请选择假设' }]}><Select options={hypotheses.map((item) => ({ value: item.id, label: item.statement }))} /></Form.Item>}<Form.Item name="impact" label="作用"><Select options={[{ value: 'neutral', label: '补充背景 / 暂不判断' }, { value: 'support', label: '支持' }, { value: 'challenge', label: '挑战' }, { value: 'mixed', label: '混合' }]} /></Form.Item><Form.Item name="content" label="引用内容" rules={[{ required: true }]}><Input.TextArea rows={5} /></Form.Item></Form></Modal>;
}
