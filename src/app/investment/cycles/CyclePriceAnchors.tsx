import { Button, Space, Typography } from 'antd';
import type { MarketCycleProfile } from '@/types/life-os';

const formatPrice = (value?: number | null) => value == null ? '—' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(value);

export default function CyclePriceAnchors({ profile, onFetch }: { profile: MarketCycleProfile; onFetch?: () => void }) {
  const items = [
    ['启动日期', profile.cycle_started_on || '—'],
    ['启动价格', formatPrice(profile.cycle_start_price)],
    ['当前价格', formatPrice(profile.latest_price)],
    ['价格日期', profile.latest_price_on || '—'],
  ];
  return <div className="cycle-price-anchor-wrap">
    <div className="cycle-price-benchmark"><Typography.Text type="secondary">价格标的</Typography.Text><Space><Typography.Text strong>{profile.ticker ? `${profile.ticker.name} · ${profile.ticker.code}` : '未关联'}</Typography.Text>{profile.ticker_id&&onFetch&&<Button size="small" onClick={onFetch}>获取当前价格</Button>}</Space></div>
    <div className="cycle-price-anchor-grid">{items.map(([label,value])=><div key={label}><Typography.Text type="secondary">{label}</Typography.Text><Typography.Text strong>{value}</Typography.Text></div>)}</div>
  </div>;
}
