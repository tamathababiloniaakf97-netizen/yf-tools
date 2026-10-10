'use client';
import { useState } from 'react';
import { Alert, Button, Col, Form, Input, InputNumber, Row, Select, Space, Statistic, Typography } from 'antd';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import { calculateCycleProgress, cyclePhaseOptions, getCyclePhasePrompt } from '@/lib/investment/cycles';
import type { MarketCycleReviewInput } from '@/types/life-os';

export default function CycleProgressFields({form,tickerId,tickerLabel}:{form:FormInstance<MarketCycleReviewInput>;tickerId?:string|null;tickerLabel?:string}) {
  const [fetching,setFetching]=useState(false); const [quoteError,setQuoteError]=useState('');
  const startedOn=Form.useWatch('cycle_started_on',form); const startPrice=Form.useWatch('cycle_start_price',form);
  const latestPrice=Form.useWatch('latest_price',form); const latestOn=Form.useWatch('latest_price_on',form); const phase=Form.useWatch('phase',form);
  const progress=calculateCycleProgress({cycle_started_on:startedOn,cycle_start_price:startPrice,latest_price:latestPrice,latest_price_on:latestOn});
  const onLatestPrice=(value:number|null)=>{if(value!=null&&!form.getFieldValue('latest_price_on'))form.setFieldValue('latest_price_on',dayjs().format('YYYY-MM-DD'));};
  const prompt=getCyclePhasePrompt(phase??'');
  const fetchPrice=async()=>{if(!tickerId)return;setFetching(true);setQuoteError('');try{const response=await fetch(`/api/prices/previous-close?ticker_id=${encodeURIComponent(tickerId)}`);const result=await response.json();if(!response.ok)throw new Error(result.error||'价格获取失败');const price=Number(result.price);const observedOn=String(result.observedOn||dayjs().format('YYYY-MM-DD'));if(!Number.isFinite(price)||price<=0||!/^\d{4}-\d{2}-\d{2}$/.test(observedOn))throw new Error('行情返回的数据无效');if(startedOn&&observedOn<startedOn)throw new Error('行情日期早于周期启动日期');form.setFieldsValue({latest_price:price,latest_price_on:observedOn});}catch(error){setQuoteError(error instanceof Error?error.message:'价格获取失败');}finally{setFetching(false);}};
  return <div className="cycle-progress-fields">
    <Alert type="info" showIcon message="周期只用于判断环境，不用于预测顶底；通过分批买卖降低误判与踏空风险。" />
    <Space className="cycle-progress-heading"><Typography.Title level={5}>周期进度（可选）</Typography.Title>{tickerId&&<Button size="small" loading={fetching} onClick={()=>void fetchPrice()}>获取当前价格</Button>}{tickerId&&tickerLabel&&<Typography.Text type="secondary">{tickerLabel}</Typography.Text>}</Space>
    {quoteError&&<Alert type="error" showIcon title={quoteError} />}
    <Row gutter={12}>
      <Col xs={24} md={6}><Form.Item name="cycle_started_on" label="周期启动日期"><Input type="date" /></Form.Item></Col>
      <Col xs={24} md={6}><Form.Item name="cycle_start_price" label="周期启动价格"><InputNumber min={0.00000001} stringMode={false} style={{width:'100%'}} /></Form.Item></Col>
      <Col xs={24} md={6}><Form.Item name="latest_price" label="最新价格"><InputNumber min={0.00000001} stringMode={false} style={{width:'100%'}} onChange={onLatestPrice} /></Form.Item></Col>
      <Col xs={24} md={6}><Form.Item name="latest_price_on" label="最新价格日期"><Input type="date" /></Form.Item></Col>
    </Row>
    <Row gutter={12} className="cycle-progress-results"><Col span={12}><Statistic title="累计涨跌幅" value={progress.ok&&progress.return_percent!=null?`${progress.return_percent>=0?'+':''}${progress.return_percent.toFixed(2)}%`:'尚未填写'} /></Col><Col span={12}><Statistic title="已运行时间" value={progress.ok&&progress.running_days!=null?`${progress.running_days} 天`:'尚未填写'} /></Col></Row>
    <Form.Item name="phase" label="当前阶段" rules={[{required:true,message:'请选择或填写周期阶段'}]}><Select showSearch options={cyclePhaseOptions.map(item=>({value:item.value,label:item.value}))} /></Form.Item>
    {prompt&&<Typography.Paragraph className="cycle-phase-prompt">思考：{prompt}</Typography.Paragraph>}
  </div>;
}
