// @vitest-environment node
import { dirname, resolve } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { DecisionReport } from './decision-report';
import { getDecisionPdfPresentation, hasPrintableFields, renderDecisionArchivePdf, renderDecisionPdf } from './decision-pdf';

const report: DecisionReport = {
  meta: {
    assetName: '腾讯控股', decisionLabel: '买入', decisionDate: '2026-10-01',
    status: 'finalized', statusLabel: '已定稿', recordedAt: '2026-10-01T08:00:00+08:00', exportedAt: '2026-10-02T08:00:00+08:00',
    snapshotVersion: 3, snapshotCreatedAt: '2026-09-29T08:00:00+08:00',
  },
  conclusion: [{ label: '最终决定', value: '买入' }, { label: '核心理由', value: '当前估值提供一定安全边际，长期现金流质量与预期回报匹配。' }],
  judgment: [
    { label: '市场已经预期什么', value: '市场认为游戏恢复和广告增长将逐步放缓。' },
    { label: '个人判断与市场的分歧', value: '视频号商业化和新品周期可能带来高于一致预期的现金流。' },
    { label: '估值结论', value: '处于历史中低区间，但不属于极端低估。' },
    { label: '估值关键假设', value: '未来三年收入保持中个位数增长，利润率不明显下降。' },
    { label: '安全边际', value: '用保守增长率估算仍有可接受回报。' },
  ],
  execution: [{ label: '仓位上限、资金安排和分批原则', value: '总仓位不超过10%，分三次建立，不使用新增融资。' }],
  errorPlan: [
    { label: '哪些信号说明判断可能错误', value: '核心游戏流水和广告份额连续两个季度低于行业。' },
    { label: '判断错误后的动作', value: '暂停加仓，更新研究并重新评估估值假设。' },
  ],
  doNotList: ['不因单日涨跌追价', '不在缺乏研究更新时扩大仓位'],
  researchSummary: [
    { label: '当时的当前判断', value: '基本面稳定，等待合适估值。' },
    { label: '当时的投资逻辑', value: '核心业务现金流与长期竞争优势仍然成立。' },
    { label: '当时记录的主要风险', value: '监管、竞争和资本配置。' },
    { label: '当时的判断失效条件', value: '核心用户关系链或现金流能力持续恶化。' },
  ],
  researchSections: [
    { label: '商业模式', value: '游戏、广告和金融科技服务。' },
    { label: '客户价值', value: '连接用户、内容与商业服务。' },
    { label: '竞争优势', value: '社交关系链、规模和产品组合。' },
    { label: '长期关键假设', value: '用户价值和商业化效率保持稳定。' },
    { label: '盈利质量', value: '自由现金流较稳定。' },
    { label: '管理层与文化', value: '资本配置总体审慎。' },
    { label: '当时仍不知道的事项', value: 'AI投入的长期回报率。' },
  ],
  hypotheses: Array.from({ length: 8 }, (_, index) => ({
    statement: `研究假设 ${index + 1}：核心业务保持竞争力并形成可验证结果。`,
    keyVariables: '收入增速、市场份额、自由现金流',
    statusLabel: index % 2 ? '暂时支持' : '待验证',
    nextCheckAt: index % 2 ? null : '2026-11-15',
  })),
};

describe('decision PDF renderer', () => {
  it('uses status-specific cover text and record notice', () => {
    expect(getDecisionPdfPresentation('draft')).toEqual({
      title: '投资决策草稿', timeLabel: '最后保存时间',
      notice: '本报告为尚未定稿的决策草稿，内容可能继续变化。',
    });
    expect(getDecisionPdfPresentation('finalized')).toEqual({
      title: '已定稿投资决策报告', timeLabel: '定稿时间',
      notice: '本报告固定使用决策定稿时关联的研究快照。后来更新的研究、持仓、交易和复盘不会改写本报告。',
    });
  });

  it('hides an optional section when all of its fields are blank', () => {
    expect(hasPrintableFields([{ label: '仓位上限', value: '   ' }])).toBe(false);
    expect(hasPrintableFields([{ label: '仓位上限', value: '分三次建立' }])).toBe(true);
  });

  it('renders a valid multi-section PDF', async () => {
    const pdf = await renderDecisionPdf(report);
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(pdf.byteLength).toBeGreaterThan(8_000);
    const pageCount = pdf.toString('latin1').match(/\/Type \/Page\b/g)?.length ?? 0;
    expect(pageCount).toBeGreaterThan(1);
    expect(pageCount).toBeLessThan(10);
  });

  it('renders multiple chronological decisions as one archive PDF', async () => {
    const pdf = await renderDecisionArchivePdf([report, { ...report, meta: { ...report.meta, decisionLabel: '加仓', decisionDate: '2026-11-01' } }]);
    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(pdf.toString('latin1').match(/\/Type \/Page\b/g)?.length ?? 0).toBeGreaterThan(2);
  });

  it('writes the representative fixture only when explicitly requested', async () => {
    const finalizedOutput = resolve('output/pdf/investment-decision-sample.pdf');
    const draftOutput = resolve('output/pdf/investment-decision-draft-sample.pdf');
    if (process.env.GENERATE_DECISION_PDF_FIXTURE !== '1') {
      expect(process.env.GENERATE_DECISION_PDF_FIXTURE).not.toBe('1');
      return;
    }
    mkdirSync(dirname(finalizedOutput), { recursive: true });
    writeFileSync(finalizedOutput, await renderDecisionPdf(report));
    writeFileSync(draftOutput, await renderDecisionPdf({
      ...report,
      meta: { ...report.meta, status: 'draft', statusLabel: '草稿', decisionDate: null },
      conclusion: [{ label: '当前决定', value: '未注明' }, { label: '核心理由', value: '' }],
      execution: [{ label: '仓位上限、资金安排和分批原则', value: '' }],
    }));
    expect(existsSync(finalizedOutput)).toBe(true);
    expect(existsSync(draftOutput)).toBe(true);
  });
});
