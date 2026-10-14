import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import * as fontkit from 'fontkit';
import PDFDocument from 'pdfkit';
import type { DecisionReport, DecisionReportField } from './decision-report';

const colors = { ink: '#172033', muted: '#667085', line: '#D9DEE8', panel: '#F5F7FA', accent: '#315EFB', warning: '#9A6700' };
const fontPath = resolve(process.cwd(), 'src/assets/fonts/NotoSansSC-Variable.ttf');

export function getDecisionFieldLabelStyle() {
  return { color: '#000000', font: 'NotoSansSCBold', weight: 900 } as const;
}

function registerDecisionFonts(doc: PDFKit.PDFDocument) {
  const regular = fontkit.create(readFileSync(fontPath));
  const bold = regular.getVariation({ wght: getDecisionFieldLabelStyle().weight });
  const documentWithFontObjects = doc as PDFKit.PDFDocument & {
    registerFont(name: string, source: fontkit.Font): PDFKit.PDFDocument;
  };
  documentWithFontObjects.registerFont('NotoSansSC', regular);
  documentWithFontObjects.registerFont('NotoSansSCBold', bold);
}

export function hasPrintableFields(fields: DecisionReportField[]) {
  return fields.some((field) => field.value.trim().length > 0);
}

export function getDecisionPdfPresentation(status: DecisionReport['meta']['status']) {
  return status === 'finalized'
    ? {
        title: '已定稿投资决策报告',
        timeLabel: '定稿时间',
        notice: '本报告固定使用决策定稿时关联的研究快照。后来更新的研究、持仓、交易和复盘不会改写本报告。',
      }
    : {
        title: '投资决策草稿',
        timeLabel: '最后保存时间',
        notice: '本报告为尚未定稿的决策草稿，内容可能继续变化。',
      };
}

function formatDate(value: string | null) {
  if (!value) return '未注明日期';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeZone: 'Asia/Shanghai' }).format(date);
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  const bottom = doc.page.height - doc.page.margins.bottom - 28;
  if (doc.y + height > bottom) doc.addPage();
}

function drawHeading(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 58);
  doc.moveDown(0.7).fillColor(colors.accent).fontSize(15).text(title);
  doc.moveDown(0.25).strokeColor(colors.line).lineWidth(1).moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
  doc.moveDown(0.65);
}

function drawFields(doc: PDFKit.PDFDocument, fields: DecisionReportField[]) {
  const labelStyle = getDecisionFieldLabelStyle();
  for (const field of fields) {
    if (!field.value.trim()) continue;
    const height = doc.fontSize(9.5).heightOfString(field.value, { width: 487, lineGap: 4 }) + 40;
    ensureSpace(doc, Math.min(height, 180));
    doc.fillColor(labelStyle.color).font(labelStyle.font).fontSize(11).text(field.label);
    doc.font('NotoSansSC');
    doc.moveDown(0.22).fillColor(colors.muted).fontSize(9.5).text(field.value, { width: 487, lineGap: 4 });
    doc.moveDown(0.72);
  }
}

function drawList(doc: PDFKit.PDFDocument, values: string[]) {
  values.filter((value) => value.trim()).forEach((value) => {
    ensureSpace(doc, 32);
    doc.fillColor(colors.muted).fontSize(9.5).text(`• ${value}`, { width: 487, lineGap: 4 });
    doc.moveDown(0.35);
  });
}

function drawHypothesis(doc: PDFKit.PDFDocument, index: number, item: DecisionReport['hypotheses'][number]) {
  const lines = [
    `状态：${item.statusLabel}`,
    item.keyVariables ? `关键变量：${item.keyVariables}` : '',
    `下次检查：${formatDate(item.nextCheckAt)}`,
  ].filter(Boolean).join('\n');
  doc.fontSize(10.5);
  const height = doc.heightOfString(`${index + 1}. ${item.statement}`, { width: 455, lineGap: 2 })
    + doc.fontSize(9).heightOfString(lines, { width: 455, lineGap: 3 }) + 30;
  ensureSpace(doc, Math.min(height, 160));
  const top = doc.y;
  doc.save().roundedRect(doc.page.margins.left, top, 487, height, 6).fill(colors.panel).restore();
  doc.fillColor(colors.ink).fontSize(10.5).text(`${index + 1}. ${item.statement}`, 66, top + 10, { width: 455, lineGap: 2 });
  doc.moveDown(0.3).fillColor(colors.muted).fontSize(9).text(lines, { width: 455, lineGap: 3 });
  doc.y = top + height + 9;
}

function drawFooter(doc: PDFKit.PDFDocument, assetName: string, pageNumber: number, pageCount: number) {
  const y = doc.page.height - doc.page.margins.bottom - 15;
  doc.save().fontSize(8).fillColor(colors.muted).text(assetName, doc.page.margins.left, y, { width: 280, lineBreak: false });
  doc.text(`${pageNumber} / ${pageCount}`, doc.page.width - doc.page.margins.right - 80, y, { width: 80, align: 'right', lineBreak: false });
  doc.restore();
}

