'use client';
import { Button, Empty, List, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import type { InvestmentDecision } from '@/types/life-os';

const labels = { buy: '买入', add: '加仓', hold: '持有', reduce: '减仓', sell: '卖出', watch: '继续观察', skip: '放弃' } as const;
export default function DecisionList({ items, loading, onDelete }: { items: InvestmentDecision[]; loading: boolean; onDelete: (item: InvestmentDecision) => void }) {
  if (!loading && items.length === 0) return <Empty description="暂无投资决策" />;
  return <List loading={loading} dataSource={items} renderItem={(item) => <List.Item actions={[<Link key="open" href={`/investment/decisions/${item.id}`}>查看</Link>, <Button key="delete" type="link" danger onClick={() => onDelete(item)}>删除</Button>]}><List.Item.Meta title={<Space><Typography.Text strong>{item.asset_name}</Typography.Text><Tag>{item.status === 'draft' ? '草稿' : '已定稿'}</Tag>{item.decision_type && <Tag>{labels[item.decision_type]}</Tag>}</Space>} description={item.final_reason || '尚未形成最终结论'} /></List.Item>} />;
}
