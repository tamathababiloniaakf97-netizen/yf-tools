'use client';

import { useState } from 'react';
import { App, Button, List, Modal, Popconfirm, Tag, Typography } from 'antd';
import type { Ticker, TickerType } from '@/types';

interface Props {
  open: boolean;
  tickers: Ticker[];
  onClose: () => void;
  onDeleted: () => void | Promise<void>;
}

const typeLabels: Record<TickerType, string> = {
  stock_us: '美股',
  stock_hk: '港股',
  stock_a: 'A股',
  option: '期权',
  crypto: '加密',
};

export default function TickerManagerModal({ open, tickers, onClose, onDeleted }: Props) {
  const { message } = App.useApp();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (ticker: Ticker) => {
    setDeletingId(ticker.id);
    try {
      const response = await fetch(`/api/tickers/${ticker.id}`, { method: 'DELETE' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || '删除失败');
      message.success(`已删除 ${ticker.name} (${ticker.code})`);
      await onDeleted();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal title="管理标的" open={open} onCancel={onClose} footer={null}>
      <Typography.Paragraph type="secondary">
        只能删除没有交易记录的标的，已有流水的标的会被系统阻止删除。
      </Typography.Paragraph>
      <List
        bordered
        locale={{ emptyText: '暂无标的' }}
        dataSource={tickers}
        renderItem={(ticker) => (
          <List.Item
            actions={[
              <Popconfirm
                key="delete"
                title={`确定删除 ${ticker.name} (${ticker.code})？`}
                description="删除后无法恢复。"
                okText="确定"
                cancelText="取消"
                onConfirm={() => handleDelete(ticker)}
              >
                <Button danger type="link" loading={deletingId === ticker.id}>删除</Button>
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={ticker.name}
              description={<><Typography.Text code>{ticker.code}</Typography.Text> <Tag>{typeLabels[ticker.type]}</Tag></>}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}
