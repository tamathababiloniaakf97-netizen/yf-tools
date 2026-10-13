// @vitest-environment node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ResearchReport } from './research-report';
import {
  buildInformationGapLines,
  formatHypothesisTitle,
  formatResearchSectionTitle,
  getVisibleResearchReportSections,
  renderResearchPdf,
} from './research-pdf';

const longEvidence = '公司在最新季度披露的经营数据出现变化，需要结合管理层说明和后续两个季度的数据继续验证。'.repeat(8);

const report: ResearchReport = {
  meta: { assetName: '示例科技公司', status: '研究进行中', updatedAt: '2026-09-30T10:00:00.000Z', exportedAt: '2026-10-01T08:00:00.000Z' },
  summary: [
    { label: '当前判断', value: '业务质量较高，但当前证据不足以支持进一步结论。' },
    { label: '投资逻辑', value: '客户留存、规模效应和持续研发投入构成长期研究重点。' },
    { label: '主要风险', value: '竞争格局变化、监管要求以及核心产品需求下降。' },
    { label: '判断失效条件', value: '核心客户连续流失且单位经济模型持续恶化。' },
  ],
  sections: [
    { label: '业务模式', value: '通过企业软件订阅和增值服务获得收入。' },
    { label: '客户价值', value: '降低协作成本并提高业务流程的可追踪性。' },
    { label: '竞争优势', value: '历史数据沉淀、产品集成与渠道覆盖。' },
    { label: '长期关键假设', value: '客户数字化投入保持增长，续费率维持稳定。' },
    { label: '管理层与文化', value: '资本配置仍需长期观察。' },
    { label: '仍不知道的事项', value: '海外市场的真实获客成本。' },
  ],
  checklist: [{ label: 'pricing power', statusLabel: '需要验证', note: '跟踪下一次续费价格' }],
  hypotheses: [
    { id: 'h1', statement: '企业客户续费率保持稳定', keyVariables: '净收入留存率', statusLabel: '待验证', nextCheckAt: '2026-11-01' },
    { id: 'h2', statement: '新产品能提高客单价', keyVariables: '交叉销售率', statusLabel: '受到挑战', nextCheckAt: null },
  ],
  evidence: Array.from({ length: 12 }, (_, index) => ({
    content: longEvidence,
    impactLabel: index % 2 ? '支持' : '挑战',
    sourceName: index === 0 ? '' : '季度报告',
    sourceUrl: index === 0 ? null : `https://example.com/research/source/${index}?from=company-report&section=evidence`,
    occurredAt: `2026-09-${String(28 - index).padStart(2, '0')}`,
    hypothesisStatement: index % 2 ? '企业客户续费率保持稳定' : '新产品能提高客单价',
  })),
  currentResearchCitations: [{ fieldLabel: '客户价值', items: [{ title: '客户续约率保持稳定', excerpt: '续约率连续三个季度稳定。', impactLabel: '支持', sourceName: '季度报告', sourceDate: '2026-09-28', personalNote: '继续观察提价后的流失率。' }] }],
  gaps: {
    explicitUnknowns: '海外市场的真实获客成本。',
    missingCoreFields: ['经济质量'],
    hypothesesWithoutEvidence: ['企业客户续费率保持稳定'],
    evidenceWithoutSource: ['公司披露口径发生变化'],
  },
};

describe('research PDF renderer', () => {
  it('uses the editor category and question for core research headings', () => {
    expect(formatResearchSectionTitle('业务模式')).toBe('生意本质｜公司靠什么生意挣钱？');
    expect(formatResearchSectionTitle('竞争优势')).toBe('持续竞争力｜竞争优势来自哪里，靠什么持续？');
    expect(formatResearchSectionTitle('管理层与文化')).toBe('管理层与文化');
  });

  it('numbers hypotheses using their current PDF order', () => {
    expect(formatHypothesisTitle(0, '护城河仍需验证')).toBe('假设 1｜护城河仍需验证');
    expect(formatHypothesisTitle(9, '需求持续增长')).toBe('假设 10｜需求持续增长');
  });

  it('omits headings for sections that contain no information', () => {
    expect(getVisibleResearchReportSections({
      ...report,
      summary: [], sections: [], currentResearchCitations: [], checklist: [], hypotheses: [], evidence: [],
    })).toEqual([]);
    expect(getVisibleResearchReportSections(report)).toEqual(['summary', 'research', 'citations', 'checklist', 'hypotheses', 'evidence']);
  });

  it('renders a non-trivial PDF buffer with a valid signature', async () => {
    const pdf = await renderResearchPdf(report);
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(pdf.byteLength).toBeGreaterThan(10_000);
    const pageCount = pdf.toString('latin1').match(/\/Type \/Page\b/g)?.length ?? 0;
    expect(pageCount).toBeGreaterThan(1);
    expect(pageCount).toBeLessThan(12);
  });

  it('lists concrete information gaps and omits empty counters', () => {
    expect(buildInformationGapLines(report.gaps)).toEqual([
      '仍待确认：海外市场的真实获客成本。',
      '关键假设尚无关联证据：企业客户续费率保持稳定',
      '无法追溯来源的证据：公司披露口径发生变化',
      '尚未形成判断：经济质量',
    ]);
    expect(buildInformationGapLines({ explicitUnknowns: '', missingCoreFields: [], hypothesesWithoutEvidence: [], evidenceWithoutSource: [] }))
      .toEqual(['当前记录中没有明确的信息缺口，但这不代表研究已经充分。']);
  });

  it('writes the representative fixture only when explicitly requested', async () => {
    const output = resolve('output/pdf/company-research-sample.pdf');
    if (process.env.GENERATE_RESEARCH_PDF_FIXTURE !== '1') {
      expect(process.env.GENERATE_RESEARCH_PDF_FIXTURE).not.toBe('1');
      return;
    }
    const pdf = await renderResearchPdf(report);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, pdf);
    expect(existsSync(output)).toBe(true);
  });
});
