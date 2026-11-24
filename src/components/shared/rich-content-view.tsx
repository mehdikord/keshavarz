import "@/styles/rich-prose.css";

import { Fragment, type ReactNode } from "react";

import {
  type RichDoc,
  type RichMark,
  type RichNode,
  safeImageSrc,
  safeLinkHref,
} from "@/lib/rich-content/rich-content";
import { cn } from "@/lib/utils";

type Align = "center" | "justify" | "left" | "right";

function alignStyle(node: RichNode): React.CSSProperties | undefined {
  const align = node.attrs?.textAlign;
  return align === "center" || align === "justify" || align === "left" || align === "right"
    ? { textAlign: align as Align }
    : undefined;
}

function wrapMarks(text: ReactNode, marks: RichMark[] | undefined, key: string): ReactNode {
  let out = text;
  for (const [index, mark] of (marks ?? []).entries()) {
    const markKey = `${key}-m${index}`;
    switch (mark.type) {
      case "bold":
        out = <strong key={markKey}>{out}</strong>;
        break;
      case "italic":
        out = <em key={markKey}>{out}</em>;
        break;
      case "underline":
        out = <u key={markKey}>{out}</u>;
        break;
      case "strike":
        out = <s key={markKey}>{out}</s>;
        break;
      case "highlight":
        out = <mark key={markKey}>{out}</mark>;
        break;
      case "link": {
        // Re-checked at render: the stored document is trusted only as far as the sanitizer.
        const href = safeLinkHref(mark.attrs.href);
        if (!href) break;
        const external = !href.startsWith("/");
        out = (
          <a
            href={href}
            key={markKey}
            {...(external ? { rel: "noopener noreferrer nofollow", target: "_blank" } : {})}
          >
            {out}
          </a>
        );
        break;
      }
      default:
        break;
    }
  }
  return out;
}

function renderChildren(nodes: RichNode[] | undefined, key: string): ReactNode {
  return (nodes ?? []).map((child, index) => renderNode(child, `${key}.${index}`));
}

function cellSpan(value: unknown): number | undefined {
  const span = Number(value);
  return Number.isInteger(span) && span > 1 && span <= 20 ? span : undefined;
}

function renderNode(node: RichNode, key: string): ReactNode {
  switch (node.type) {
    case "text":
      return <Fragment key={key}>{wrapMarks(node.text ?? "", node.marks, key)}</Fragment>;
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} />;
    case "paragraph":
      return (
        <p key={key} style={alignStyle(node)}>
          {renderChildren(node.content, key)}
        </p>
      );
    case "heading": {
      const level = node.attrs?.level === 3 ? "h3" : node.attrs?.level === 4 ? "h4" : "h2";
      const Tag = level;
      return (
        <Tag key={key} style={alignStyle(node)}>
          {renderChildren(node.content, key)}
        </Tag>
      );
    }
    case "bulletList":
      return <ul key={key}>{renderChildren(node.content, key)}</ul>;
    case "orderedList": {
      const start = Number(node.attrs?.start);
      return (
        <ol key={key} start={Number.isInteger(start) && start > 1 ? start : undefined}>
          {renderChildren(node.content, key)}
        </ol>
      );
    }
    case "listItem":
      return <li key={key}>{renderChildren(node.content, key)}</li>;
    case "blockquote":
      return <blockquote key={key}>{renderChildren(node.content, key)}</blockquote>;
    case "image": {
      const src = safeImageSrc(node.attrs?.src);
      if (!src) return null;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      return (
        // eslint-disable-next-line @next/next/no-img-element -- admin uploads served from /storage or the object gateway
        <img alt={alt} decoding="async" key={key} loading="lazy" src={src} />
      );
    }
    case "table": {
      const rows = node.content ?? [];
      const headRows: RichNode[] = [];
      let index = 0;
      // Leading rows made only of header cells become the <thead>.
      while (index < rows.length && (rows[index]?.content ?? []).every((cell) => cell.type === "tableHeader")) {
        headRows.push(rows[index]!);
        index += 1;
      }
      const bodyRows = rows.slice(index);
      return (
        <div className="rp-table" key={key} role="region" aria-label="جدول" tabIndex={0}>
          <table>
            {headRows.length > 0 ? <thead>{headRows.map((row, i) => renderNode(row, `${key}.h${i}`))}</thead> : null}
            {bodyRows.length > 0 ? <tbody>{bodyRows.map((row, i) => renderNode(row, `${key}.b${i}`))}</tbody> : null}
          </table>
        </div>
      );
    }
    case "tableRow":
      return <tr key={key}>{renderChildren(node.content, key)}</tr>;
    case "tableHeader":
    case "tableCell": {
      const Cell = node.type === "tableHeader" ? "th" : "td";
      return (
        <Cell colSpan={cellSpan(node.attrs?.colspan)} key={key} rowSpan={cellSpan(node.attrs?.rowspan)}>
          {renderChildren(node.content, key)}
        </Cell>
      );
    }
    default:
      return null;
  }
}

/** Renders a sanitized rich document as plain React elements (no HTML strings). */
export function RichContentView({ className, doc }: { className?: string; doc: RichDoc }) {
  return <div className={cn("rich-prose", className)}>{renderChildren(doc.content, "n")}</div>;
}
