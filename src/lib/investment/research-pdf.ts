import { resolve } from 'node:path';
import PDFDocument from 'pdfkit';
import type { ResearchReport } from './research-report';

const colors = { ink: '#172033', muted: '#667085', line: '#D9DEE8', panel: '#F5F7FA', accent: '#315EFB', warning: '#9A6700' };
const fontPath = resolve(process.cwd(), 'src/assets/fonts/NotoSansSC-Variable.ttf');

export type VisibleResearchReportSection = 'summary' | 'research' | 'citations' | 'checklist' | 'hypotheses' | 'evidence';

export function getVisibleResearchReportSections(report: ResearchReport): VisibleResearchReportSection[] {
  const sections: VisibleResearchReportSection[] = [];
  if (report.summary.length) sections.push('summary');
  if (report.sections.length) sections.push('research');
  if (report.currentResearchCitations.length) sections.push('citations');
  if (report.checklist.length) sections.push('checklist');
  if (report.hypotheses.length) sections.push('hypotheses');
  if (report.evidence.length) sections.push('evidence');
  return sections;
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

function drawSectionHeading(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 58);
  doc.moveDown(0.7).fillColor(colors.accent).fontSize(15).text(title, { continued: false });
  doc.moveDown(0.25).strokeColor(colors.line).lineWidth(1).moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
  doc.moveDown(0.65);
}

function drawLabeledText(doc: PDFKit.PDFDocument, label: string, value: string) {
  if (!value.trim()) return;
  ensureSpace(doc, 76);
  doc.fillColor(colors.ink).fontSize(11).text(label);
  doc.moveDown(0.22).fillColor(colors.muted).fontSize(9.5).text(value, { lineGap: 4 });
  doc.moveDown(0.72);
}

function drawRecordCard(doc: PDFKit.PDFDocument, title: string, lines: Array<{ label: string; value: string }>) {
  const usefulLines = lines.filter((line) => line.value.trim());
  const text = usefulLines.map((line) => `${line.label}：${line.value}`).join('\n');
  const titleHeight = doc.heightOfString(title, { width: 455, lineGap: 2 });
  const bodyHeight = doc.fontSize(9).heightOfString(text, { width: 455, lineGap: 3 });
  const height = Math.max(58, titleHeight + bodyHeight + 30);
  const availablePageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom - 48;
  if (height > availablePageHeight) {
    ensureSpace(doc, 90);
    doc.fillColor(colors.ink).fontSize(10.5).text(title, { width: 455, lineGap: 2 });
    doc.moveDown(0.3).fillColor(colors.muted).fontSize(9).text(text || '暂无补充信息', { width: 455, lineGap: 3 });
    doc.moveDown(0.8);
    return;
  }
  ensureSpace(doc, height);
  const top = doc.y;
  doc.save().roundedRect(doc.page.margins.left, top, doc.page.width - doc.page.margins.left - doc.page.margins.right, height, 6).fill(colors.panel).restore();
  doc.fillColor(colors.ink).fontSize(10.5).text(title, doc.page.margins.left + 12, top + 10, { width: 455, lineGap: 2 });
  doc.moveDown(0.3).fillColor(colors.muted).fontSize(9).text(text || '暂无补充信息', { width: 455, lineGap: 3 });
  doc.y = top + height + 9;
}

function truncateDisplayUrl(url: string) {
  return url.length > 72 ? `${url.slice(0, 69)}...` : url;
}

function drawEvidenceCard(doc: PDFKit.PDFDocument, index: number, item: ResearchReport['evidence'][number]) {
  const title = `${index + 1}. ${item.content}`;
  const details = [
    `影响方向：${item.impactLabel}`,
    item.hypothesisStatement ? `关联假设：${item.hypothesisStatement}` : '',
    `发生时间：${formatDate(item.occurredAt)}`,
    `来源：${item.sourceName || (item.sourceUrl ? '原文链接' : '来源未记录')}`,
  ].filter(Boolean).join('\n');
  const linkText = item.sourceUrl ? truncateDisplayUrl(item.sourceUrl) : '';
  doc.fontSize(10.5);
  const titleHeight = doc.heightOfString(title, { width: 455, lineGap: 2 });
  doc.fontSize(9);
  const detailsHeight = doc.heightOfString(details, { width: 455, lineGap: 3 });
  const linkHeight = linkText ? doc.heightOfString(linkText, { width: 455, lineGap: 2 }) + 5 : 0;
  const height = titleHeight + detailsHeight + linkHeight + 30;
  const availablePageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom - 48;
  if (height > availablePageHeight) {
    ensureSpace(doc, 100);
    doc.fillColor(colors.ink).fontSize(10.5).text(title, { width: 455, lineGap: 2 });
    doc.moveDown(0.3).fillColor(colors.muted).fontSize(9).text(details, { width: 455, lineGap: 3 });
    if (item.sourceUrl) doc.fillColor(colors.accent).fontSize(8.5).text(linkText, { link: item.sourceUrl, underline: true, width: 455 });
    doc.moveDown(0.8);
    return;
  }
  ensureSpace(doc, height);
  const top = doc.y;
  const left = doc.page.margins.left + 12;
  doc.save().roundedRect(doc.page.margins.left, top, doc.page.width - doc.page.margins.left - doc.page.margins.right, height, 6).fill(colors.panel).restore();
  doc.fillColor(colors.ink).fontSize(10.5).text(title, left, top + 10, { width: 455, lineGap: 2 });
  doc.moveDown(0.3).fillColor(colors.muted).fontSize(9).text(details, { width: 455, lineGap: 3 });
  if (item.sourceUrl) doc.moveDown(0.25).fillColor(colors.accent).fontSize(8.5).text(linkText, { link: item.sourceUrl, underline: true, width: 455 });
  doc.y = top + height + 9;
}

