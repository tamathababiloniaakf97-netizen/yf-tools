'use client';

import React, { useState, useEffect } from 'react';
import { Button, App, Popconfirm, Table, Tag, Space, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Resource } from '@/types';
import ResourceModal from './ResourceModal';

export default function ResourceList() {
  const { message } = App.useApp();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const loadResources = async () => {
    const res = await fetch('/api/resources');
    if (res.ok) {
      const data = await res.json();
      setResources(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    void (async () => {
      await loadResources();
    })();
  }, []);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
    if (res.ok) {
      message.success('已删除');
      setLoading(true);
      loadResources();
    } else {
      message.error('删除失败');
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingResource(null);
    setModalOpen(true);
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'pdf' ? 'red' : 'blue'}>
          {type === 'pdf' ? 'PDF' : '链接'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 60,
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Resource) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定删除此资源？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>资源管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加资源
        </Button>
      </div>

      <Table
        dataSource={resources}
        columns={columns}
        rowKey="id"
        pagination={false}
      />

      <ResourceModal
        open={modalOpen}
        resource={editingResource}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          setLoading(true);
          loadResources();
        }}
      />
    </div>
  );
}
