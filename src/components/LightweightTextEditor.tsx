'use client';

import { Button, Input, Space, Tooltip } from 'antd';
import { useRef } from 'react';
import { applyInlineFormat, toggleLinePrefix, type FormattingTransform } from '@/lib/lightweight-formatting';

interface LightweightTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
}

export default function LightweightTextEditor({
  value = '',
  onChange,
  placeholder,
  ariaLabel = '正文',
  autoSize = { minRows: 7, maxRows: 16 },
}: LightweightTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function apply(transform: (start: number, end: number) => FormattingTransform) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? start;
    const result = transform(start, end);
    onChange?.(result.value);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  }

  const preventBlur = (event: React.MouseEvent) => event.preventDefault();

  return <div className="lightweight-editor">
    <Space.Compact className="lightweight-editor-toolbar" aria-label="正文格式">
      <Tooltip title="将选中文字加粗"><Button aria-label="粗体" size="small" onMouseDown={preventBlur} onClick={() => apply((start, end) => applyInlineFormat(value, start, end, '**', '粗体文字'))}>粗体</Button></Tooltip>
      <Tooltip title="把当前行设为小标题"><Button aria-label="小标题" size="small" onMouseDown={preventBlur} onClick={() => apply((start, end) => toggleLinePrefix(value, start, end, '## '))}>小标题</Button></Tooltip>
      <Tooltip title="把所选行设为项目列表"><Button aria-label="列表" size="small" onMouseDown={preventBlur} onClick={() => apply((start, end) => toggleLinePrefix(value, start, end, '- '))}>列表</Button></Tooltip>
      <Tooltip title="把所选行设为引用或警示"><Button aria-label="引用" size="small" onMouseDown={preventBlur} onClick={() => apply((start, end) => toggleLinePrefix(value, start, end, '> '))}>引用</Button></Tooltip>
      <Tooltip title="用固定颜色强调选中文字"><Button aria-label="强调" size="small" onMouseDown={preventBlur} onClick={() => apply((start, end) => applyInlineFormat(value, start, end, '==', '强调内容'))}>强调</Button></Tooltip>
    </Space.Compact>
    <Input.TextArea
      ref={(node) => { textareaRef.current = node?.resizableTextArea?.textArea ?? null; }}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      autoSize={autoSize}
      aria-label={ariaLabel}
    />
  </div>;
}
