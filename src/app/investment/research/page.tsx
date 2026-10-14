'use client';
import { Alert, App, Button, Card, Col, Empty, Form, List, Modal, Row, Segmented, Select, Tabs, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import type { IndustryProfile, ResearchProfile, ResearchProfileInput } from '@/types/life-os';
import type { Ticker } from '@/types';
import ResearchEditor from './components/ResearchEditor';
import HypothesisEvidencePanel from './components/HypothesisEvidencePanel';
import SnapshotList from './components/SnapshotList';
import CompanyDecisionList from './components/CompanyDecisionList';
import ResearchPdfExportButton from './components/ResearchPdfExportButton';
import IndustryWorkspace from './components/IndustryWorkspace';

export default function ResearchPage() {
  const { message } = App.useApp(); const [newForm] = Form.useForm();
  const [profiles, setProfiles] = useState<ResearchProfile[]>([]); const [selected, setSelected] = useState<ResearchProfile | null>(null);
  const [tickers, setTickers] = useState<Ticker[]>([]); const [tickerError, setTickerError] = useState('');
  const [industries,setIndustries]=useState<IndustryProfile[]>([]); const [view,setView]=useState<'company'|'industry'>(()=>typeof window==='undefined'?'company':new URLSearchParams(window.location.search).get('view')==='industry'?'industry':'company');
  const [activeTab, setActiveTab] = useState(() => typeof window === 'undefined' ? 'current' : new URLSearchParams(window.location.search).get('tab') || 'current');
  const [creating, setCreating] = useState(false); const [creatingResearch, setCreatingResearch] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const load = useCallback(async () => { const tickerRequest=fetch('/api/tickers'); try { const [response,industryResponse] = await Promise.all([fetch('/api/investment/research'),fetch('/api/investment/industries')]); const data = await response.json(); const industryData=await industryResponse.json(); if (!response.ok) throw new Error(data.error || '研究档案加载失败'); if(industryResponse.ok)setIndustries(industryData); const requestedId = new URLSearchParams(window.location.search).get('profile'); setProfiles(data); setSelected((current) => data.find((item: ResearchProfile) => item.id === (current?.id || requestedId)) ?? data[0] ?? null); setError(''); } catch (err) { setError(err instanceof Error ? err.message : '研究档案加载失败'); } try { const tickerResponse=await tickerRequest; const tickerData=await tickerResponse.json(); if(!tickerResponse.ok)throw new Error(tickerData.error||'标的列表加载失败'); setTickers(tickerData);setTickerError(''); } catch(err){setTickers([]);setTickerError(err instanceof Error?err.message:'标的列表加载失败');} }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const save = async (input: ResearchProfileInput) => { setSaving(true); try { const response = await fetch('/api/investment/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...selected, ...input }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '保存失败'); message.success('当前研究已保存'); await load(); } catch (err) { message.error(err instanceof Error ? err.message : '保存失败'); throw err; } finally { setSaving(false); } };
  const create = async () => { if(creatingResearch)return; const values = await newForm.validateFields(); const ticker=tickers.find(item=>item.id===values.ticker_id); if(!ticker)return message.error('所选标的不存在，请刷新后重试'); setCreatingResearch(true); try { const response = await fetch('/api/investment/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticker_id:ticker.id, asset_name:ticker.name }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '创建失败'); setCreating(false); newForm.resetFields(); await load(); setSelected(data); } catch(err){message.error(err instanceof Error?err.message:'创建失败');} finally {setCreatingResearch(false);} };
  const linkedTickerIds=new Set(profiles.map(profile=>profile.ticker_id).filter((id):id is string=>Boolean(id)));
  const linkedAssetNames=new Set(profiles.map(profile=>profile.asset_name.trim().toLocaleLowerCase()));
  const availableTickers=tickers.filter(ticker=>!linkedTickerIds.has(ticker.id)&&!linkedAssetNames.has(ticker.name.trim().toLocaleLowerCase()));
  const openIndustry=(id:string)=>{setView('industry');window.history.replaceState(null,'',`/investment/research?view=industry&industry=${encodeURIComponent(id)}`);};
  return <AuthGuard><div className="page-heading"><div><Typography.Title level={2}>投资研究</Typography.Title><Typography.Text type="secondary">公司判断连接行业背景，只保留真正影响决策的关键点。</Typography.Text></div>{view==='company'&&<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>新建研究</Button>}</div>
    <Segmented value={view} onChange={(value)=>setView(value as 'company'|'industry')} options={[{value:'company',label:'公司研究'},{value:'industry',label:'行业研究'}]} style={{marginBottom:16}}/>
    {error && <Alert type="warning" showIcon message="研究模块暂时不可用" description={`${error}。结构化研究与快照需要执行迁移 010。`} style={{ marginBottom: 16 }} />}
    {view==='industry'?<IndustryWorkspace companies={profiles}/>:<Row gutter={[16, 16]}><Col xs={24} lg={5} xl={4}><Card title={`研究公司 · ${profiles.length}`}>{profiles.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无研究档案" /> : <List dataSource={profiles} renderItem={(profile) => <List.Item className={selected?.id === profile.id ? 'research-selected' : ''} onClick={() => setSelected(profile)}><Typography.Text strong>{profile.asset_name}</Typography.Text></List.Item>} />}</Card></Col>
      <Col xs={24} lg={19} xl={20}>{!selected ? <Card><Empty description="选择或新建一家公司" /></Card> : <><Card style={{ marginBottom: 16 }} extra={<ResearchPdfExportButton profileId={selected.id} assetName={selected.asset_name} />}><Typography.Title level={3}>{selected.asset_name}</Typography.Title><Typography.Text type="secondary">最近更新：{new Date(selected.updated_at).toLocaleString('zh-CN')}</Typography.Text>{selected.current_judgment && <Typography.Paragraph style={{ marginTop: 12 }}>{selected.current_judgment}</Typography.Paragraph>}</Card><Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'current', label: '当前研究', children: <ResearchEditor initial={selected} industries={industries} saving={saving} onSubmit={save} onOpenIndustry={openIndustry}/> },
        { key: 'evidence', label: '假设与证据', children: <HypothesisEvidencePanel profile={selected} /> },
        { key: 'snapshots', label: '研究快照', children: <SnapshotList profile={selected} /> },
        { key: 'decisions', label: '投资决策', children: <CompanyDecisionList profile={selected} /> },
      ]} /></>}</Col></Row>}
    <Modal title="新建公司研究" open={creating} okText="创建" cancelText="取消" confirmLoading={creatingResearch} onCancel={() => setCreating(false)} onOk={create}><Form form={newForm} layout="vertical"><Form.Item name="ticker_id" label="公司或标的" rules={[{ required: true, message: '请选择公司或标的' }]} extra={tickerError||undefined}><Select showSearch optionFilterProp="label" placeholder="选择已有标的" options={availableTickers.map(ticker=>({value:ticker.id,label:`${ticker.name} · ${ticker.code}`}))} notFoundContent={tickerError?'标的列表加载失败，请稍后重试':'没有可用标的，请先到持仓添加标的'} /></Form.Item></Form></Modal>
  </AuthGuard>;
}