function drawCitationCard(doc: PDFKit.PDFDocument, item: ResearchReport['currentResearchCitations'][number]['items'][number]) {
  drawRecordCard(doc, item.title, [
    { label: '关键摘录', value: item.excerpt }, { label: '作用', value: item.impactLabel },
    { label: '来源', value: [item.sourceName, item.sourceDate].filter(Boolean).join(' · ') || '来源未记录' },
    { label: '我的理解', value: item.personalNote },
  ]);
}

function drawFooter(doc: PDFKit.PDFDocument, company: string, pageNumber: number, pageCount: number) {
  const y = doc.page.height - doc.page.margins.bottom - 15;
  doc.save().fontSize(8).fillColor(colors.muted).text(company, doc.page.margins.left, y, { width: 280, lineBreak: false });
  doc.text(`${pageNumber} / ${pageCount}`, doc.page.width - doc.page.margins.right - 80, y, { width: 80, align: 'right', lineBreak: false });
  doc.restore();
}

export async function renderResearchPdf(report: ResearchReport): Promise<Buffer> {
  return new Promise((resolveBuffer, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 54, right: 54, bottom: 58, left: 54 }, bufferPages: true, info: { Title: `${report.meta.assetName} - 当前公司研究报告`, Author: '人生工作台' } });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolveBuffer(Buffer.concat(chunks)));

    doc.registerFont('NotoSansSC', fontPath).font('NotoSansSC');
    doc.fillColor(colors.accent).fontSize(13).text('人生工作台 · 公司研究', { align: 'center' });
    doc.moveDown(4).fillColor(colors.ink).fontSize(28).text(report.meta.assetName, { align: 'center' });
    doc.moveDown(0.7).fontSize(18).text('当前公司研究报告', { align: 'center' });
    doc.moveDown(2).fontSize(11).fillColor(report.meta.status === '研究进行中' ? colors.warning : colors.accent).text(report.meta.status, { align: 'center' });
    doc.moveDown(4).fillColor(colors.muted).fontSize(9.5).text(`研究更新：${formatDate(report.meta.updatedAt)}`, { align: 'center' });
    doc.moveDown(0.5).text(`导出时间：${formatDate(report.meta.exportedAt)}`, { align: 'center' });
    doc.moveDown(8).fontSize(9).text('个人研究记录，不构成投资建议。', { align: 'center' });

    doc.addPage();
    const visibleSections = new Set(getVisibleResearchReportSections(report));
    if (visibleSections.has('summary')) {
      drawSectionHeading(doc, '核心摘要');
      report.summary.forEach((item) => drawLabeledText(doc, item.label, item.value));
    }

    if (visibleSections.has('research')) {
      drawSectionHeading(doc, '公司研究');
      report.sections.forEach((item) => drawLabeledText(doc, item.label, item.value));
    }

    if (visibleSections.has('citations')) {
      drawSectionHeading(doc, '当前研究引用资料');
      report.currentResearchCitations.forEach((group) => {
        ensureSpace(doc, 180);
        drawLabeledText(doc, group.fieldLabel, `${group.items.length} 条引用资料`);
        group.items.forEach((item) => drawCitationCard(doc, item));
      });
    }

    if (visibleSections.has('checklist')) {
      drawSectionHeading(doc, '辅助检查');
      report.checklist.forEach((item) => drawRecordCard(doc, item.label, [{ label: '状态', value: item.statusLabel }, { label: '备注', value: item.note }]));
    }

    if (visibleSections.has('hypotheses')) {
      drawSectionHeading(doc, '假设与验证');
      report.hypotheses.forEach((item) => drawRecordCard(doc, item.statement, [
        { label: '状态', value: item.statusLabel }, { label: '关键变量', value: item.keyVariables },
        { label: '下次检查', value: item.nextCheckAt ? formatDate(item.nextCheckAt) : '未设置' },
      ]));
    }

    if (visibleSections.has('evidence')) {
      drawSectionHeading(doc, '证据记录');
      report.evidence.forEach((item, index) => drawEvidenceCard(doc, index, item));
    }

    drawSectionHeading(doc, '资料缺口');
    const gapLines = [
      report.gaps.missingCoreFields.length ? `未填写的核心字段：${report.gaps.missingCoreFields.join('、')}` : '核心研究字段已填写',
      `未解决或受到挑战的假设：${report.gaps.unresolvedHypothesisCount} 条`,
      `来源未记录的证据：${report.gaps.evidenceWithoutSourceCount} 条`,
    ];
    gapLines.forEach((line) => { doc.fillColor(colors.muted).fontSize(10).text(`• ${line}`, { lineGap: 4 }); doc.moveDown(0.35); });
    doc.moveDown(0.8).fontSize(8.5).text('以上仅反映记录完整性，不代表研究质量，也不构成买卖建议。');

    const range = doc.bufferedPageRange();
    for (let index = 0; index < range.count; index += 1) {
      doc.switchToPage(range.start + index);
      drawFooter(doc, report.meta.assetName, index + 1, range.count);
    }
    doc.end();
  });
}
