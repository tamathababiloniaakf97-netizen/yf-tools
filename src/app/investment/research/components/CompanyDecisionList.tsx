'use client';
import { Button, Card, Empty, List, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { InvestmentDecision, ResearchProfile, ResearchSnapshot } from '@/types/life-os';

export default function CompanyDecisionList({ profile }: { profile: ResearchProfile }) {
  const [items, setItems] = useState<InvestmentDecision[]>([]); const [latest, setLatest] = useState<ResearchSnapshot | null>(null);
  const load = useCallback(async () => { const [d, s] = await Promise.all([fetch(`/api/investment/decisions?research_profile_id=${profile.id}`), fetch(`/api/investment/research/${profile.id}/snapshots`)]); if (d.ok) setItems(await d.json()); if (s.ok) { const snapshots = await s.json() as ResearchSnapshot[]; setLatest(snapshots[0] ?? null); } }, [profile.id]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const createHref = `/investment/decisions/new?research_profile_id=${encodeURIComponent(profile.id)}${latest ? `&snapshot_id=${encodeURIComponent(latest.id)}` : ''}`;
  return <Card title="该公司的投资决策" extra={<Link href={createHref}><Button type="primary">开始投资决策</Button></Link>}>{items.length === 0 ? <Empty description="暂无投资决策" /> : <List dataSource={items} renderItem={(item) => <List.Item><Link href={`/investment/decisions/${item.id}`}><Space><Typography.Text strong>{item.final_reason || '未完成的决策草稿'}</Typography.Text><Tag>{item.status === 'draft' ? '草稿' : '已定稿'}</Tag></Space></Link></List.Item>} />}</Card>;
}
