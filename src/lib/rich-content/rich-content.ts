/**
 * Rich-text documents (service intro pages) are stored as Tiptap/ProseMirror
 * JSON, never as HTML. Everything that is saved passes `sanitizeRichDoc`, which
 * keeps only the node types, marks and attributes the app renders; the app then
 * builds React elements from that tree, so no markup string ever reaches the DOM.
 *
 * Pure TypeScript with no editor dependency: shared by the API (validation) and
 * the public renderer.
 */

export type RichTextAlign = "center" | "justify" | "left" | "right";

export type RichMark =
  | { type: "bold" | "highlight" | "italic" | "strike" | "underline" }
  | { attrs: { href: string }; type: "link" };

export interface RichNode {
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  marks?: RichMark[];
  text?: string;
  type: string;
}

export interface RichDoc {
  content: RichNode[];
  type: "doc";
}

export const RICH_DOC_MAX_CHARS = 400_000;
const MAX_NODES = 8_000;
const MAX_DEPTH = 24;
const MAX_TEXT = 20_000;

const TEXT_ALIGNS = new Set<RichTextAlign>(["center", "justify", "left", "right"]);
const SIMPLE_MARKS = new Set(["bold", "highlight", "italic", "strike", "underline"]);

/** Block containers and what may appear inside them. */
const CHILDREN: Record<string, ReadonlySet<string>> = (() => {
  const inline = new Set(["hardBreak", "image", "text"]);
  const blocks = new Set(["blockquote", "bulletList", "heading", "horizontalRule", "image", "orderedList", "paragraph", "table"]);
  return {
    blockquote: blocks,
    bulletList: new Set(["listItem"]),
    doc: blocks,
    heading: inline,
    listItem: blocks,
    orderedList: new Set(["listItem"]),
    paragraph: inline,
    table: new Set(["tableRow"]),
    tableCell: blocks,
    tableHeader: blocks,
    tableRow: new Set(["tableCell", "tableHeader"]),
  };
})();

export class RichDocError extends Error {}

/** `/storage/...` paths and absolute http(s) URLs only. */
export function safeImageSrc(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const src = value.trim();
  if (src.length === 0 || src.length > 1024) return null;
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  try {
    const url = new URL(src);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function safeLinkHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const href = value.trim();
  if (href.length === 0 || href.length > 2048) return null;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const url = new URL(href);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function cleanText(value: string): string {
  // Control characters (except tab/newline) have no business in prose.
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, MAX_TEXT);
}

function cleanAlign(attrs: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  const align = attrs?.textAlign;
  return typeof align === "string" && TEXT_ALIGNS.has(align as RichTextAlign) ? { textAlign: align } : undefined;
}

function cleanSpan(value: unknown): number | undefined {
  const span = Number(value);
  return Number.isInteger(span) && span > 1 && span <= 20 ? span : undefined;
}

function cleanMarks(marks: unknown): RichMark[] | undefined {
  if (!Array.isArray(marks)) return undefined;
  const seen = new Set<string>();
  const out: RichMark[] = [];
  for (const mark of marks) {
    if (!mark || typeof mark !== "object") continue;
    const type = (mark as { type?: unknown }).type;
    if (typeof type !== "string" || seen.has(type)) continue;
    if (SIMPLE_MARKS.has(type)) {
      out.push({ type } as RichMark);
      seen.add(type);
    } else if (type === "link") {
      const href = safeLinkHref((mark as { attrs?: { href?: unknown } }).attrs?.href);
      if (href) {
        out.push({ attrs: { href }, type: "link" });
        seen.add(type);
      }
    }
  }
  return out.length > 0 ? out : undefined;
}

interface Budget {
  nodes: number;
}

function cleanNode(raw: unknown, parent: string, depth: number, budget: Budget): RichNode | null {
  if (!raw || typeof raw !== "object") return null;
  if (depth > MAX_DEPTH) throw new RichDocError("ساختار متن بیش از حد تودرتو است.");
  budget.nodes += 1;
  if (budget.nodes > MAX_NODES) throw new RichDocError("متن بیش از حد طولانی است.");

  const node = raw as RichNode;
  if (typeof node.type !== "string" || !CHILDREN[parent]?.has(node.type)) return null;
  const attrs = node.attrs && typeof node.attrs === "object" ? node.attrs : undefined;

  switch (node.type) {
    case "text": {
      const text = typeof node.text === "string" ? cleanText(node.text) : "";
      if (!text) return null;
      const marks = cleanMarks(node.marks);
      return marks ? { marks, text, type: "text" } : { text, type: "text" };
    }
    case "hardBreak":
    case "horizontalRule":
      return { type: node.type };
    case "image": {
      const src = safeImageSrc(attrs?.src);
      if (!src) return null;
      const alt = typeof attrs?.alt === "string" ? cleanText(attrs.alt).slice(0, 300) : "";
      return { attrs: { alt, src }, type: "image" };
    }
    default:
      break;
  }

  const content: RichNode[] = [];
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      const cleaned = cleanNode(child, node.type, depth + 1, budget);
      if (cleaned) content.push(cleaned);
    }
  }

  const out: RichNode = { type: node.type };
  if (node.type === "paragraph") {
    const align = cleanAlign(attrs);
    if (align) out.attrs = align;
  } else if (node.type === "heading") {
    const level = Number(attrs?.level);
    out.attrs = { level: level === 3 || level === 4 ? level : 2, ...cleanAlign(attrs) };
  } else if (node.type === "orderedList") {
    const start = Number(attrs?.start);
    if (Number.isInteger(start) && start > 1 && start < 10_000) out.attrs = { start };
  } else if (node.type === "tableCell" || node.type === "tableHeader") {
    const colspan = cleanSpan(attrs?.colspan);
    const rowspan = cleanSpan(attrs?.rowspan);
    if (colspan || rowspan) out.attrs = { ...(colspan ? { colspan } : {}), ...(rowspan ? { rowspan } : {}) };
  }

  // Containers that would render as nothing are dropped (lists, tables, rows).
  if (content.length === 0 && !["paragraph", "heading", "tableCell", "tableHeader"].includes(node.type)) return null;
  if (content.length > 0) out.content = content;
  return out;
}

