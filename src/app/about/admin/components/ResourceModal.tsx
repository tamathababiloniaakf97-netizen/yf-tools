'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Radio, Upload, Button, App } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload';
import type { Resource } from '@/types';

interface Props {
  open: boolean;
  resource: Resource | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResourceModal({ open, resource, onClose, onSuccess }: Props) {
  const instanceKey = `${open ? 'open' : 'closed'}-${resource?.id ?? 'new'}`;
  return (
    <ResourceModalContent
      key={instanceKey}
      open={open}
      resource={resource}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function ResourceModalContent({ open, resource, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [type, setType] = useState<'pdf' | 'link'>(resource?.type ?? 'link');
  const [file, setFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!resource;

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);

    try {
      if (type === 'pdf' && !isEdit) {
        // 新建 PDF：multipart 上传
        if (!file) {
          message.error('请选择 PDF 文件');
          setSubmitting(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', values.title);
        formData.append('description', values.description || '');
        formData.append('sort_order', String(values.sort_order || 0));

        const res = await fetch('/api/resources', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || '上传失败');
        }
      } else if (type === 'pdf' && isEdit) {
        // 编辑 PDF：如果有新文件则 multipart，否则 JSON
        if (file) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('title', values.title);
          formData.append('description', values.description || '');
          formData.append('sort_order', String(values.sort_order || 0));

          const res = await fetch(`/api/resources/${resource.id}`, { method: 'PUT', body: formData });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || '更新失败');
          }
        } else {
          const res = await fetch(`/api/resources/${resource.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: values.title,
              description: values.description || '',
              sort_order: values.sort_order || 0,
            }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || '更新失败');
          }
        }
      } else {
        // 链接：JSON
        const body = {
          title: values.title,
          description: values.description || '',
          url: values.url,
          sort_order: values.sort_order || 0,
        };

        const url = isEdit ? `/api/resources/${resource.id}` : '/api/resources';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || '保存失败');
        }
      }

      message.success(isEdit ? '已更新' : '已添加');
      onSuccess();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑资源' : '添加资源'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      destroyOnHidden
      width={560}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={resource ? {
          title: resource.title,
          description: resource.description || '',
          url: resource.type === 'link' ? resource.url : '',
          sort_order: resource.sort_order,
        } : undefined}
        style={{ marginTop: 16 }}
      >
        <Form.Item label="资源类型">
          <Radio.Group
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isEdit}
          >
            <Radio.Button value="link">外部链接</Radio.Button>
            <Radio.Button value="pdf">PDF 文件</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="资源标题" />
        </Form.Item>

        <Form.Item name="description" label="描述">
          <Input.TextArea rows={2} placeholder="简短描述（可选）" />
        </Form.Item>

        {type === 'link' ? (
          <Form.Item
            name="url"
            label="链接地址"
            rules={[{ required: true, message: '请输入链接' }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>
        ) : (
          <Form.Item label="PDF 文件" required={!isEdit}>
            <Upload
              fileList={fileList}
              maxCount={1}
              accept=".pdf"
              beforeUpload={(f) => {
                setFile(f);
                setFileList([{ uid: '-1', name: f.name, status: 'done' }]);
                return false;
              }}
              onRemove={() => {
                setFile(null);
                setFileList([]);
              }}
            >
              <Button icon={<UploadOutlined />}>
                {isEdit ? '替换文件（可选）' : '选择 PDF 文件'}
              </Button>
            </Upload>
          </Form.Item>
        )}

        <Form.Item name="sort_order" label="排序" extra="数字越小越靠前">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
