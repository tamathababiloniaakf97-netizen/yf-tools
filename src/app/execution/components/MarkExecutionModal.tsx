'use client';

import React, { useEffect } from 'react';
import { Modal, Form, InputNumber, Input, DatePicker, App } from 'antd';

interface ExecutionData {
  status: 'pending' | 'executed';
  actualPrice?: number;
  actualQuantity?: number;
  executedAt?: string;
  note?: string;
}

interface MarkExecutionModalProps {
  open: boolean;
  title: string;
  planPrice: number;
  planQuantity: number;
  initialData?: ExecutionData | null;
  onOk: (data: ExecutionData) => void;
  onCancel: () => void;
}

export default function MarkExecutionModal({
  open,
  title,
  planPrice,
  planQuantity,
  initialData,
  onOk,
  onCancel,
}: MarkExecutionModalProps) {
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    if (open) {
      if (initialData?.status === 'executed') {
        form.setFieldsValue({
          actualPrice: initialData.actualPrice ?? undefined,
          actualQuantity: initialData.actualQuantity ?? undefined,
          executedAt: initialData.executedAt ?? undefined,
          note: initialData.note ?? '',
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, initialData, form]);

  const handleOk = () => {
    const values = form.getFieldsValue();
    onOk({
      status: 'executed',
      actualPrice: values.actualPrice ?? undefined,
      actualQuantity: values.actualQuantity ?? undefined,
      executedAt: values.executedAt
        ? new Date(values.executedAt).toISOString().split('T')[0]
        : undefined,
      note: values.note?.trim() || undefined,
    });
  };

  const handleCancelExecution = () => {
    onOk({ status: 'pending' });
  };

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="确认执行"
      cancelText="取消"
      footer={(_, { OkBtn, CancelBtn }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {initialData?.status === 'executed' && (
              <button
                onClick={handleCancelExecution}
                style={{
                  padding: '4px 12px',
                  border: '1px solid #ff4d4f',
                  borderRadius: 4,
                  background: '#fff',
                  color: '#ff4d4f',
                  cursor: 'pointer',
                }}
              >
                取消执行
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <CancelBtn />
            <OkBtn />
          </div>
        </div>
      )}
    >
      <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f5f5f5', borderRadius: 4 }}>
        <span style={{ fontSize: 13, color: '#666' }}>
          计划: ${planPrice} × {planQuantity}股
        </span>
      </div>

      <Form form={form} layout="vertical" size="small">
        <Form.Item label="实际成交价（选填）" name="actualPrice">
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            precision={2}
            prefix="$"
            placeholder="留空则默认等于计划价"
          />
        </Form.Item>
        <Form.Item label="实际数量（选填）" name="actualQuantity">
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            placeholder={`留空则默认 ${planQuantity} 股`}
          />
        </Form.Item>
        <Form.Item label="执行日期（选填）" name="executedAt">
          <DatePicker style={{ width: '100%' }} placeholder="留空则不记录日期" />
        </Form.Item>
        <Form.Item label="备注（选填）" name="note">
          <Input.TextArea rows={2} placeholder="例如：偏离不到1%" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
