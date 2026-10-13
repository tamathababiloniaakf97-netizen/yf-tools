import { Fragment, type ReactNode } from 'react';
import { parseLightweightText, type InlineToken } from '@/lib/lightweight-formatting';

interface LightweightFormattedTextProps {
  value?: string | null;
  className?: string;
}

function renderInline(tokens: InlineToken[], keyPrefix: string): ReactNode[] {
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if (token.type === 'boldEmphasis') return <strong className="lightweight-formatted-emphasis" key={key}>{token.value}</strong>;
    if (token.type === 'bold') return <strong key={key}>{token.value}</strong>;
    if (token.type === 'emphasis') return <span className="lightweight-formatted-emphasis" key={key}>{token.value}</span>;
    return <Fragment key={key}>{token.value}</Fragment>;
  });
}

function renderLines(lines: InlineToken[][], keyPrefix: string) {
  return lines.map((line, index) => <Fragment key={`${keyPrefix}-${index}`}>
    {index > 0 && <br />}
    {renderInline(line, `${keyPrefix}-${index}`)}
  </Fragment>);
}

export default function LightweightFormattedText({ value = '', className = '' }: LightweightFormattedTextProps) {
  return <div className={`lightweight-formatted-text ${className}`.trim()}>
    {parseLightweightText(value ?? '').map((block, index) => {
      const key = `block-${index}`;
      if (block.type === 'heading') return <h3 className="lightweight-formatted-heading" key={key}>{renderInline(block.content, key)}</h3>;
      if (block.type === 'list') return <ul className="lightweight-formatted-list" key={key}>{block.items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>)}</ul>;
      if (block.type === 'quote') return <blockquote className="lightweight-formatted-quote" key={key}>{renderLines(block.lines, key)}</blockquote>;
      return <p key={key}>{renderLines(block.lines, key)}</p>;
    })}
  </div>;
}
