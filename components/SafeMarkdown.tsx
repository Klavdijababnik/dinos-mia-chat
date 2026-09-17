"use client";

import { Fragment, type ReactNode } from "react";

/**
 * Minimal safe markdown renderer (React children only — no HTML injection).
 * Supports: **bold**, *italic*, soft line breaks, simple ul/ol lists.
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // **bold** first, then *italic*; unpaired markers stay literal
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    if (match[2] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b-${i}`}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i-${i}`}>{match[3]}</em>);
    }
    last = match.index + match[0].length;
    i += 1;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes.length ? nodes : [text];
}

type Block =
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) {
      i += 1;
      continue;
    }

    const ulMatch = line.match(/^\s*[-*•]\s+(.+)$/);
    if (ulMatch) {
      const items: string[] = [ulMatch[1]];
      i += 1;
      while (i < lines.length) {
        const m = lines[i].match(/^\s*[-*•]\s+(.+)$/);
        if (!m) break;
        items.push(m[1]);
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    const olMatch = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (olMatch) {
      const items: string[] = [olMatch[1]];
      i += 1;
      while (i < lines.length) {
        const m = lines[i].match(/^\s*\d+[.)]\s+(.+)$/);
        if (!m) break;
        items.push(m[1]);
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const para: string[] = [line];
    i += 1;
    while (i < lines.length) {
      const next = lines[i];
      if (/^\s*$/.test(next)) break;
      if (/^\s*[-*•]\s+/.test(next) || /^\s*\d+[.)]\s+/.test(next)) break;
      para.push(next);
      i += 1;
    }
    blocks.push({ type: "p", lines: para });
  }

  return blocks;
}

type SafeMarkdownProps = {
  content: string;
  className?: string;
};

export function SafeMarkdown({ content, className }: SafeMarkdownProps) {
  const blocks = parseBlocks(content ?? "");

  if (blocks.length === 0) {
    return <div className={className || "md"} />;
  }

  return (
    <div className={className || "md"}>
      {blocks.map((block, bi) => {
        if (block.type === "ul") {
          return (
            <ul key={`ul-${bi}`} className="md-list">
              {block.items.map((item, ii) => (
                <li key={`uli-${bi}-${ii}`}>{renderInline(item, `ul-${bi}-${ii}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={`ol-${bi}`} className="md-list md-ol">
              {block.items.map((item, ii) => (
                <li key={`oli-${bi}-${ii}`}>{renderInline(item, `ol-${bi}-${ii}`)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={`p-${bi}`}>
            {block.lines.map((line, li) => (
              <Fragment key={`pl-${bi}-${li}`}>
                {li > 0 ? <br /> : null}
                {renderInline(line, `p-${bi}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
