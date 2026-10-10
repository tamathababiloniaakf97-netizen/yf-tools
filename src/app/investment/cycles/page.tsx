'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Alert, App, Button, Card, Col, DatePicker, Empty, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Tag, Typography } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import AuthGuard from '@/components/AuthGuard';
import { buildCycleAlerts, calculateCycleProgress, describeCycleLoadError, mergeCycleProfiles } from '@/lib/investment/cycles';
import type { CycleIndicator, MarketCycleProfile, MarketCycleReview, MarketCycleReviewInput } from '@/types/life-os';
import type { Ticker } from '@/types';
import CycleProgressFields from './CycleProgressFields';
import CyclePriceAnchors from './CyclePriceAnchors';
import { EvidenceEditor, JudgmentEditor, PriceEditor, ThoughtEditor } from './CycleSectionEditors';
import CycleIndicatorManager from './CycleIndicatorManager';

const directionOptions = [{ value: 'up', label: '上行' }, { value: 'flat', label: '平稳' }, { value: 'down', label: '下行' }, { value: 'unknown', label: '未知' }];
const zoneOptions = [{ value: 'normal', label: '常态区' }, { value: 'watch', label: '观察区' }, { value: 'extreme', label: '极端区' }, { value: 'unknown', label: '未判断' }];

