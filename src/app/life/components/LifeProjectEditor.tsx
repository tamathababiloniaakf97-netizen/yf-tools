'use client';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Space, Switch } from 'antd';
import { useEffect } from 'react';
import type { LifeReinforcementProject, LifeReinforcementProjectInput } from '@/types/life-os';

type Props = {
  open: boolean;
  initial: LifeReinforcementProject | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (value: LifeReinforcementProjectInput) => Promise<void>;
};

export default function LifeProjectEditor({ open, initial, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<LifeReinforcementProjectInput>();
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(initial ? {
      name: initial.name,
      long_term_goal: initial.long_term_goal,
      practical_method: initial.practical_method,
      stages: initial.stages,
      is_active: initial.is_active,
    } : { name: '', long_term_goal: '', practical_method: '', stages: [''], is_active: true });
  }, [form, initial, open]);

  return <Modal title={initial ? '编辑补强项目' : '新增补强项目'} open={open} confirmLoading={saving}
    okText="保存" cancelText="取消" onCancel={onCancel} onOk={() => form.validateFields().then(onSubmit)}>
    <Form form={form} layout="vertical">
      <Form.Item name="name" label="项目名称" rules={[{ required: true, whitespace: true, message: '请填写项目名称' }]}>
        <Input maxLength={100} />
      </Form.Item>
      <Form.Item name="long_term_goal" label="长期目标"><Input.TextArea rows={3} maxLength={1000} /></Form.Item>
      <Form.Item name="practical_method" label="实用方法"><Input.TextArea rows={4} maxLength={2000} /></Form.Item>
      <Form.List name="stages">
        {(fields, { add, remove }) => <Space orientation="vertical" style={{ width: '100%' }}>
          <strong>训练阶段</strong>
          {fields.map((field, index) => <Space key={field.key} style={{ width: '100%' }}>
            <Form.Item {...field} style={{ marginBottom: 0 }}><Input aria-label={`训练阶段 ${index + 1}`} maxLength={100} /></Form.Item>
            <Button type="text" danger aria-label={`删除阶段 ${index + 1}`} icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
          </Space>)}
          <Button type="dashed" icon={<PlusOutlined />} onClick={() => add('')}>新增阶段</Button>
        </Space>}
      </Form.List>
      {initial && <Form.Item name="is_active" label="启用项目" valuePropName="checked" style={{ marginTop: 20 }}><Switch /></Form.Item>}
    </Form>
  </Modal>;
}
