'use client';

import React, { useState } from 'react';
import { Button } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';

interface Props {
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export default function PdfExport({ contentRef }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!contentRef.current) return;
    setExporting(true);

    // 临时克隆容器，去掉高度限制，确保捕获完整内容
    const originalWidth = contentRef.current.offsetWidth;
    const cloneContainer = document.createElement('div');
    cloneContainer.style.cssText =
      `position:fixed;left:-9999px;top:0;width:${originalWidth}px;z-index:-1;background:#fff;`;
    cloneContainer.innerHTML = contentRef.current.innerHTML;
    document.body.appendChild(cloneContainer);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(cloneContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // 修复文字在表格单元格中偏下的问题
          const style = clonedDoc.createElement('style');
          style.textContent = `
            .ant-table-cell, .ant-card-body, .ant-descriptions-item-content, .ant-tag {
              line-height: 1.4 !important;
              vertical-align: middle !important;
            }
            .ant-table-cell input, .ant-table-cell .ant-input-number, .ant-table-cell .ant-select {
              line-height: 1.2 !important;
              height: auto !important;
            }
            .ant-card-head-title {
              line-height: 1.4 !important;
            }
            .ant-space-item {
              line-height: 1.4 !important;
            }
            td, th {
              vertical-align: middle !important;
            }
            span, div, p {
              line-height: 1.4 !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 mm
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('策略执行手册.pdf');
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      document.body.removeChild(cloneContainer);
      setExporting(false);
    }
  };

  return (
    <Button
      icon={<FilePdfOutlined />}
      onClick={handleExport}
      loading={exporting}
      size="small"
    >
      导出PDF
    </Button>
  );
}
