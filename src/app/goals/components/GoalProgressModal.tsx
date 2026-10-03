'use client';

import { Alert, App, Divider, Empty, Form, Input, InputNumber, List, Modal, Space, Spin, Tag, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import type { Goal, GoalProgressInput, GoalProgressUpdate } from '@/types/life-os';

function todayInShanghai() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export default function GoalProgressModal({ open, goal, onClose, onSaved }: { open: boolean; goal: Goal | null; onClose: () => void; onSaved: () => void }) {
  const { message } = App.useApp();
  const [form] = Form.useForm<GoalProgressInput>();
  const [items, setItems] = useState<GoalProgressUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!goal) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/goals/${goal.id}/progress`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '进展记录加载失败');
      setItems(data); setError('');
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : '进展记录加载失败'); }
    finally { setLoading(false); }
  }, [goal]);

  useEffect(() => {
    if (!open || !goal) return;
    const timer = window.setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        occurred_at: todayInShanghai(), progress_note: '', next_action: goal.next_action, next_action_due_at: goal.next_action_due_at,
        current_state: goal.current_state, current_milestone: goal.current_milestone,
        current_value: goal.current_value ?? undefined, habit_completed_count: goal.habit_completed_count ?? undefined,
      });
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [form, goal, load, open]);

  const submit = async () => {
    if (!goal) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      const response = await fetch(`/api/goals/${goal.id}/progress`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '进展保存失败');
      message.success('进展已记录，目标当前状态已同步');
      onSaved();
      form.setFieldValue('progress_note', '');
      await load();
    } catch (saveError) { message.error(saveError instanceof Error ? saveError.message : '进展保存失败'); }
    finally { setSaving(false); }
  };

  return <Modal title={goal ? `${goal.title} · 更新进展` : '更新进展'} open={open} width={680} okText="保存进展" cancelText="关闭" confirmLoading={saving} onCancel={onClose} onOk={() => void submit()}>
    {error ? <Alert type="warning" showIcon title={error} style={{ marginBottom: 12 }} /> : null}
    <Form form={form} layout="vertical">
      <Form.Item name="occurred_at" label="进展日期" rules={[{ required: true }]}><Input type="date" /></Form.Item>
      <Form.Item name="progress_note" label="本次完成了什么" rules={[{ required: true, whitespace: true }]}><Input.TextArea rows={3} maxLength={500} placeholder="例如：完成 MVP，本地核心功能已经可用" /></Form.Item>
      {goal?.goal_type === 'project' ? <Form.Item name="current_milestone" label="当前里程碑" rules={[{ required: true, whitespace: true }]}><Input maxLength={200} /></Form.Item> : null}
      {goal?.goal_type === 'direction' ? <Form.Item name="current_state" label="当前判断或状态"><Input.TextArea rows={2} maxLength={500} /></Form.Item> : null}
      {goal?.goal_type === 'result' ? <Form.Item name="current_value" label={`当前值${goal.value_unit ? `（${goal.value_unit}）` : ''}`} rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item> : null}
      {goal?.goal_type === 'habit' ? <Form.Item name="habit_completed_count" label="本周期已完成次数" rules={[{ required: true }]}><InputNumber min={0} precision={0} style={{ width: '100%' }} /></Form.Item> : null}
      <div className="plan-form-grid"><Form.Item name="next_action" label="下一步行动" rules={[{ required: true, whitespace: true }]}><Input maxLength={200} /></Form.Item><Form.Item name="next_action_due_at" label="行动截止日期" rules={[{ required: true, message: '请选择行动截止日期' }]}><Input type="date" /></Form.Item></div>
    </Form>
    <Divider titlePlacement="start">进展记录</Divider>
    {loading ? <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div> : items.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有进展记录" /> : <List size="small" dataSource={items} renderItem={item => <List.Item>
      <List.Item.Meta title={<Space><Tag>{item.occurred_at}</Tag><Typography.Text strong>{item.progress_note}</Typography.Text></Space>} description={<Space orientation="vertical" size={0}>
        {item.current_milestone ? <span>当时里程碑：{item.current_milestone}</span> : null}
        {item.current_state ? <span>当时状态：{item.current_state}</span> : null}
        {item.current_value != null ? <span>当时数值：{item.current_value}</span> : null}
        {item.habit_completed_count != null ? <span>当时完成：{item.habit_completed_count} 次</span> : null}
        <span>下一步：{item.next_action}</span>
        <span>当时截止：{item.next_action_due_at || '未设置'}</span>
      </Space>} />
    </List.Item>} />}
  </Modal>;
}