/** True when the document holds no text, image, table or rule. */
export function isRichDocEmpty(doc: RichDoc | null | undefined): boolean {
  if (!doc) return true;
  const visit = (nodes: RichNode[] | undefined): boolean =>
    (nodes ?? []).some(
      (node) =>
        (node.type === "text" && Boolean(node.text?.trim())) ||
        node.type === "image" ||
        node.type === "horizontalRule" ||
        node.type === "table" ||
        visit(node.content),
    );
  return !visit(doc.content);
}

/**
 * Keeps only what the renderer supports. Unknown nodes/marks/attributes are
 * dropped silently; only structural abuse (size, depth) throws. Returns `null`
 * for an empty document.
 */
export function sanitizeRichDoc(raw: unknown): RichDoc | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object" || (raw as { type?: unknown }).type !== "doc") {
    throw new RichDocError("قالب متن معتبر نیست.");
  }
  const budget: Budget = { nodes: 0 };
  const content: RichNode[] = [];
  const children = (raw as { content?: unknown }).content;
  for (const child of Array.isArray(children) ? children : []) {
    const cleaned = cleanNode(child, "doc", 1, budget);
    if (cleaned) content.push(cleaned);
  }
  const doc: RichDoc = { content, type: "doc" };
  return isRichDocEmpty(doc) ? null : doc;
}

/** Parses a stored document; anything unreadable is treated as no document. */
export function parseStoredRichDoc(stored: string | null | undefined): RichDoc | null {
  if (!stored) return null;
  try {
    return sanitizeRichDoc(JSON.parse(stored));
  } catch {
    return null;
  }
}

/** Plain-text summary (for meta descriptions and reading time). */
export function richDocPlainText(doc: RichDoc | null): string {
  if (!doc) return "";
  const parts: string[] = [];
  const visit = (nodes: RichNode[] | undefined) => {
    for (const node of nodes ?? []) {
      if (node.type === "text" && node.text) parts.push(node.text);
      else if (node.content) {
        visit(node.content);
        parts.push(" ");
      }
    }
  };
  visit(doc.content);
  return parts.join("").replace(/\s+/g, " ").trim();
}
