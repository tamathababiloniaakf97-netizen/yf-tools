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
  { key: 'finance', label: '家庭财务', href: '/finance', icon: 'finance' },
  {
    key: 'investment', label: '投资', href: '/investment', icon: 'investment',
    children: [
      { key: 'investment-overview', label: '投资概览', href: '/investment', icon: 'overview' },
      { key: 'market-cycles', label: '周期观察', href: '/investment/cycles', icon: 'investment', disabled: false, phase: 'now' },
      { key: 'holdings', label: '持仓', href: '/cost', icon: 'holdings' },
      { key: 'watchlist', label: '观察列表', href: '/investment/watchlist', icon: 'watchlist' },
      { key: 'investment-tasks', label: '投资待办', href: '/investment/tasks', icon: 'tasks', disabled: false, phase: 'now' },
      { key: 'research', label: '投资研究', href: '/investment/research', icon: 'research' },
      { key: 'investment-decisions', label: '投资决策', href: '/investment/decisions', icon: 'research', disabled: false, phase: 'now' },
      { key: 'investment-reviews', label: '投资日志', href: '/investment/reviews', icon: 'reviews', disabled: false, phase: 'now' },
      { key: 'methodology', label: '方法论', href: '/investment/methodology', icon: 'methodology', disabled: false, phase: 'now' },
      { key: 'research-materials', label: '研究资料库', href: '/investment/materials', icon: 'viewpoints', disabled: false, phase: 'now' },
    ],
  },
  {
    key: 'cognition', label: '认知提升', href: '/cognition', icon: 'cognition',
    children: [
      { key: 'cognition-overview', label: '认知概览', href: '/cognition', icon: 'overview' },
      { key: 'cognition-journals', label: '认知日志', href: '/cognition/journals', icon: 'reviews' },
      { key: 'cognition-methods', label: '认知方法论', href: '/cognition/methods', icon: 'methodology' },
    ],
  },
  { key: 'goals', label: '年度目标', href: '/goals', icon: 'goals' },
  { key: 'relationships', label: '人际关系', href: '/relationships', icon: 'relationships' },
  { key: 'life', label: '生活补强', href: '/life', icon: 'life', disabled: false, phase: 'now' },
  { key: 'global-reviews', label: '全局复盘', href: '/reviews', icon: 'reviews', disabled: true, phase: 'later' },
];