export async function renderDecisionPdf(report: DecisionReport): Promise<Buffer> {
  return new Promise((resolveBuffer, reject) => {
    const presentation = getDecisionPdfPresentation(report.meta.status);
    const doc = new PDFDocument({
      size: 'A4', margins: { top: 54, right: 54, bottom: 58, left: 54 }, bufferPages: true,
      info: { Title: `${report.meta.assetName} - 投资决策报告`, Author: '人生工作台' },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolveBuffer(Buffer.concat(chunks)));

    registerDecisionFonts(doc);
    doc.font('NotoSansSC');
    doc.fillColor(colors.accent).fontSize(13).text('人生工作台 · 投资决策', { align: 'center' });
    doc.moveDown(4).fillColor(colors.ink).fontSize(28).text(report.meta.assetName, { align: 'center' });
    doc.moveDown(0.7).fontSize(18).text(presentation.title, { align: 'center' });
    doc.moveDown(2).fontSize(12).fillColor(colors.warning).text(report.meta.decisionLabel, { align: 'center' });
    doc.moveDown(4).fillColor(colors.muted).fontSize(9.5).text(`决策日期：${formatDate(report.meta.decisionDate)}`, { align: 'center' });
    doc.moveDown(0.45).text(`${presentation.timeLabel}：${formatDate(report.meta.recordedAt)}`, { align: 'center' });
    doc.moveDown(0.45).text(`关联研究快照：第 ${report.meta.snapshotVersion} 版 · ${formatDate(report.meta.snapshotCreatedAt)}`, { align: 'center' });
    doc.moveDown(0.45).text(`导出时间：${formatDate(report.meta.exportedAt)}`, { align: 'center' });
    doc.moveDown(7).fontSize(9).text('个人投资决策记录，不构成投资建议。', { align: 'center' });

    doc.addPage();
    drawHeading(doc, report.meta.status === 'finalized' ? '最终结论' : '当前结论');
    drawFields(doc, report.conclusion);
    drawHeading(doc, '判断与估值');
    drawFields(doc, report.judgment);
    if (hasPrintableFields(report.execution)) {
      drawHeading(doc, '执行计划');
      drawFields(doc, report.execution);
    }
    drawHeading(doc, '错误预案');
    drawFields(doc, report.errorPlan);
    if (report.doNotList.length) {
      ensureSpace(doc, 78);
      doc.fillColor(colors.ink).fontSize(11).text('不做清单');
      doc.moveDown(0.3);
      drawList(doc, report.doNotList);
    }

    drawHeading(doc, `关联研究快照 · 第 ${report.meta.snapshotVersion} 版`);
    drawFields(doc, report.researchSummary);
    drawHeading(doc, '快照中的核心研究');
    drawFields(doc, report.researchSections);
    if (report.hypotheses.length) {
      drawHeading(doc, '快照中的研究假设');
      report.hypotheses.forEach((item, index) => drawHypothesis(doc, index, item));
    }
    ensureSpace(doc, 60);
    doc.moveDown(0.8).fillColor(colors.muted).fontSize(8.5).text(presentation.notice, { lineGap: 3 });

    const range = doc.bufferedPageRange();
    for (let index = 0; index < range.count; index += 1) {
      doc.switchToPage(range.start + index);
      drawFooter(doc, report.meta.assetName, index + 1, range.count);
    }
    doc.end();
  });
}

export async function renderDecisionArchivePdf(reports: DecisionReport[]): Promise<Buffer> {
  return new Promise((resolveBuffer, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 54, right: 54, bottom: 58, left: 54 }, bufferPages: true, info: { Title: `${reports[0]?.meta.assetName ?? ''} - 投资决策档案`, Author: '人生工作台' } });
    const chunks: Buffer[] = []; doc.on('data', (chunk: Buffer) => chunks.push(chunk)); doc.on('error', reject); doc.on('end', () => resolveBuffer(Buffer.concat(chunks)));
    registerDecisionFonts(doc);
    doc.font('NotoSansSC');
    const assetName = reports[0]?.meta.assetName ?? '投资决策';
    doc.fillColor(colors.accent).fontSize(13).text('人生工作台 · 决策档案', { align: 'center' });
    doc.moveDown(4).fillColor(colors.ink).fontSize(28).text(assetName, { align: 'center' });
    doc.moveDown(0.7).fontSize(18).text('历次投资决策', { align: 'center' });
    doc.moveDown(4).fillColor(colors.muted).fontSize(10).text(`共 ${reports.length} 次已定稿决策`, { align: 'center' });
    doc.addPage(); drawHeading(doc, '目录');
    reports.forEach((report, index) => drawFields(doc, [{ label: `${index + 1}. ${formatDate(report.meta.decisionDate)} · ${report.meta.decisionLabel}`, value: report.conclusion.find((item) => item.label === '核心理由')?.value ?? '' }]));
    reports.forEach((report, index) => {
      doc.addPage(); drawHeading(doc, `${index + 1}. ${formatDate(report.meta.decisionDate)} · ${report.meta.decisionLabel}`);
      drawFields(doc, report.conclusion); drawHeading(doc, '判断与估值'); drawFields(doc, report.judgment);
      if (hasPrintableFields(report.execution)) { drawHeading(doc, '执行计划'); drawFields(doc, report.execution); }
      drawHeading(doc, '错误预案'); drawFields(doc, report.errorPlan);
      if (report.doNotList.length) { doc.fillColor(colors.ink).fontSize(11).text('不做清单'); doc.moveDown(0.3); drawList(doc, report.doNotList); }
      drawHeading(doc, `当时的研究快照 · 第 ${report.meta.snapshotVersion} 版`); drawFields(doc, report.researchSummary); drawFields(doc, report.researchSections);
      if (report.hypotheses.length) { drawHeading(doc, '当时的研究假设'); report.hypotheses.forEach((item, hypothesisIndex) => drawHypothesis(doc, hypothesisIndex, item)); }
    });
    const range = doc.bufferedPageRange(); for (let index = 0; index < range.count; index += 1) { doc.switchToPage(range.start + index); drawFooter(doc, assetName, index + 1, range.count); }
    doc.end();
  });
}
