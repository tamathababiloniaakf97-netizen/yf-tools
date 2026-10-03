'use client';

import { useCallback, useMemo, useState } from 'react';
import { Alert, Button, Card, Collapse, Divider, Drawer, Empty, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Spin, Statistic, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { calculatePortfolioAccountLocations } from '@/lib/portfolio-account-locations';
import type { PortfolioAccountCashBalance, PortfolioAccountLocation, PortfolioAccountPositionAllocation, PortfolioAccountType, Position } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  positions: Position[];
  cashBalance: number;
}

const typeLabels: Record<PortfolioAccountType, string> = { brokerage: '证券账户', bank: '银行账户', crypto_wallet: '加密钱包', other: '其他账户' };
const emptyAccount = (): PortfolioAccountLocation => ({
  name: '', account_type: 'brokerage', login_url: '', login_account: '', password_hint: '', two_factor_hint: '', location_note: '', broker_reported_total_usd: null,
  cash_balances: [], positions: [], sort_order: 0,
});
const copyAccount = (account: PortfolioAccountLocation): PortfolioAccountLocation => ({ ...account, cash_balances: account.cash_balances.map(item => ({ ...item })), positions: account.positions.map(item => ({ ...item })) });
const usd = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AccountDistributionDrawer({ open, onClose, positions, cashBalance }: Props) {
  const [accounts, setAccounts] = useState<PortfolioAccountLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<PortfolioAccountLocation>(emptyAccount());
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/portfolio-accounts');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '账户分布加载失败');
      setAccounts((data.accounts ?? []).map((account: PortfolioAccountLocation, index: number) => ({ ...account, broker_reported_total_usd: account.broker_reported_total_usd == null ? null : Number(account.broker_reported_total_usd), sort_order: index })));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '账户分布加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const calculated = useMemo(() => calculatePortfolioAccountLocations(accounts, positions, cashBalance), [accounts, positions, cashBalance]);
  const openEditor = (index?: number) => {
    setEditingIndex(index ?? null);
    setDraft(index == null ? { ...emptyAccount(), sort_order: accounts.length } : copyAccount(accounts[index]));
    setEditorOpen(true);
  };
  const updateDraft = <K extends keyof PortfolioAccountLocation>(key: K, value: PortfolioAccountLocation[K]) => setDraft(current => ({ ...current, [key]: value }));
  const saveDraft = () => {
    if (!draft.name.trim()) { setError('请填写账户名称'); return; }
    if (draft.cash_balances.some(item => !item.currency.trim() || !Number.isFinite(item.amount) || !Number.isFinite(item.usd_rate) || item.usd_rate <= 0)) { setError('现金币种、金额或兑美元汇率无效'); return; }
    if (draft.positions.some(item => !item.ticker_id || !Number.isFinite(item.quantity) || item.quantity < 0)) { setError('持仓标的或数量无效'); return; }
    setAccounts(current => editingIndex == null ? [...current, { ...copyAccount(draft), sort_order: current.length }] : current.map((item, index) => index === editingIndex ? { ...copyAccount(draft), sort_order: index } : item));
    setError('');
    setEditorOpen(false);
  };
  const saveAll = async () => {
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/portfolio-accounts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accounts }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '保存失败');
      setNotice('账户分布已保存');
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return <>
    <Drawer title={<div><div>账户分布</div><Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>记录钱和资产放在哪里；原持仓成本与收益算法不变</Typography.Text></div>} size="large" open={open} afterOpenChange={opened => { if (opened) void load(); }} onClose={onClose} extra={<Button type="primary" loading={saving} onClick={() => void saveAll()}>保存账户分布</Button>}>
      {error ? <Alert type="error" showIcon title={error} closable onClose={() => setError('')} style={{ marginBottom: 12 }} /> : null}
      {notice ? <Alert type="success" showIcon title={notice} closable onClose={() => setNotice('')} style={{ marginBottom: 12 }} /> : null}
      <Alert
        type={calculated.is_reconciled ? 'success' : 'warning'} showIcon style={{ marginBottom: 16 }}
        title={calculated.is_reconciled ? '账户分配与系统汇总一致' : '账户分配尚未与系统汇总对齐'}
        description={calculated.is_reconciled ? `系统计算合计 ${usd(calculated.calculated_total_usd)}` : `现金差额 ${usd(calculated.cash_difference_usd)}；请展开“数量对账”查看尚未分配的持仓。`}
      />
      <Collapse size="small" style={{ marginBottom: 16 }} items={[{ key: 'reconciliation', label: '数量对账', children: <Space orientation="vertical" style={{ width: '100%' }}>
        {calculated.position_reconciliation.map(item => <div key={item.ticker_id} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{item.ticker_name}（{item.ticker_code}）</span><span>{item.allocated_quantity} / {item.expected_quantity} <Tag color={Math.abs(item.difference) < 1e-8 ? 'green' : 'orange'}>{Math.abs(item.difference) < 1e-8 ? '一致' : `差 ${item.difference}`}</Tag></span></div>)}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>现金（折算 USD）</span><span>{usd(calculated.allocated_cash_usd)} / {usd(cashBalance)}</span></div>
      </Space> }]} />

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div> : calculated.accounts.length === 0 ? <Empty description="尚未录入账户位置"><Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>新增账户</Button></Empty> : <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        {calculated.accounts.map((account, index) => <Card key={account.id ?? `${account.name}-${index}`} size="small" title={<Space><span>{account.name}</span><Tag>{typeLabels[account.account_type]}</Tag></Space>} extra={<Space>
          <Button type="text" aria-label={`编辑 ${account.name}`} icon={<EditOutlined />} onClick={() => openEditor(index)} />
          <Popconfirm title="删除这个账户位置？" onConfirm={() => setAccounts(current => current.filter((_, itemIndex) => itemIndex !== index).map((item, itemIndex) => ({ ...item, sort_order: itemIndex })))}><Button danger type="text" aria-label={`删除 ${account.name}`} icon={<DeleteOutlined />} /></Popconfirm>
        </Space>}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <Statistic title="系统计算总额" value={account.calculated_total_usd} precision={2} prefix="$" styles={{ content: { fontSize: 20 } }} />
            <Statistic title="现金" value={account.cash_value_usd} precision={2} prefix="$" styles={{ content: { fontSize: 16 } }} />
            <Statistic title="持仓市值" value={account.position_value_usd} precision={2} prefix="$" styles={{ content: { fontSize: 16 } }} />
          </div>
          {account.broker_difference_usd != null ? <Alert style={{ marginTop: 12 }} type={Math.abs(account.broker_difference_usd) < 1 ? 'success' : 'info'} title={`券商显示差额 ${account.broker_difference_usd >= 0 ? '+' : '-'}${usd(Math.abs(account.broker_difference_usd))}`} description="仅用于发现未结算资金、费用、漏录资产或行情时间差，不参与系统总额。" /> : null}
          <Divider style={{ marginBlock: 12 }} />
          <Space wrap>{account.cash_balances.map((item, itemIndex) => <Tag key={`${item.currency}-${itemIndex}`}>{item.currency} {item.amount.toLocaleString()}</Tag>)}{account.positions.map((item, itemIndex) => { const position = positions.find(value => value.ticker.id === item.ticker_id); return <Tag key={`${item.ticker_id}-${itemIndex}`}>{position?.ticker.code ?? '未知标的'} {item.quantity} {position?.ticker.type === 'crypto' ? position.ticker.code : '股'}</Tag>; })}</Space>
          {(account.login_url || account.login_account || account.password_hint || account.two_factor_hint || account.location_note) ? <Collapse ghost size="small" style={{ marginTop: 8 }} items={[{ key: 'login', label: '登录与存放提示', children: <Space orientation="vertical" size={2}>
            {account.login_url ? <Typography.Text><Typography.Text type="secondary">登录入口：</Typography.Text>{account.login_url}</Typography.Text> : null}
            {account.login_account ? <Typography.Text><Typography.Text type="secondary">登录账号：</Typography.Text>{account.login_account}</Typography.Text> : null}
            {account.password_hint ? <Typography.Text><Typography.Text type="secondary">密码提示：</Typography.Text>{account.password_hint}</Typography.Text> : null}
            {account.two_factor_hint ? <Typography.Text><Typography.Text type="secondary">二次验证：</Typography.Text>{account.two_factor_hint}</Typography.Text> : null}
            {account.location_note ? <Typography.Text><Typography.Text type="secondary">存放位置：</Typography.Text>{account.location_note}</Typography.Text> : null}
          </Space> }]} /> : null}
        </Card>)}
        <Button block icon={<PlusOutlined />} onClick={() => openEditor()}>新增账户</Button>
      </Space>}
    </Drawer>

    <Modal title={editingIndex == null ? '新增账户' : `编辑 ${accounts[editingIndex]?.name ?? ''}`} open={editorOpen} width={720} onCancel={() => setEditorOpen(false)} onOk={saveDraft} okText="完成">
      <Alert type="info" showIcon title="账户总额不需要填写" description="系统使用现金折美元金额，加上各持仓数量乘当前 USD 价格自动计算。券商总资产只用于对账。" style={{ marginBottom: 16 }} />
      <Form layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item label="账户名称" required><Input value={draft.name} onChange={event => updateDraft('name', event.target.value)} placeholder="例如：盈透主账户、BTC 冷钱包" /></Form.Item>
          <Form.Item label="账户类型"><Select value={draft.account_type} onChange={value => updateDraft('account_type', value)} options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))} /></Form.Item>
          <Form.Item label="登录入口"><Input value={draft.login_url} onChange={event => updateDraft('login_url', event.target.value)} placeholder="网址或 App 名称" /></Form.Item>
          <Form.Item label="登录账号"><Input value={draft.login_account} onChange={event => updateDraft('login_account', event.target.value)} /></Form.Item>
          <Form.Item label="密码提示"><Input value={draft.password_hint} onChange={event => updateDraft('password_hint', event.target.value)} placeholder="只写提示，不写完整密码" /></Form.Item>
          <Form.Item label="二次验证提示"><Input value={draft.two_factor_hint} onChange={event => updateDraft('two_factor_hint', event.target.value)} /></Form.Item>
          <Form.Item label="存放位置"><Input value={draft.location_note} onChange={event => updateDraft('location_note', event.target.value)} placeholder="例如：手机 App、家中保险箱" /></Form.Item>
          <Form.Item label="券商显示总资产（USD，可选）"><InputNumber aria-label="券商显示总资产（USD，可选）" style={{ width: '100%' }} min={0} precision={2} value={draft.broker_reported_total_usd} onChange={value => updateDraft('broker_reported_total_usd', value == null ? null : Number(value))} /></Form.Item>
        </div>

        <Divider titlePlacement="start">现金</Divider>
        <Space orientation="vertical" style={{ width: '100%' }}>
          {draft.cash_balances.map((cash, index) => <CashRow key={index} value={cash} onChange={value => updateDraft('cash_balances', draft.cash_balances.map((item, itemIndex) => itemIndex === index ? value : item))} onRemove={() => updateDraft('cash_balances', draft.cash_balances.filter((_, itemIndex) => itemIndex !== index))} />)}
          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => updateDraft('cash_balances', [...draft.cash_balances, { currency: 'USD', amount: 0, usd_rate: 1 }])}>添加现金余额</Button>
        </Space>

        <Divider titlePlacement="start">持仓数量</Divider>
        <Space orientation="vertical" style={{ width: '100%' }}>
          {draft.positions.map((allocation, index) => <PositionRow key={index} value={allocation} positions={positions} onChange={value => updateDraft('positions', draft.positions.map((item, itemIndex) => itemIndex === index ? value : item))} onRemove={() => updateDraft('positions', draft.positions.filter((_, itemIndex) => itemIndex !== index))} />)}
          <Button type="dashed" block icon={<PlusOutlined />} disabled={positions.length === 0} onClick={() => updateDraft('positions', [...draft.positions, { ticker_id: positions[0]?.ticker.id ?? '', quantity: 0 }])}>添加持仓位置</Button>
          <Typography.Text type="secondary">BTC 数量可填写小数；账户总额由系统自动计算。</Typography.Text>
        </Space>
      </Form>
    </Modal>
  </>;
}

