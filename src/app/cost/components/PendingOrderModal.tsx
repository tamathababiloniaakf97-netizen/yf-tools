'use client';

import { useEffect } from 'react';
import { App, DatePicker, Form, InputNumber, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import type { OptionPosition, PendingOrder, PendingOrderCategory, Ticker } from '@/types';

interface Props {
  open: boolean;
  category: PendingOrderCategory;
  order?: PendingOrder | null;
  tickers: Ticker[];
  openPositions: OptionPosition[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function PendingOrderModal({ open, category, order, tickers, openPositions, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const optionAction = Form.useWatch('option_action', form);

  useEffect(() => {
    if (!open) return;
    if (order) {
      form.setFieldsValue({ ...order, order_date: dayjs(order.order_date), expiration_date: order.expiration_date ? dayjs(order.expiration_date) : undefined });
    } else {
      form.resetFields();
      form.setFieldsValue({ side: category === 'stock' ? 'buy' : 'sell', option_action: 'open', option_type: 'put', quantity: 1, order_date: dayjs() });
    }
  }, [open, order, category, form]);

  const selectPosition = (positionId: string) => {
    const position = openPositions.find((item) => item.position_id === positionId);
    if (!position) return;
    form.setFieldsValue({
      ticker_id: position.ticker_id,
      side: position.direction === 'sell' ? 'buy' : 'sell',
      option_type: position.type,
      strike_price: position.strike_price,
      expiration_date: position.expiration_date ? dayjs(position.expiration_date) : undefined,
      quantity: Math.min(1, position.remainingQuantity),
    });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      const body = {
        ticker_id: values.ticker_id,
        category,
        side: values.side,
        option_action: category === 'option' ? values.option_action : null,
        option_type: category === 'option' ? values.option_type : null,
        position_id: category === 'option' ? values.position_id ?? order?.position_id ?? null : null,
        quantity: values.quantity,
        price: values.price,
        strike_price: category === 'option' ? values.strike_price : null,
        expiration_date: category === 'option' ? values.expiration_date?.format('YYYY-MM-DD') : null,
        order_date: values.order_date.format('YYYY-MM-DD'),
      };
      const response = await fetch(order ? `/api/pending-orders/${order.id}` : '/api/pending-orders', {
        method: order ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || '保存挂单失败');
      message.success(order ? '挂单已修改' : '挂单已添加');
      onClose();
      onSuccess();
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  };

  return (
    <Modal title={`${order ? '修改' : '新增'}${category === 'stock' ? '股票' : '期权'}挂单`} open={open} onCancel={onClose} onOk={save} okText="保存">
      <Form form={form} layout="vertical">
        {category === 'option' && (
          <Form.Item name="option_action" label="动作" rules={[{ required: true }]}>
            <Select options={[{ value: 'open', label: '开仓' }, { value: 'close', label: '平仓' }]} />
          </Form.Item>
        )}
        {category === 'option' && optionAction === 'close' && (
          <Form.Item name="position_id" label="关联未平仓期权" rules={[{ required: true, message: '请选择期权仓位' }]}>
            <Select onChange={selectPosition} options={openPositions.map((item) => ({ value: item.position_id, label: `${item.ticker_name || item.ticker_id} ${item.type.toUpperCase()} ${item.strike_price ?? ''} ${item.expiration_date ?? ''}（剩余 ${item.remainingQuantity}）` }))} />
          </Form.Item>
        )}
        <Form.Item name="ticker_id" label="标的" rules={[{ required: true, message: '请选择标的' }]}>
          <Select showSearch disabled={category === 'option' && optionAction === 'close'} optionFilterProp="label" options={tickers.map((ticker) => ({ value: ticker.id, label: `${ticker.name} (${ticker.code})` }))} />
        </Form.Item>
        <Form.Item name="side" label="方向" rules={[{ required: true }]}>
          <Select disabled={category === 'option' && optionAction === 'close'} options={[{ value: 'buy', label: 'BUY / 买入' }, { value: 'sell', label: 'SELL / 卖出' }]} />
        </Form.Item>
        {category === 'option' && (
          <Form.Item name="option_type" label="CALL / PUT" rules={[{ required: true }]}>
            <Select disabled={optionAction === 'close'} options={[{ value: 'call', label: 'CALL' }, { value: 'put', label: 'PUT' }]} />
          </Form.Item>
        )}
        <Form.Item name="quantity" label={category === 'stock' ? '数量' : '合约数量'} rules={[{ required: true }]}>
          <InputNumber min={0.000001} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="price" label={category === 'stock' ? '挂单价（原始币种）' : '每张合约实际权利金（USD，已 ×100）'} rules={[{ required: true }]}>
          <InputNumber min={0.000001} precision={4} style={{ width: '100%' }} />
        </Form.Item>
        {category === 'option' && (
          <>
            <Form.Item name="strike_price" label="行权价（USD）" rules={[{ required: true }]}><InputNumber min={0.000001} precision={4} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="expiration_date" label="到期日" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          </>
        )}
        <Form.Item name="order_date" label="挂单日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
      </Form>
    </Modal>
  );
}
