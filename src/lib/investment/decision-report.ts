import type { InvestmentDecision, InvestmentDecisionType, ResearchHypothesisStatus, ResearchSnapshot } from '@/types/life-os';

const decisionLabels: Record<InvestmentDecisionType, string> = {
  buy: '买入', add: '加仓', hold: '持有', reduce: '减仓', sell: '卖出', watch: '继续观察', skip: '放弃',
};

const hypothesisLabels: Record<ResearchHypothesisStatus, string> = {
  unverified: '未验证', supported: '获得支持', challenged: '受到挑战', inconclusive: '暂无结论',
};

export type DecisionReportField = { label: string; value: string };

export type DecisionReport = {
  meta: {
    assetName: string;
    decisionLabel: string;
    decisionDate: string | null;
    finalizedAt: string;
    exportedAt: string;
    snapshotVersion: number;
    snapshotCreatedAt: string;
  };
  conclusion: DecisionReportField[];
  judgment: DecisionReportField[];
  execution: DecisionReportField[];
  errorPlan: DecisionReportField[];
  doNotList: string[];
  researchSummary: DecisionReportField[];
  researchSections: DecisionReportField[];
  hypotheses: Array<{ statement: string; keyVariables: string; statusLabel: string; nextCheckAt: string | null }>;
};

export function buildDecisionReport({ decision, snapshot, exportedAt }: { decision: InvestmentDecision; snapshot: ResearchSnapshot; exportedAt: string }): DecisionReport {
  const profile = snapshot.snapshot_data.profile;
  const label = decision.decision_type ? decisionLabels[decision.decision_type] : '未注明';
  return {
    meta: {
      assetName: decision.asset_name,
      decisionLabel: label,
      decisionDate: decision.decision_date,
      finalizedAt: decision.updated_at,
      exportedAt,
      snapshotVersion: snapshot.snapshot_version,
      snapshotCreatedAt: snapshot.created_at,
    },
    conclusion: [
      { label: '最终决定', value: label },
      { label: '核心理由', value: decision.final_reason },
    ],
    judgment: [
      { label: '市场已经预期什么', value: decision.market_expectation },
      { label: '个人判断与市场的分歧', value: decision.personal_divergence },
      { label: '估值结论', value: decision.valuation_conclusion },
      { label: '估值关键假设', value: decision.valuation_assumptions },
      { label: '安全边际', value: decision.safety_margin },
    ],
    execution: [{ label: '仓位上限、资金安排和分批原则', value: decision.investment_plan }],
    errorPlan: [
      { label: '哪些信号说明判断可能错误', value: decision.error_signals },
      { label: '判断错误后的动作', value: decision.error_response },
    ],
    doNotList: decision.do_not_list,
    researchSummary: [
      { label: '当时的当前判断', value: profile.current_judgment },
      { label: '当时的投资逻辑', value: profile.investment_thesis },
      { label: '当时记录的主要风险', value: profile.risks },
      { label: '当时的判断失效条件', value: profile.invalidation_conditions },
    ],
    researchSections: [
      { label: '商业模式', value: profile.business_model },
      { label: '客户价值', value: profile.customer_value },
      { label: '竞争优势', value: profile.competitive_advantage },
      { label: '长期关键假设', value: profile.long_term_assumptions },
      { label: '盈利质量', value: profile.earnings_quality },
      { label: '管理层与文化', value: profile.management_culture },
      { label: '当时仍不知道的事项', value: profile.unknowns },
    ],
    hypotheses: snapshot.snapshot_data.hypotheses.map((item) => ({
      statement: item.statement,
      keyVariables: item.key_variables,
      statusLabel: hypothesisLabels[item.status],
      nextCheckAt: item.next_check_at,
    })),
  };
}

function dateInShanghai(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function buildDecisionPdfFilename(assetName: string, decisionDate: string | null, exportedAt = new Date()) {
  const safeAsset = assetName.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || '未命名标的';
  return `${safeAsset}-投资决策-${decisionDate || dateInShanghai(exportedAt)}.pdf`;
}
