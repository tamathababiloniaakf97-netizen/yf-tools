'use client';

import React, { useState } from 'react';
import { Alert, App, Button, Form, Input, List, Modal, Radio, Select, Space, Typography } from 'antd';
import type { TickerType, Currency } from '@/types';
import type { TickerCandidate } from '@/lib/market-data/ticker-search';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const typeOptions: { value: TickerType; label: string }[] = [
  { value: 'stock_us', label: '美股' },
  { value: 'stock_hk', label: '港股' },
  { value: 'stock_a', label: 'A股' },
  { value: 'option', label: '期权' },
  { value: 'crypto', label: '加密' },
];

const currencyOptions: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD' },
  { value: 'HKD', label: 'HKD' },
  { value: 'CNY', label: 'CNY' },
];

export default function TickerModal({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [manual, setManual] = useState(false);
  const [category, setCategory] = useState<'stock' | 'crypto'>('stock');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<TickerCandidate[]>([]);
  const [selected, setSelected] = useState<TickerCandidate | null>(null);

  const resetState = () => {
    form.resetFields();
    setManual(false);
    setCategory('stock');
    setQuery('');
    setCandidates([]);
    setSelected(null);
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      message.warning('请输入标的名称或代码');
      return;
    }
    setSearching(true);
    setSelected(null);
    try {
      const res = await fetch(`/api/tickers/search?query=${encodeURIComponent(query.trim())}&category=${category}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '搜索失败');
      setCandidates(data.candidates || []);
      if (!data.candidates?.length) message.info('没有找到匹配标的，可改用手动填写');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '搜索失败');
      setCandidates([]);
    } finally {
      setSearching(false);
    }
  };

  const chooseCandidate = (candidate: TickerCandidate) => {
    setSelected(candidate);
    form.setFieldsValue({
      name: candidate.name,
      code: candidate.code,
      type: candidate.type,
      currency: candidate.currency,
    });
  };

  const handleOk = async () => {
    try {
      if (!manual && !selected) {
        message.warning('请先从搜索结果中选择一个标的');
        return;
      }
      const values = await form.validateFields();
      const res = await fetch('/api/tickers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      message.success('标的添加成功');
      form.resetFields();
      onClose();
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    }
  };

  return (
    <Modal
      title="添加标的"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      afterClose={resetState}
      okText="确认添加"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        {!manual ? (
          <>
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              <Radio.Group value={category} onChange={(event) => { setCategory(event.target.value); setCandidates([]); setSelected(null); }}>
                <Radio.Button value="stock">股票 / ETF</Radio.Button>
                <Radio.Button value="crypto">加密货币</Radio.Button>
              </Radio.Group>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onPressEnter={handleSearch}
                  placeholder={category === 'stock' ? '输入名称或代码，如：腾讯控股 / AAPL' : '输入名称或代码，如：比特币 / BTC'}
                />
                <Button type="primary" loading={searching} onClick={handleSearch}>搜索</Button>
              </Space.Compact>
              {candidates.length > 0 && (
                <List
                  size="small"
                  bordered
                  dataSource={candidates}
                  renderItem={(candidate) => (
                    <List.Item
                      actions={[<Button key="choose" type={selected?.id === candidate.id ? 'primary' : 'link'} onClick={() => chooseCandidate(candidate)}>{selected?.id === candidate.id ? '已选择' : '选择'}</Button>]}
                    >
                      <List.Item.Meta title={`${candidate.name} (${candidate.code})`} description={`${candidate.market} · ${candidate.currency}`} />
                    </List.Item>
                  )}
                />
              )}
              {selected && <Alert type="success" showIcon message={`已选：${selected.name} (${selected.code})`} description={`类型和币种已自动识别为 ${selected.type} / ${selected.currency}`} />}
              <Button type="link" style={{ paddingInline: 0, alignSelf: 'flex-start' }} onClick={() => { setManual(true); setSelected(null); form.resetFields(); }}>
                找不到？手动填写
              </Button>
            </Space>
            <Form.Item name="name" hidden rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="code" hidden rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="type" hidden rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="currency" hidden rules={[{ required: true }]}><Input /></Form.Item>
          </>
        ) : (
          <>
            <Typography.Paragraph type="secondary">手动填写时请确认代码和市场，错误代码将无法同步价格。</Typography.Paragraph>
            <Form.Item name="name" label="标的名称" rules={[{ required: true, message: '请输入标的名称' }]}><Input /></Form.Item>
            <Form.Item name="code" label="代码" rules={[{ required: true, message: '请输入代码' }]}><Input placeholder="如：AAPL / 00700 / 600519 / BTC-USD" /></Form.Item>
            <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}><Select options={typeOptions} /></Form.Item>
            <Form.Item name="currency" label="原始币种" rules={[{ required: true, message: '请选择币种' }]}><Select options={currencyOptions} /></Form.Item>
            <Button type="link" style={{ paddingInline: 0 }} onClick={() => { setManual(false); form.resetFields(); }}>返回搜索
            </Button>
          </>
        )}
        <Form.Item name="style" label="属性">
          <Select
            allowClear
            placeholder="选择属性（可选）"
            options={[
              { value: 'offensive', label: '进攻' },
              { value: 'balanced', label: '平衡' },
              { value: 'defensive', label: '防守' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
