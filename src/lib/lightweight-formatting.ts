export type InlineToken = { type: 'text' | 'bold' | 'emphasis' | 'boldEmphasis'; value: string };

export type FormattingBlock =
  | { type: 'heading'; content: InlineToken[] }
  | { type: 'paragraph' | 'quote'; lines: InlineToken[][] }
  | { type: 'list'; items: InlineToken[][] };

export interface FormattingTransform {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

function parseInline(value: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern = /(\*\*==([^=\n]+)==\*\*|==\*\*([^*\n]+)\*\*==|\*\*([^*\n]+)\*\*|==([^=\n]+)==)/g;
  let cursor = 0;
  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) tokens.push({ type: 'text', value: value.slice(cursor, index) });
    if (match[2] || match[3]) tokens.push({ type: 'boldEmphasis', value: match[2] ?? match[3] });
    else if (match[4]) tokens.push({ type: 'bold', value: match[4] });
    else tokens.push({ type: 'emphasis', value: match[5] });
    cursor = index + match[0].length;
  }
  if (cursor < value.length || tokens.length === 0) tokens.push({ type: 'text', value: value.slice(cursor) });
  return tokens;
}

export function parseLightweightText(value: string): FormattingBlock[] {
  const blocks: FormattingBlock[] = [];
  const lines = value.replace(/\r\n?/g, '\n').split('\n');
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === '') { index += 1; continue; }

    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', content: parseInline(line.slice(3)) });
      index += 1;
      continue;
    }

    if (line.startsWith('- ')) {
      const items: InlineToken[][] = [];
      while (index < lines.length && lines[index].startsWith('- ')) {
        items.push(parseInline(lines[index].slice(2)));
        index += 1;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    if (line.startsWith('> ')) {
      const quoteLines: InlineToken[][] = [];
      while (index < lines.length && lines[index].startsWith('> ')) {
        quoteLines.push(parseInline(lines[index].slice(2)));
        index += 1;
      }
      blocks.push({ type: 'quote', lines: quoteLines });
      continue;
    }

    const paragraphLines: InlineToken[][] = [];
    while (
      index < lines.length
      && lines[index].trim() !== ''
      && !lines[index].startsWith('## ')
      && !lines[index].startsWith('- ')
      && !lines[index].startsWith('> ')
    ) {
      paragraphLines.push(parseInline(lines[index]));
      index += 1;
    }
    blocks.push({ type: 'paragraph', lines: paragraphLines });
  }

  return blocks;
}

export function applyInlineFormat(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  marker: '**' | '==',
  placeholder: string,
): FormattingTransform {
  const selected = value.slice(selectionStart, selectionEnd) || placeholder;
  const nextValue = `${value.slice(0, selectionStart)}${marker}${selected}${marker}${value.slice(selectionEnd)}`;
  return {
    value: nextValue,
    selectionStart: selectionStart + marker.length,
    selectionEnd: selectionStart + marker.length + selected.length,
  };
}

export function toggleLinePrefix(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: '## ' | '- ' | '> ',
): FormattingTransform {
  const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
  const nextBreak = value.indexOf('\n', selectionEnd);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  const selectedLines = value.slice(lineStart, lineEnd).split('\n');
  const remove = selectedLines.every((line) => line.startsWith(prefix));
  const replacement = selectedLines.map((line) => remove ? line.slice(prefix.length) : `${prefix}${line}`).join('\n');
  const difference = replacement.length - (lineEnd - lineStart);
  return {
    value: `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`,
    selectionStart: lineStart,
    selectionEnd: lineEnd + difference,
  };
}

export function stripLightweightFormatting(value: string): string {
  return value
    .replace(/^\s*(?:##|-|>)\s+/gm, '')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/==([^=\n]+)==/g, '$1')
    .replace(/\s*\n+\s*/g, ' ')
    .trim();
}