export default function MarketCyclesPage() {
  const { message } = App.useApp();
  const { data = [], error, mutate, isLoading } = useSWR<MarketCycleProfile[]>('/api/investment/cycles');
  const { data: tickers = [] } = useSWR<Ticker[]>('/api/tickers');
  const profiles = useMemo(() => mergeCycleProfiles(data), [data]);
  const [selectedKey, setSelectedKey] = useState(profiles[0].cycle_key);
  const profile = profiles.find((item) => item.cycle_key === selectedKey) ?? profiles[0];
  const { data: reviews = [], mutate: mutateReviews } = useSWR<MarketCycleReview[]>(profile.id ? `/api/investment/cycles/${profile.id}/reviews` : null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [profileEditor, setProfileEditor] = useState<MarketCycleProfile | 'new' | null>(null);
  const [form] = Form.useForm<MarketCycleReviewInput>();
  const [profileForm] = Form.useForm<{ name: string; review_frequency_days: number; ticker_id?: string | null }>();
  const alerts = buildCycleAlerts(profile);
  const currentProgress=calculateCycleProgress(profile);

  const beginReview = async (fetchLatest = false) => {
    form.setFieldsValue({ phase: profile.current_phase, confidence: profile.confidence, summary: profile.summary,
      support_evidence: profile.support_evidence ?? '', counter_evidence: profile.counter_evidence ?? '', uncertainties: profile.uncertainties ?? '',
      cycle_started_on:profile.cycle_started_on??null,cycle_start_price:profile.cycle_start_price??null,
      latest_price:profile.latest_price??null,latest_price_on:profile.latest_price_on??null,
      next_review_at: dayjs().add(profile.review_frequency_days, 'day') as unknown as string, indicators: profile.indicators });
    setOpen(true);
    if (fetchLatest && profile.ticker_id) {
      try {
        const response=await fetch(`/api/prices/previous-close?ticker_id=${encodeURIComponent(profile.ticker_id)}`);
        const result=await response.json();
        if(!response.ok)throw new Error(result.error||'价格获取失败');
        const price=Number(result.price), observedOn=String(result.observedOn||dayjs().format('YYYY-MM-DD'));
        if(!Number.isFinite(price)||price<=0)throw new Error('行情返回的价格无效');
        if(profile.cycle_started_on&&observedOn<profile.cycle_started_on)throw new Error('行情日期早于周期启动日期');
        form.setFieldsValue({latest_price:price,latest_price_on:observedOn});
        message.success('已填入当前价格，请确认后保存');
      } catch(error) { message.error(error instanceof Error?error.message:'价格获取失败'); }
    }
  };
  const submit = async (raw: MarketCycleReviewInput) => {
    if (!profile.id) return message.error('周期档案尚未初始化，请确认已执行数据库迁移后刷新');
    const anchorChanged=profile.cycle_started_on!==raw.cycle_started_on||Number(profile.cycle_start_price??0)!==Number(raw.cycle_start_price??0);
    if(anchorChanged&&reviews.length>0){const confirmed=await new Promise<boolean>((resolve)=>Modal.confirm({title:'确认修改周期起点？',content:'修改周期起点后，当前涨跌幅和运行时间会重新计算；已有历史复核不会改变。',okText:'确认修改',cancelText:'取消',onOk:()=>resolve(true),onCancel:()=>resolve(false)}));if(!confirmed)return;}
    setSaving(true);
    try {
      const payload = { ...raw, next_review_at: dayjs(raw.next_review_at as unknown as dayjs.Dayjs).format('YYYY-MM-DD'), indicators: raw.indicators.map((item) => ({ ...item, observed_on: item.observed_on ? dayjs(item.observed_on as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : null })) };
      const response = await fetch(`/api/investment/cycles/${profile.id}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '保存失败');
      await Promise.all([mutate(), mutateReviews()]); setOpen(false); message.success('本次周期复核已保存');
    } catch (err) { message.error(err instanceof Error ? err.message : '保存失败'); } finally { setSaving(false); }
  };
  const editProfile = (item?: MarketCycleProfile) => {
    setProfileEditor(item ?? 'new');
    profileForm.setFieldsValue({ name: item?.name ?? '', review_frequency_days: item?.review_frequency_days ?? 30, ticker_id: item?.ticker_id ?? null });
  };
  const saveProfile = async (values: { name: string; review_frequency_days: number; ticker_id?: string | null }) => {
    setSaving(true);
    try {
      const editing = profileEditor !== 'new' && profileEditor;
      const response = await fetch(editing ? `/api/investment/cycles/${editing.id}` : '/api/investment/cycles', {
        method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || '保存失败');
      await mutate(); setSelectedKey(result.cycle_key); setProfileEditor(null); message.success(editing ? '观察主题已更新' : '观察主题已创建');
    } catch (err) { message.error(err instanceof Error ? err.message : '保存失败'); } finally { setSaving(false); }
  };
  const archiveProfile = async (item: MarketCycleProfile) => {
    const response = await fetch(`/api/investment/cycles/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: false }) });
    const result = await response.json(); if (!response.ok) return message.error(result.error || '停用失败');
    await mutate(); if (selectedKey === item.cycle_key) setSelectedKey(profiles.find((entry) => entry.id && entry.id !== item.id)?.cycle_key ?? ''); message.success('已停用，历史复核仍保留');
  };
  const saveProfilePatch=async(patch:Record<string,unknown>)=>{if(!profile.id){message.error('周期档案尚未初始化');return false;}try{const response=await fetch(`/api/investment/cycles/${profile.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)});const result=await response.json();if(!response.ok)throw new Error(result.error||'保存失败');await mutate();message.success('已保存');return true;}catch(error){message.error(error instanceof Error?error.message:'保存失败');return false;}};

  return <AuthGuard><div className="page-heading cycle-page-heading"><div><Typography.Text className="cycle-eyebrow">MARKET CYCLE REVIEW</Typography.Text><Typography.Title level={2}>周期观察</Typography.Title><Typography.Text type="secondary">用低频指标检验趋势是否正在变化，不预测精确拐点，也不连接仓位。</Typography.Text></div><Space><Button aria-label="管理观察主题" icon={<SettingOutlined />} onClick={() => setManageOpen(true)}>管理观察主题</Button><Button type="primary" onClick={()=>void beginReview()} disabled={!profile.id}>开始本次复核</Button></Space></div>
    <Alert className="cycle-risk-note" type="info" showIcon message="周期只用于判断环境，不用于预测顶底；通过分批买卖降低误判与踏空风险。" />
    {error && <Alert type="error" showIcon message="周期数据加载失败" description={describeCycleLoadError(error)} style={{ marginBottom: 16 }} />}
    <div className="cycle-selector">{profiles.map((item) => { const itemAlerts = buildCycleAlerts(item); return <button type="button" key={item.cycle_key} className={`cycle-selector-card${item.cycle_key === selectedKey ? ' is-active' : ''}`} onClick={() => setSelectedKey(item.cycle_key)}><span className="cycle-selector-top"><strong>{item.name}</strong>{itemAlerts.length > 0 && <i>{itemAlerts.length}</i>}</span><span>{item.current_phase || '尚未判断'}</span><small>{item.next_review_at ? `下次复核 ${item.next_review_at}` : `每 ${item.review_frequency_days} 天复核`}</small></button>; })}</div>
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={15}><Card loading={isLoading} className="cycle-judgement-card" title={<span>当前判断 <Typography.Text type="secondary">· {profile.name}</Typography.Text></span>} extra={<Space>{profile.confidence && <Tag>{profile.confidence === 'high' ? '高' : profile.confidence === 'medium' ? '中' : '低'}确信</Tag>}<JudgmentEditor profile={profile} onSave={saveProfilePatch}/></Space>}>
        <Row gutter={16} className="cycle-current-progress"><Col span={12}><Typography.Text type="secondary">累计涨跌幅</Typography.Text><Typography.Title level={4}>{currentProgress.ok&&currentProgress.return_percent!=null?`${currentProgress.return_percent>=0?'+':''}${currentProgress.return_percent.toFixed(2)}%`:'尚未填写'}</Typography.Title></Col><Col span={12}><Typography.Text type="secondary">已运行时间</Typography.Text><Typography.Title level={4}>{currentProgress.ok&&currentProgress.running_days!=null?`${currentProgress.running_days} 天`:'尚未填写'}</Typography.Title></Col></Row>
        <div className="cycle-section-toolbar cycle-section-toolbar-end"><PriceEditor profile={profile} tickers={tickers} onSave={saveProfilePatch}/></div>
        <CyclePriceAnchors profile={profile} onFetch={profile.id?()=>void beginReview(true):undefined}/>
        <Typography.Title level={4}>{profile.current_phase || '尚未建立周期判断'}</Typography.Title><Typography.Paragraph>{profile.summary || '第一次复核时，写下阶段、支持证据、反例和未知项。'}</Typography.Paragraph>
        <div className="cycle-section-toolbar cycle-section-toolbar-end"><EvidenceEditor profile={profile} onSave={saveProfilePatch}/></div>
        <Row gutter={16}><Col span={12}><Typography.Text type="secondary">支持证据</Typography.Text><Typography.Paragraph>{profile.support_evidence || '—'}</Typography.Paragraph></Col><Col span={12}><Typography.Text type="secondary">反面证据</Typography.Text><Typography.Paragraph>{profile.counter_evidence || '—'}</Typography.Paragraph></Col></Row>
      </Card></Col>
      <Col xs={24} lg={9}><Card title="待思考事项"><div className="cycle-thought-section"><div className="cycle-thought-title"><Typography.Text strong>我的待思考</Typography.Text><ThoughtEditor profile={profile} onSave={saveProfilePatch}/></div>{profile.uncertainties?<Typography.Paragraph>{profile.uncertainties}</Typography.Paragraph>:<Typography.Paragraph type="secondary">点击编辑，写下仍需核实的问题</Typography.Paragraph>}</div><div className="cycle-thought-section"><Typography.Text strong>系统提醒</Typography.Text>{alerts.length ? <Space direction="vertical" style={{ width: '100%' }}>{alerts.map((item, index) => <Alert key={`${item.kind}-${item.indicatorId ?? index}`} type={item.severity} showIcon message={item.title} description={item.description} />)}</Space> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前没有条件提醒" />}</div></Card></Col>
      <Col span={24}><Card title="观察指标" extra={<CycleIndicatorManager indicators={profile.indicators} onSave={(indicators)=>saveProfilePatch({indicators})}/>}><div className="cycle-indicator-grid">{profile.indicators.map((item) => <IndicatorCard key={item.id} item={item} />)}</div></Card></Col>
      <Col span={24}><Card title="历史复核">{reviews.length ? reviews.map((item) => <div className="cycle-review-row" key={item.id}><div><Typography.Text strong>{item.reviewed_on} · {item.phase}{item.return_percent!=null?` · ${item.return_percent>=0?'+':''}${Number(item.return_percent).toFixed(2)}%`:''}{item.running_days!=null?` · ${item.running_days} 天`:''}</Typography.Text><Typography.Paragraph type="secondary">{item.summary}</Typography.Paragraph></div><Tag>{item.confidence || '未评估'}</Tag></div>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无历史复核" />}</Card></Col>
    </Row>
    <Modal title={`复核：${profile.name}`} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={saving} width={920} okText="保存复核" cancelText="取消">
      <Form form={form} layout="vertical" onFinish={submit}><CycleProgressFields form={form} tickerId={profile.ticker_id} tickerLabel={profile.ticker?`${profile.ticker.name} · ${profile.ticker.code}`:undefined}/><Row gutter={16}><Col span={12}><Form.Item name="confidence" label="判断确信度"><Select allowClear options={[{value:'low',label:'低'},{value:'medium',label:'中'},{value:'high',label:'高'}]} /></Form.Item></Col><Col span={12}><Form.Item name="next_review_at" label="下次复核" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col></Row>
        <Form.Item name="summary" label="当前判断" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item><Row gutter={16}><Col span={8}><Form.Item name="support_evidence" label="支持证据"><Input.TextArea rows={3} /></Form.Item></Col><Col span={8}><Form.Item name="counter_evidence" label="反面证据"><Input.TextArea rows={3} /></Form.Item></Col><Col span={8}><Form.Item name="uncertainties" label="待思考事项"><Input.TextArea rows={3} /></Form.Item></Col></Row>
        <Typography.Title level={5}>本次指标记录</Typography.Title><Form.List name="indicators">{(fields, { add, remove }) => <Space direction="vertical" style={{ width: '100%' }}>{fields.map(({ key, name }) => <Card size="small" key={key} extra={<Button type="link" danger onClick={() => remove(name)}>移除</Button>}><Form.Item name={[name, 'name']} label="指标名称" rules={[{required:true}]}><Input /></Form.Item><Row gutter={12}><Col span={5}><Form.Item name={[name, 'value']} label="值/状态"><Input /></Form.Item></Col><Col span={4}><Form.Item name={[name, 'direction']} label="方向"><Select options={directionOptions} /></Form.Item></Col><Col span={4}><Form.Item name={[name, 'zone']} label="区域"><Select options={zoneOptions} /></Form.Item></Col><Col span={5}><Form.Item name={[name, 'observed_on']} label="观察日期" getValueProps={(value) => ({ value: value ? dayjs(value) : null })}><DatePicker style={{ width: '100%' }} /></Form.Item></Col><Col span={6}><Form.Item name={[name, 'source']} label="来源"><Input /></Form.Item></Col></Row><Row gutter={12}><Col span={12}><Form.Item name={[name, 'threshold_note']} label="提醒阈值"><Input /></Form.Item></Col><Col span={12}><Form.Item name={[name, 'note']} label="备注"><Input /></Form.Item></Col></Row></Card>)}<Button block icon={<PlusOutlined />} onClick={() => add({ id: crypto.randomUUID(), name: '', value_type: 'text', value: null, direction: 'unknown', zone: 'unknown', source: '', observed_on: null, update_frequency_days: 30, threshold_note: '', note: '', watch_direction_change: false, active: true })}>增加观察指标</Button></Space>}</Form.List>
      </Form>
    </Modal>
    <Modal title="管理观察主题" open={manageOpen} onCancel={() => setManageOpen(false)} footer={<Button type="primary" icon={<PlusOutlined />} onClick={() => editProfile()}>新增观察主题</Button>}><Typography.Paragraph type="secondary">不再关注的主题建议停用而不是删除，历史判断会完整保留。</Typography.Paragraph><div className="cycle-manager-list">{data.filter((item) => item.is_active !== false).map((item) => <div key={item.id}><div><Typography.Text strong>{item.name}</Typography.Text><br/><Typography.Text type="secondary">每 {item.review_frequency_days} 天复核</Typography.Text></div><Space><Button size="small" onClick={() => editProfile(item)}>编辑</Button><Popconfirm title="停用这个主题？" description="历史复核不会删除。" onConfirm={() => void archiveProfile(item)}><Button size="small" danger>停用</Button></Popconfirm></Space></div>)}</div></Modal>
    <Modal title={profileEditor === 'new' ? '新增观察主题' : '编辑观察主题'} open={profileEditor !== null} onCancel={() => setProfileEditor(null)} onOk={() => profileForm.submit()} confirmLoading={saving}><Form form={profileForm} layout="vertical" onFinish={saveProfile}><Form.Item name="name" label="主题名称" rules={[{required:true,message:'请填写主题名称'}]}><Input placeholder="例如：原油供需周期" /></Form.Item><Form.Item name="ticker_id" label="价格标的"><Select allowClear showSearch optionFilterProp="label" placeholder="可选，由你自行选择" options={tickers.map(item=>({value:item.id,label:`${item.name} · ${item.code}`}))}/></Form.Item><Form.Item name="review_frequency_days" label="复核频率（天）" rules={[{required:true}]}><InputNumber min={7} max={365} style={{width:'100%'}} /></Form.Item></Form></Modal>
  </AuthGuard>;
}

function IndicatorCard({ item }: { item: CycleIndicator }) {
  const zone = item.zone === 'extreme' ? ['red', '极端区'] : item.zone === 'watch' ? ['orange', '观察区'] : item.zone === 'normal' ? ['green', '常态区'] : ['default', '未判断'];
  return <div className="cycle-indicator-card"><div><Typography.Text strong>{item.name}</Typography.Text><Tag color={zone[0]}>{zone[1]}</Tag></div><Typography.Title level={4}>{item.value ?? '—'}</Typography.Title><Typography.Text type="secondary">{item.source || '未记录来源'}{item.observed_on ? ` · ${item.observed_on}` : ''}</Typography.Text></div>;
}
