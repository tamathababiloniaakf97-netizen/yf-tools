'use client';

import React, { useEffect, useMemo } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, App } from 'antd';
import dayjs from 'dayjs';
import type { Ticker, TransactionType, OptionPosition, Transaction } from '@/types';
import { flowClassName, formatFlowAmount, valueFlow } from '@/lib/household-finance/amount-presentation';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tickers: Ticker[];
  openPositions?: OptionPosition[]; // 未平仓期权仓位（用于平仓选择）
  editingTransaction?: Transaction | null; // 编辑模式
}

const typeOptions: { value: TransactionType; label: string }[] = [
  { value: 'buy', label: '买入' },
  { value: 'sell', label: '卖出' },
  { value: 'dividend', label: '分红' },
  { value: 'option_income', label: '期权' },
  { value: 'deposit', label: '入金' },
  { value: 'withdraw', label: '出金' },
];

const actionOptions = [
  { value: 'open', label: '开仓' },
  { value: 'close', label: '平仓' },
];

const directionOptions = [
  { value: 'sell', label: 'SELL（收入）' },
  { value: 'buy', label: 'BUY（支出）' },
];

const callPutOptions = [
  { value: 'put', label: 'PUT' },
  { value: 'call', label: 'CALL' },
];

/** 生成简短的 position_id */
function genPositionId(): string {
  return 'opt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

/** 计算期权 amount_usd（SELL=+，BUY=-） */
function computeAmount(direction: string, price: number, quantity: number): number {
  return (direction === 'sell' ? 1 : -1) * price * quantity;
}

/** 格式化期权仓位用于下拉显示 */
function formatOptionLabel(pos: OptionPosition, tickerName: string): string {
  const dir = pos.direction === 'sell' ? 'SHORT' : 'LONG';
  const type = pos.type === 'put' ? 'PUT' : 'CALL';
  const strike = pos.strike_price ? ` ${pos.strike_price}` : '';
  const expiry = pos.expiration_date ? ` ${pos.expiration_date}` : '';
  const qty = pos.remainingQuantity > 1 ? ` (x${pos.remainingQuantity})` : '';
  return `${tickerName} ${type}${strike}${expiry} ${dir}${qty}`;
}

export default function TransactionModal({ open, onClose, onSuccess, tickers, openPositions = [], editingTransaction }: Props) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const txType = Form.useWatch('type', form);
  const optAction = Form.useWatch('option_action', form);
  const selectedTickerId = Form.useWatch('ticker_id', form);
  const isEdit = !!editingTransaction;

  const selectedTicker = useMemo(
    () => tickers.find(t => t.id === selectedTickerId),
    [selectedTickerId, tickers]
  );

  // 当前 ticker 的未平仓期权
  const tickerOpenPositions = useMemo(
    () => openPositions.filter(p => p.ticker_id === selectedTickerId && p.status === 'open' && p.remainingQuantity > 0),
    [openPositions, selectedTickerId]
  );

  useEffect(() => {
    if (!open) return;
    if (editingTransaction) {
      const tx = editingTransaction;
      const optDetail = tx.option_detail as Record<string, unknown> | null;
      const values: Record<string, unknown> = {
        type: tx.type,
        ticker_id: tx.ticker_id,
        trade_date: tx.trade_date ? dayjs(tx.trade_date) : undefined,
        note: tx.note || '',
      };
      if (tx.type === 'buy' || tx.type === 'sell') {
        values.quantity = tx.quantity;
        values.price = tx.price;
      } else if (tx.type === 'dividend' || tx.type === 'deposit' || tx.type === 'withdraw') {
        values.amount_orig = tx.amount_orig;
      } else if (tx.type === 'option_income' && optDetail) {
        values.option_action = optDetail.action;
        values.option_quantity = optDetail.quantity;
        values.option_price = optDetail.price;
        values.option_strike_price = optDetail.strike_price || undefined;
        values.option_expiration_date = optDetail.expiration_date ? dayjs(optDetail.expiration_date as string) : undefined;
        if (optDetail.action === 'open') {
          values.option_direction = optDetail.direction;
          values.option_call_put = optDetail.type;
        } else {
          values.selected_position_id = optDetail.position_id;
        }
      }
      form.setFieldsValue(values);
    } else {
      form.resetFields();
    }
  }, [open, editingTransaction, form]);

  /** 确认按钮 */
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const body: Record<string, unknown> = {
        type: values.type,
        currency: values.currency || 'USD',
        trade_date: values.trade_date?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
        note: values.note || '',
      };

      if (values.type === 'buy' || values.type === 'sell') {
        body.ticker_id = values.ticker_id;
        body.quantity = values.quantity;
        body.price = values.price;
        body.amount_orig = values.amount_orig || null;
        body.currency = selectedTicker?.currency || 'USD';
      } else if (values.type === 'dividend') {
        body.ticker_id = values.ticker_id;
        body.amount_orig = values.amount_orig;
        body.amount_usd = values.amount_usd;
        body.currency = selectedTicker?.currency || 'USD';
      } else if (values.type === 'option_income') {
        const direction = values.option_direction || 'sell';
        const callPut = values.option_call_put || 'put';
        const action = values.option_action || 'open';
        const price = values.option_price ?? 0;
        const quantity = values.option_quantity ?? 1;

        // position_id：开仓新建，平仓从选中仓位获取
        const positionId =
          action === 'close' && values.selected_position_id
            ? values.selected_position_id
            : genPositionId();

        body.ticker_id = values.ticker_id;
        body.currency = 'USD';
        body.option_detail = {
          direction,
          type: callPut,
          action,
          position_id: positionId,
          quantity,
          price,
          strike_price: values.option_strike_price || null,
          expiration_date: values.option_expiration_date?.format('YYYY-MM-DD') || null,
        };
        body.amount_usd = computeAmount(direction, price, quantity);
      } else if (values.type === 'deposit' || values.type === 'withdraw') {
        body.amount_orig = values.amount_orig;
        body.amount_usd = values.amount_orig;
        body.currency = 'USD';
      }

      const url = isEdit ? `/api/transactions/${editingTransaction!.id}` : '/api/transactions';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      message.success(isEdit ? '交易记录已更新' : '交易记录添加成功');
      form.resetFields();
      onClose();
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    }
  };

  const requiresTicker = txType && ['buy', 'sell', 'dividend', 'option_income'].includes(txType);
  const requiresQuantity = txType && ['buy', 'sell'].includes(txType);
  const isOption = txType === 'option_income';

  return (
    <Modal
      title={isEdit ? '编辑交易' : '录入交易'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText={isEdit ? '保存修改' : '确认录入'}
      cancelText="取消"
      width={520}
    >
      <Form form={form} layout="vertical" initialValues={{ type: 'buy' }}>
        {/* 交易类型 */}
        <Form.Item name="type" label="交易类型" rules={[{ required: true }]}>
          <Select options={typeOptions} />
        </Form.Item>

        {/* 标的选择 */}
        {requiresTicker && (
          <Form.Item name="ticker_id" label="标的" rules={[{ required: true, message: '请选择标的' }]}>
            <Select
              showSearch
              placeholder="搜索并选择标的"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={tickers.map((t) => ({
                value: t.id,
                label: `${t.name} (${t.code})`,
              }))}
            />
          </Form.Item>
        )}

        {/* 股票买卖：数量和单价 */}
        {requiresQuantity && (
          <>
            <Form.Item name="quantity" label="数量" rules={[{ required: true, message: '请输入数量' }]}>
              <InputNumber style={{ width: '100%' }} placeholder="如：100" />
            </Form.Item>
            <Form.Item name="price" label="单价（原始币种）" rules={[{ required: true, message: '请输入单价' }]}>
              <InputNumber style={{ width: '100%' }} placeholder="如：400" precision={4} />
            </Form.Item>
          </>
        )}

        {/* 分红 / 入金 / 出金 */}
        {['dividend', 'deposit', 'withdraw'].includes(txType) && (
          <Form.Item
            name="amount_orig"
            label={txType === 'dividend' ? '分红金额（原始币种）' : '金额（USD）'}
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="如：500" precision={2} />
          </Form.Item>
        )}

        {/* ============================================================
            期权：仅记录真实交易（BUY/SELL + CALL/PUT + price × quantity）
            ============================================================ */}
        {isOption && (
          <>
            {/* 动作：开仓 / 平仓 */}
            <Form.Item name="option_action" label="动作" rules={[{ required: true }]} initialValue="open">
              <Select options={actionOptions} />
            </Form.Item>

            {optAction === 'open' && (
              <>
                {/* 开仓：方向（BUY/SELL）+ 类型（CALL/PUT） */}
                <Form.Item name="option_direction" label="方向" rules={[{ required: true }]} initialValue="sell">
                  <Select options={directionOptions} />
                </Form.Item>
                <Form.Item name="option_call_put" label="类型" rules={[{ required: true }]} initialValue="put">
                  <Select options={callPutOptions} />
                </Form.Item>
                <div style={{ color: '#888', fontSize: 12, marginTop: -16, marginBottom: 16 }}>
                  SELL = 收入 | BUY = 支出
                </div>
              </>
            )}

            {optAction === 'close' && (
              <>
                {/* 平仓：选择已有期权仓位 */}
                <Form.Item
                  name="selected_position_id"
                  label="选择已有期权仓位"
                  rules={[{ required: true, message: '请选择要平仓的期权' }]}
                >
                  <Select
                    placeholder="选择未平仓期权..."
                    disabled={tickerOpenPositions.length === 0 && !isEdit}
                    options={(() => {
                      const opts = tickerOpenPositions.map((p) => {
                        const t = tickers.find(tt => tt.id === p.ticker_id);
                        return {
                          value: p.position_id,
                          label: formatOptionLabel(p, t?.name || p.ticker_id),
                        };
                      });
                      // 编辑模式下，如果原仓位已平仓不在列表中，追加显示
                      if (isEdit && editingTransaction?.option_detail) {
                        const od = editingTransaction.option_detail;
                        const alreadyInList = opts.some(o => o.value === od.position_id);
                        if (!alreadyInList && od.position_id) {
                          const t = tickers.find(tt => tt.id === editingTransaction.ticker_id);
                          opts.push({
                            value: od.position_id,
                            label: `[已平仓] ${formatOptionLabel(
                              { position_id: od.position_id, direction: od.direction, type: od.type } as OptionPosition,
                              t?.name || ''
                            )}`,
                          });
                        }
                      }
                      return opts;
                    })()}
                  />
                </Form.Item>
                {tickerOpenPositions.length === 0 && selectedTickerId && (
                  <div style={{ color: '#999', fontSize: 13, marginTop: -16, marginBottom: 16 }}>
                    当前标的下无未平仓期权
                  </div>
                )}

                {/* 平仓时确认方向（锁死，不可编辑） */}
                <Form.Item shouldUpdate={(prev, cur) => prev.selected_position_id !== cur.selected_position_id}>
                  {({ getFieldValue }) => {
                    const selId = getFieldValue('selected_position_id');
                    const pos = openPositions.find(p => p.position_id === selId);
                    if (!pos) return null;
                    const closeDir = pos.direction === 'sell' ? '买入' : '卖出';
                    return (
                      <div style={{ color: '#555', marginBottom: 16, fontSize: 13, background: '#f5f5f5', padding: '8px 12px', borderRadius: 6 }}>
                        平仓方向：{closeDir} {pos.type.toUpperCase()}
                        （{pos.direction === 'sell' ? 'BUY TO CLOSE' : 'SELL TO CLOSE'}）
                      </div>
                    );
                  }}
                </Form.Item>
              </>
            )}

            {/* 数量和权利金（开仓/平仓共用） */}
            <Form.Item
              name="option_quantity"
              label="合约数量"
              rules={[{ required: true, message: '请输入合约数量' }]}
              initialValue={1}
            >
              <InputNumber style={{ width: '100%' }} placeholder="如：1" min={1} />
            </Form.Item>
            <Form.Item
              name="option_price"
              label="每张合约权利金（USD）"
              rules={[{ required: true, message: '请输入权利金' }]}
            >
              <InputNumber style={{ width: '100%' }} placeholder="如：3.00" precision={2} min={0} />
            </Form.Item>

            {/* 自动预览 */}
            <Form.Item
              noStyle
              shouldUpdate={(prev, cur) =>
                prev.option_direction !== cur.option_direction ||
                prev.option_price !== cur.option_price ||
                prev.option_quantity !== cur.option_quantity
              }
            >
              {({ getFieldsValue }) => {
                const v = getFieldsValue();
                if (!v.option_price || !v.option_quantity) return null;
                const amount = computeAmount(
                  v.option_direction || 'sell',
                  v.option_price,
                  v.option_quantity
                );
                const dirLabel = (v.option_direction || 'sell') === 'sell' ? 'SELL' : 'BUY';
                return (
                  <div style={{ color: '#666', marginBottom: 16 }}>
                    {dirLabel} × {v.option_quantity} @ ${v.option_price} =
                    <span className={flowClassName(valueFlow(amount))}>
                      {' '}{formatFlowAmount(amount, valueFlow(amount), 'USD')}
                    </span>
                  </div>
                );
              }}
            </Form.Item>

            {/* 行权价 + 到期日 */}
            <Form.Item name="option_strike_price" label="行权价（USD）">
              <InputNumber style={{ width: '100%' }} placeholder="如：400" precision={2} />
            </Form.Item>
            <Form.Item name="option_expiration_date" label="到期日">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}

        {/* 交易日期 */}
        <Form.Item name="trade_date" label="交易日期" initialValue={undefined}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        {/* 备注 */}
        <Form.Item name="note" label="备注">
          <Input.TextArea rows={2} placeholder="可选备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