function CashRow({ value, onChange, onRemove }: { value: PortfolioAccountCashBalance; onChange: (value: PortfolioAccountCashBalance) => void; onRemove: () => void }) {
  return <Space.Compact block>
    <Input aria-label="现金币种" style={{ width: '25%' }} value={value.currency} onChange={event => onChange({ ...value, currency: event.target.value.toUpperCase() })} placeholder="币种" />
    <InputNumber aria-label="现金金额" style={{ width: '35%' }} value={value.amount} onChange={amount => onChange({ ...value, amount: Number(amount ?? 0) })} placeholder="金额" />
    <InputNumber aria-label="兑美元汇率" style={{ width: '30%' }} min={0.00000001} precision={8} value={value.usd_rate} onChange={rate => onChange({ ...value, usd_rate: Number(rate ?? 0) })} placeholder="兑 USD" />
    <Button danger aria-label="删除现金" icon={<DeleteOutlined />} onClick={onRemove} />
  </Space.Compact>;
}

function PositionRow({ value, positions, onChange, onRemove }: { value: PortfolioAccountPositionAllocation; positions: Position[]; onChange: (value: PortfolioAccountPositionAllocation) => void; onRemove: () => void }) {
  const selected = positions.find(position => position.ticker.id === value.ticker_id);
  const unit = selected?.ticker.type === 'crypto' ? selected.ticker.code : '股';
  return <Space.Compact block>
    <Select aria-label="持仓标的" style={{ width: '52%' }} value={value.ticker_id} onChange={ticker_id => onChange({ ...value, ticker_id })} options={positions.map(position => ({ value: position.ticker.id, label: `${position.ticker.name}（${position.ticker.code}）` }))} />
    <InputNumber aria-label="持仓数量" style={{ width: '30%' }} min={0} precision={8} value={value.quantity} onChange={quantity => onChange({ ...value, quantity: Number(quantity ?? 0) })} />
    <Button disabled style={{ width: '8%' }}>{unit}</Button>
    <Button danger aria-label="删除持仓" icon={<DeleteOutlined />} onClick={onRemove} />
  </Space.Compact>;
}
