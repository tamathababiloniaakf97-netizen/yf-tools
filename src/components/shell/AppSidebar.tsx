'use client';

import {
  BarChartOutlined, BookOutlined, BulbOutlined, CalendarOutlined,
  CheckSquareOutlined, EyeOutlined, FileSearchOutlined, HeartOutlined,
  HomeOutlined, LineChartOutlined, RetweetOutlined,
  SafetyCertificateOutlined, TeamOutlined, WalletOutlined, ReadOutlined,
} from '@ant-design/icons';
import { Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { lifeOsNavigation, type NavigationItem } from './navigation';

const iconMap: Record<string, React.ReactNode> = {
  home: <HomeOutlined />, plans: <CheckSquareOutlined />, investment: <LineChartOutlined />,
  overview: <BarChartOutlined />, holdings: <WalletOutlined />, watchlist: <EyeOutlined />,
  research: <FileSearchOutlined />, tasks: <CalendarOutlined />, reviews: <RetweetOutlined />,
  methodology: <SafetyCertificateOutlined />, viewpoints: <BookOutlined />,
  goals: <BulbOutlined />, life: <HeartOutlined />,
  relationships: <TeamOutlined />,
  finance: <WalletOutlined />,
  cognition: <ReadOutlined />,
};

function toMenuItem(item: NavigationItem, onPrefetch: (href: string) => void): Required<MenuProps>['items'][number] {
  const label = item.phase === 'later' ? `${item.label} · 后续` : item.phase === 'planned' ? `${item.label} · 待开发` : item.label;
  return {
    key: item.children ? `group:${item.key}` : item.href,
    icon: iconMap[item.icon],
    disabled: item.disabled,
    label: item.children || item.disabled
      ? label
      : <span onMouseEnter={() => onPrefetch(item.href)}>{label}</span>,
    children: item.children?.map((child) => toMenuItem(child, onPrefetch)),
  };
}

function selectedPath(pathname: string) {
  if (pathname === '/cost') return '/cost';
  const candidates = lifeOsNavigation.flatMap((item) => [item, ...(item.children ?? [])]);
  return candidates
    .filter((item) => item.href !== '/' && pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? '/';
}

export default function AppSidebar({ pathname, onNavigate, onPrefetch = () => {} }: { pathname: string; onNavigate: (href: string) => void; onPrefetch?: (href: string) => void }) {
  const investmentOpen = pathname === '/cost' || pathname.startsWith('/investment');
  const cognitionOpen = pathname.startsWith('/cognition');
  return (
    <aside className="life-os-sidebar">
      <div className="life-os-brand">
        <span className="life-os-brand-mark">峰</span>
        <div>
          <Typography.Text strong>人生工作台</Typography.Text>
          <Typography.Text type="secondary">重要的事，持续推进</Typography.Text>
        </div>
      </div>
      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={[selectedPath(pathname)]}
        defaultOpenKeys={[...(investmentOpen ? ['group:investment'] : []), ...(cognitionOpen ? ['group:cognition'] : [])]}
        items={lifeOsNavigation.map((item) => toMenuItem(item, onPrefetch))}
        onClick={({ key }) => { if (!key.startsWith('group:')) onNavigate(key); }}
      />
    </aside>
  );
}
