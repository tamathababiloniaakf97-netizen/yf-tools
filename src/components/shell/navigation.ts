export type NavigationPhase = 'now' | 'planned' | 'later';

export interface NavigationItem {
  key: string;
  label: string;
  href: string;
  icon: string;
  disabled?: boolean;
  phase?: NavigationPhase;
  children?: NavigationItem[];
}

export const lifeOsNavigation: NavigationItem[] = [
  { key: 'home', label: '工作台首页', href: '/', icon: 'home' },
  { key: 'plans', label: '计划管理', href: '/plans', icon: 'plans' },
  {
    key: 'investment', label: '投资', href: '/investment', icon: 'investment',
    children: [
      { key: 'investment-overview', label: '投资概览', href: '/investment', icon: 'overview' },
      { key: 'holdings', label: '持仓', href: '/cost', icon: 'holdings' },
      { key: 'watchlist', label: '观察列表', href: '/investment/watchlist', icon: 'watchlist' },
      { key: 'research', label: '公司研究', href: '/investment/research', icon: 'research' },
      { key: 'investment-decisions', label: '投资决策', href: '/investment/decisions', icon: 'research', disabled: false, phase: 'now' },
      { key: 'investment-tasks', label: '投资待办', href: '/investment/tasks', icon: 'tasks', disabled: false, phase: 'now' },
      { key: 'investment-reviews', label: '投资复盘', href: '/investment/reviews', icon: 'reviews', disabled: false, phase: 'now' },
      { key: 'methodology', label: '方法论', href: '/investment/methodology', icon: 'methodology', disabled: false, phase: 'now' },
      { key: 'viewpoints', label: '观点库', href: '/investment/viewpoints', icon: 'viewpoints', disabled: true, phase: 'later' },
    ],
  },
  { key: 'goals', label: '年度目标', href: '/goals', icon: 'goals' },
  { key: 'relationships', label: '人际关系', href: '/relationships', icon: 'relationships' },
  { key: 'life', label: '生活补强', href: '/life', icon: 'life', disabled: true, phase: 'later' },
  { key: 'global-reviews', label: '全局复盘', href: '/reviews', icon: 'reviews', disabled: true, phase: 'later' },
];
