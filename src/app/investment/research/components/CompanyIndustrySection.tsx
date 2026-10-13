'use client';
import { Alert, Button, Card, Form, Input, Select, Space, Typography } from 'antd';
import type { IndustryProfile, ResearchProfileInput } from '@/types/life-os';
import ExternalVariablesEditor from './ExternalVariablesEditor';

export default function CompanyIndustrySection({ industries, companyId, companyUpdatedAt, onOpenIndustry }: { industries: IndustryProfile[]; companyId: string; companyUpdatedAt: string; onOpenIndustry: (id:string)=>void }) {
  const industryId=Form.useWatch('industry_profile_id'); const industry=industries.find(item=>item.id===industryId); const stale=industry&&new Date(industry.updated_at)>new Date(companyUpdatedAt);
  return <Space direction="vertical" size={12} style={{width:'100%'}}><Card size="small" title="行业与外部环境"><Form.Item<ResearchProfileInput> name="industry_profile_id" label="所属行业"><Select allowClear placeholder="可稍后关联" options={industries.map(item=>({value:item.id,label:item.name}))}/></Form.Item>{industry&&<Card size="small" type="inner" title={industry.name} extra={<Button type="link" onClick={()=>onOpenIndustry(industry.id)}>查看行业研究</Button>}><Typography.Paragraph>{industry.summary_judgment||'行业尚未形成一句话判断'}</Typography.Paragraph><Typography.Text type="secondary">更新于 {new Date(industry.updated_at).toLocaleString('zh-CN')}</Typography.Text>{stale&&<Alert type="info" showIcon message="行业研究已有更新，请检查是否影响公司判断" style={{marginTop:12}}/>}</Card>}<Form.Item<ResearchProfileInput> name="industry_impact" label="行业对本公司的具体影响"><Input.TextArea rows={3} style={{ resize: 'vertical' }} placeholder="只写与这家公司有关的影响，不重复行业正文"/></Form.Item></Card><ExternalVariablesEditor ownerType="company" ownerId={companyId}/></Space>;
}
