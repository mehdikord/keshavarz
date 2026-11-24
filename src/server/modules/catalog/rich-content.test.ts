import { describe, expect, it } from "vitest";

import { isRichDocEmpty, RichDocError, richDocPlainText, sanitizeRichDoc } from "@/lib/rich-content/rich-content";

const text = (value: string, marks?: unknown[]) => ({ marks, text: value, type: "text" });
const paragraph = (...content: unknown[]) => ({ content, type: "paragraph" });

describe("sanitizeRichDoc", () => {
  it("keeps supported structure: headings, marks, lists, tables, images", () => {
    const doc = sanitizeRichDoc({
      content: [
        { attrs: { level: 3, textAlign: "center" }, content: [text("مشخصات")], type: "heading" },
        paragraph(text("ضخیم", [{ type: "bold" }, { type: "highlight", attrs: { color: "red" } }])),
        { content: [{ content: [paragraph(text("یک"))], type: "listItem" }], type: "bulletList" },
        {
          content: [
            { content: [{ attrs: { colspan: 2, colwidth: [100] }, content: [paragraph(text("عنوان"))], type: "tableHeader" }], type: "tableRow" },
          ],
          type: "table",
        },
        { attrs: { alt: "دستگاه", src: "/storage/catalog/content/content-a.png", title: "x" }, type: "image" },
      ],
      type: "doc",
    });
    expect(doc?.content.map((node) => node.type)).toEqual(["heading", "paragraph", "bulletList", "table", "image"]);
    expect(doc?.content[0]?.attrs).toEqual({ level: 3, textAlign: "center" });
    expect(doc?.content[1]?.content?.[0]?.marks).toEqual([{ type: "bold" }, { type: "highlight" }]);
    expect(doc?.content[3]?.content?.[0]?.content?.[0]?.attrs).toEqual({ colspan: 2 });
    expect(doc?.content[4]?.attrs).toEqual({ alt: "دستگاه", src: "/storage/catalog/content/content-a.png" });
  });

  it("drops unsafe links, image sources, unknown nodes and attributes", () => {
    const doc = sanitizeRichDoc({
      content: [
        paragraph(
          text("بد", [{ attrs: { href: "javascript:alert(1)" }, type: "link" }]),
          text("خوب", [{ attrs: { href: "https://example.com", onclick: "x" }, type: "link" }]),
        ),
        { attrs: { src: "data:image/png;base64,AAA" }, type: "image" },
        { attrs: { src: "//evil.example/x.png" }, type: "image" },
        { content: [text("<script>")], type: "codeBlock" },
        { attrs: { class: "x", style: "color:red" }, content: [text("p")], type: "paragraph" },
      ],
      type: "doc",
    });
    expect(doc?.content).toHaveLength(2);
    expect(doc?.content[0]?.content?.[0]?.marks).toBeUndefined();
    expect(doc?.content[0]?.content?.[1]?.marks).toEqual([{ attrs: { href: "https://example.com/" }, type: "link" }]);
    expect(doc?.content[1]).toEqual({ content: [{ text: "p", type: "text" }], type: "paragraph" });
  });

  it("returns null for empty documents and rejects non-documents", () => {
    expect(sanitizeRichDoc(null)).toBeNull();
    expect(sanitizeRichDoc({ content: [paragraph(), paragraph(text("   "))], type: "doc" })).toBeNull();
    expect(() => sanitizeRichDoc("<p>x</p>")).toThrow(RichDocError);
    expect(() => sanitizeRichDoc({ type: "paragraph" })).toThrow(RichDocError);
  });

  it("refuses absurdly deep documents", () => {
    let node: Record<string, unknown> = paragraph(text("x"));
    for (let depth = 0; depth < 40; depth += 1) node = { content: [node], type: "blockquote" };
    expect(() => sanitizeRichDoc({ content: [node], type: "doc" })).toThrow(RichDocError);
  });

  it("summarises to plain text", () => {
    const doc = sanitizeRichDoc({ content: [paragraph(text("کاشت")), paragraph(text("گندم"))], type: "doc" });
    expect(isRichDocEmpty(doc)).toBe(false);
    expect(richDocPlainText(doc)).toBe("کاشت گندم");
  });
});
