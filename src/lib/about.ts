import { createServerSideClient } from '@/lib/supabase/server';

export interface Milestone {
  id: string;
  year: string;
  title: string;
  description: string;
  sort_order: number;
}

export interface Case {
  id: string;
  title: string;
  context: string;
  decision: string;
  execution: string;
  result: string;
  sort_order: number;
}

const STATIC_MILESTONES: Milestone[] = [
  {
    id: '1',
    year: '2015',
    title: '初入市场',
    description:
      '开始系统学习价值投资，从阅读格雷厄姆、巴菲特经典著作入手，建立基本面研究的基本框架。这一年虽然交易不多，但奠定了"买股票就是买公司"的核心理念。',
    sort_order: 1,
  },
  {
    id: '2',
    year: '2018',
    title: '熊市考验',
    description:
      'A股和港股双双大幅下跌。在市场恐慌时坚持分批买入优质标的，年底实现了正收益。这次经历验证了"别人恐惧我贪婪"的策略有效性，也深刻理解了仓位管理的重要性。',
    sort_order: 2,
  },
  {
    id: '3',
    year: '2021',
    title: '体系成型',
    description:
      '在多年实战基础上，总结出"倒金字塔建仓 + 长期持有 + 期权增收"三位一体的远峯投资体系，并开始向学员传授这套方法论。',
    sort_order: 3,
  },
];

const STATIC_CASES: Case[] = [
  {
    id: '1',
    title: 'SPY长期攒股与期权增收',
    context: '2020年疫情暴跌后，SPY从340跌至220附近，市场极度恐慌。',
    decision:
      '判断这是长期布局SPY的良机。计划分批买入，每次下跌5%加仓一次，同时卖出虚值看跌期权获取额外权利金。',
    execution:
      '在220-260区间分4批建仓，每批占总仓位的25%。同时每月卖出1-2张到期日30-45天的虚值看跌期权，权利金年化约8-12%。',
    result:
      '持仓至今，成本约240，现价远超成本。期权累计权利金收入摊薄成本约15%，实现了"股价上涨赚差价，横盘赚权利金"的双重收益。',
    sort_order: 1,
  },
  {
    id: '2',
    title: '港股高股息攒股策略',
    context: '2023年港股持续低迷，多只高息蓝筹股股息率超过8%，但市场情绪悲观。',
    decision:
      '选定3只现金流稳定、派息历史超过10年的港股央企，采用每月定额买入的方式持续建仓。',
    execution:
      '每月固定投入等额资金，不分价格高低。在股价承压时单位资金买入更多股数，实现自然摊薄成本。期间收到的股息全部再投入。',
    result:
      '持仓约2年，平均股息率7.5%，复利再投后持仓成本逐步下降。即使股价未明显上涨，仅股息回报已远超同期理财产品。',
    sort_order: 2,
  },
  {
    id: '3',
    title: '倒金字塔建仓应对震荡市',
    context:
      '2024年某优质科技股因行业政策利空出现回调，从高点下跌约30%，进入震荡区间。',
    decision:
      '分析判断公司基本面未恶改，利空影响有限。采用倒金字塔建仓：价格越低，买入越多。设定4个买入层级。',
    execution:
      '第一层（跌30%）：买入10%目标仓位；第二层（跌35%）：买入20%；第三层（跌40%）：买入30%；第四层（跌45%）：买入40%。每层之间间隔至少2周。',
    result:
      '实际只触发到第三层，平均成本低于初始买入价约12%。股价企稳反弹后，仓位获利约18%。倒金字塔结构让底部筹码权重更大，有效放大了反弹收益。',
    sort_order: 3,
  },
];

import type { Resource } from '@/types';

const STATIC_RESOURCES: Resource[] = [
  {
    id: 'static-1',
    type: 'link',
    title: '巴菲特致股东的信（2024）',
    description: 'Berkshire Hathaway 年度致股东信，价值投资必读。',
    url: 'https://www.berkshirehathaway.com/letters/2024ltr.pdf',
    file_path: null,
    sort_order: 1,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'static-2',
    type: 'link',
    title: '穷查理宝典：查理·芒格的智慧',
    description: '芒格关于投资决策、思维模型和心理偏误的经典论述。',
    url: 'https://example.com/poor-charlies-almanack',
    file_path: null,
    sort_order: 2,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

export async function getResources(): Promise<Resource[]> {
  try {
    const supabase = await createServerSideClient();
    const { data, error } = await supabase
      .from('about_resources')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return STATIC_RESOURCES;
    }
    return data;
  } catch {
    return STATIC_RESOURCES;
  }
}

export async function getMilestones(): Promise<Milestone[]> {
  try {
    const supabase = await createServerSideClient();
    const { data, error } = await supabase
      .from('about_milestones')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return STATIC_MILESTONES;
    }
    return data;
  } catch {
    return STATIC_MILESTONES;
  }
}

export async function getCases(): Promise<Case[]> {
  try {
    const supabase = await createServerSideClient();
    const { data, error } = await supabase
      .from('about_cases')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return STATIC_CASES;
    }
    return data;
  } catch {
    return STATIC_CASES;
  }
}
