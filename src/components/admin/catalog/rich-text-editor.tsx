"use client";

import "@/styles/rich-prose.css";

import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { type Editor, EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Columns3,
  Eraser,
  Heading2,
  Heading3,
  Heading4,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Minus,
  Quote,
  Redo2,
  Rows3,
  Strikethrough,
  Table2,
  TableCellsMerge,
  TableCellsSplit,
  Trash2,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { adminApi, errorMessage } from "@/lib/admin/api";
import { faNumber } from "@/lib/admin/format";
import type { RichDoc } from "@/lib/rich-content/rich-content";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function uploadContentImage(file: File): Promise<string | null> {
  if (!IMAGE_TYPES.includes(file.type)) {
    toast.error("تصویر باید JPEG، PNG یا WebP باشد.");
    return null;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    toast.error("حجم تصویر باید حداکثر ۵ مگابایت باشد.");
    return null;
  }
  try {
    return (await adminApi.upload<{ url: string }>("/catalog/content-images", file)).url;
  } catch (error) {
    toast.error(`بارگذاری تصویر ناموفق بود: ${errorMessage(error)}`);
    return null;
  }
}

function altFromFile(file: File): string {
  return file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").slice(0, 120);
}

/**
 * Rich-text editor for the service intro page: headings, marks, lists, quotes,
 * alignment, tables, links and inline pictures (uploaded to storage, pasted or
 * dropped). Emits Tiptap JSON; the server sanitizes it again before saving.
 */
export function RichTextEditor({
  id,
  initialContent,
  invalid,
  onChange,
  placeholder,
}: {
  id?: string;
  initialContent: RichDoc | null;
  invalid?: boolean;
  onChange: (doc: RichDoc, isEmpty: boolean) => void;
  placeholder?: string;
}) {
  const [uploads, setUploads] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Keep an upload-capable insert available to the paste/drop handlers below.
  const insertFilesRef = useRef<(files: File[], at?: number) => void>(() => {});

  const editor = useEditor({
    content: initialContent ?? "",
    editorProps: {
      attributes: {
        "aria-label": "متن صفحه معرفی خدمت",
        "aria-multiline": "true",
        class: "rich-prose",
        dir: "rtl",
        ...(id ? { id } : {}),
        role: "textbox",
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type.startsWith("image/"));
        if (moved || files.length === 0) return false;
        event.preventDefault();
        const position = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        insertFilesRef.current(files, position);
        return true;
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        insertFilesRef.current(files);
        return true;
      },
    },
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        heading: { levels: [2, 3, 4] },
        link: {
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
          openOnClick: false,
          protocols: ["http", "https", "mailto", "tel"],
        },
      }),
      Highlight,
      Image.configure({ allowBase64: false, inline: false }),
      TableKit.configure({ table: { resizable: false } }),
      TextAlign.configure({ alignments: ["right", "center", "left", "justify"], types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      CharacterCount,
    ],
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => {
      onChangeRef.current(current.getJSON() as RichDoc, current.isEmpty);
    },
  });

  useEffect(() => {
    insertFilesRef.current = (files, at) => {
      if (!editor) return;
      for (const file of files.slice(0, 10)) {
        setUploads((count) => count + 1);
        void uploadContentImage(file)
          .then((url) => {
            if (!url || editor.isDestroyed) return;
            const chain = editor.chain().focus();
            (at !== undefined ? chain.insertContentAt(at, { attrs: { alt: altFromFile(file), src: url }, type: "image" }) : chain.setImage({ alt: altFromFile(file), src: url })).run();
          })
          .finally(() => setUploads((count) => count - 1));
      }
    };
  }, [editor]);

  // Esc leaves the focused full-size mode before the dialog sees it.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [expanded]);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-input bg-background transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/15",
        invalid && "border-danger ring-danger/15",
        expanded ? "fixed inset-0 z-30 rounded-none border-0" : "relative",
      )}
    >
      {editor ? (
        <Toolbar
          editor={editor}
          expanded={expanded}
          onInsertImages={(files) => insertFilesRef.current(files)}
          onToggleExpanded={() => setExpanded((value) => !value)}
          uploading={uploads > 0}
        />
      ) : (
        <div className="h-[46px] border-b border-line bg-raised" />
      )}
      <div
        className={cn(
          "admin-scroll min-h-0 cursor-text overflow-y-auto px-4 py-4 sm:px-6",
          expanded ? "flex-1" : "h-[min(52vh,460px)] min-h-[260px] resize-y",
        )}
        onClick={() => editor?.commands.focus()}
      >
        <div className={cn("mx-auto h-full", expanded && "max-w-3xl py-4")}>
          <EditorContent className="h-full" editor={editor} />
        </div>
      </div>
      {editor ? <StatusBar editor={editor} uploading={uploads} /> : null}
    </div>
  );
}

// ------------------------------------------------------------------- toolbar

function ToolButton({
  active,
  children,
  disabled,
  label,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-[17px]",
        active && "bg-primary/12 text-primary hover:bg-primary/16 hover:text-primary",
      )}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line" />;
}

function Toolbar({
  editor,
  expanded,
  onInsertImages,
  onToggleExpanded,
  uploading,
}: {
  editor: Editor;
  expanded: boolean;
  onInsertImages: (files: File[]) => void;
  onToggleExpanded: () => void;
  uploading: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      align: (["right", "center", "left", "justify"] as const).find((align) => current.isActive({ textAlign: align })),
      blockquote: current.isActive("blockquote"),
      bold: current.isActive("bold"),
      bulletList: current.isActive("bulletList"),
      canMerge: current.can().mergeCells(),
      canRedo: current.can().redo(),
      canSplit: current.can().splitCell(),
      canUndo: current.can().undo(),
      h2: current.isActive("heading", { level: 2 }),
      h3: current.isActive("heading", { level: 3 }),
      h4: current.isActive("heading", { level: 4 }),
      highlight: current.isActive("highlight"),
      inTable: current.isActive("table"),
      italic: current.isActive("italic"),
      link: current.isActive("link"),
      orderedList: current.isActive("orderedList"),
      strike: current.isActive("strike"),
      underline: current.isActive("underline"),
    }),
  });

  const run = (fn: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => fn(editor.chain().focus()).run();

  return (
    <div className="sticky top-0 z-10 border-b border-line bg-raised/95 backdrop-blur">
      <div className="admin-scroll flex items-center gap-0.5 overflow-x-auto px-2 py-1.5" role="toolbar" aria-label="ابزار ویرایش متن">
        <ToolButton disabled={!state.canUndo} label="واگرد" onClick={() => run((c) => c.undo())}>
          <Undo2 />
        </ToolButton>
        <ToolButton disabled={!state.canRedo} label="انجام دوباره" onClick={() => run((c) => c.redo())}>
          <Redo2 />
        </ToolButton>
        <Divider />
        <ToolButton active={state.h2} label="سرتیتر بزرگ" onClick={() => run((c) => c.toggleHeading({ level: 2 }))}>
          <Heading2 />
        </ToolButton>
        <ToolButton active={state.h3} label="سرتیتر متوسط" onClick={() => run((c) => c.toggleHeading({ level: 3 }))}>
          <Heading3 />
        </ToolButton>
        <ToolButton active={state.h4} label="سرتیتر کوچک" onClick={() => run((c) => c.toggleHeading({ level: 4 }))}>
          <Heading4 />
        </ToolButton>
        <Divider />
        <ToolButton active={state.bold} label="ضخیم (Ctrl+B)" onClick={() => run((c) => c.toggleBold())}>
          <Bold />
        </ToolButton>
        <ToolButton active={state.italic} label="مورب (Ctrl+I)" onClick={() => run((c) => c.toggleItalic())}>
          <Italic />
        </ToolButton>
        <ToolButton active={state.underline} label="زیرخط (Ctrl+U)" onClick={() => run((c) => c.toggleUnderline())}>
          <Underline />
        </ToolButton>
        <ToolButton active={state.strike} label="خط‌خورده" onClick={() => run((c) => c.toggleStrike())}>
          <Strikethrough />
        </ToolButton>
        <ToolButton active={state.highlight} label="برجسته‌سازی" onClick={() => run((c) => c.toggleHighlight())}>
          <Highlighter />
        </ToolButton>
        <ToolButton active={state.link || linkOpen} label="پیوند" onClick={() => setLinkOpen((open) => !open)}>
          <Link2 />
        </ToolButton>
        <Divider />
        <ToolButton active={state.bulletList} label="فهرست نقطه‌ای" onClick={() => run((c) => c.toggleBulletList())}>
          <List />
        </ToolButton>
        <ToolButton active={state.orderedList} label="فهرست شماره‌دار" onClick={() => run((c) => c.toggleOrderedList())}>
          <ListOrdered />
        </ToolButton>
        <ToolButton active={state.blockquote} label="نقل‌قول / نکته" onClick={() => run((c) => c.toggleBlockquote())}>
          <Quote />
        </ToolButton>
        <ToolButton label="خط جداکننده" onClick={() => run((c) => c.setHorizontalRule())}>
          <Minus />
        </ToolButton>
        <Divider />
        <ToolButton active={state.align === "right"} label="راست‌چین" onClick={() => run((c) => c.setTextAlign("right"))}>
          <AlignRight />
        </ToolButton>
        <ToolButton active={state.align === "center"} label="وسط‌چین" onClick={() => run((c) => c.setTextAlign("center"))}>
          <AlignCenter />
        </ToolButton>
        <ToolButton active={state.align === "left"} label="چپ‌چین" onClick={() => run((c) => c.setTextAlign("left"))}>
          <AlignLeft />
        </ToolButton>
        <ToolButton active={state.align === "justify"} label="هم‌تراز" onClick={() => run((c) => c.setTextAlign("justify"))}>
          <AlignJustify />
        </ToolButton>
        <Divider />
        <ToolButton disabled={uploading} label="درج تصویر" onClick={() => fileInput.current?.click()}>
          {uploading ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
        </ToolButton>
        <ToolButton
          active={state.inTable}
          label="درج جدول"
          onClick={() => run((c) => c.insertTable({ cols: 3, rows: 3, withHeaderRow: true }))}
        >
          <Table2 />
        </ToolButton>
        <ToolButton label="پاک کردن قالب‌بندی" onClick={() => run((c) => c.unsetAllMarks().clearNodes())}>
          <Eraser />
        </ToolButton>
        <span className="flex-1" />
        <ToolButton label={expanded ? "خروج از حالت تمام‌صفحه" : "تمام‌صفحه"} onClick={onToggleExpanded}>
          {expanded ? <Minimize2 /> : <Maximize2 />}
        </ToolButton>
        <input
          accept={IMAGE_TYPES.join(",")}
          className="hidden"
          multiple
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length > 0) onInsertImages(files);
          }}
          ref={fileInput}
          type="file"
        />
      </div>

      {linkOpen ? <LinkBar editor={editor} onClose={() => setLinkOpen(false)} /> : null}

      {state.inTable ? (
        <div className="admin-scroll flex items-center gap-1 overflow-x-auto border-t border-line px-2 py-1.5 text-[12px]">
          <span className="ml-1 shrink-0 font-semibold text-muted-foreground">جدول:</span>
          <TableAction icon={<Rows3 />} label="ردیف بعد" onClick={() => run((c) => c.addRowAfter())} />
          <TableAction icon={<Columns3 />} label="ستون بعد" onClick={() => run((c) => c.addColumnAfter())} />
          <TableAction icon={<Rows3 />} label="حذف ردیف" onClick={() => run((c) => c.deleteRow())} tone="danger" />
          <TableAction icon={<Columns3 />} label="حذف ستون" onClick={() => run((c) => c.deleteColumn())} tone="danger" />
          <TableAction icon={<Table2 />} label="ردیف عنوان" onClick={() => run((c) => c.toggleHeaderRow())} />
          {state.canMerge ? (
            <TableAction icon={<TableCellsMerge />} label="ادغام خانه‌ها" onClick={() => run((c) => c.mergeCells())} />
          ) : null}
          {state.canSplit ? (
            <TableAction icon={<TableCellsSplit />} label="جدا کردن خانه" onClick={() => run((c) => c.splitCell())} />
          ) : null}
          <span className="flex-1" />
          <TableAction icon={<Trash2 />} label="حذف جدول" onClick={() => run((c) => c.deleteTable())} tone="danger" />
        </div>
      ) : null}
    </div>
  );
}

function TableAction({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: "danger";
}) {
  return (
    <button
      className={cn(
        "flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 font-medium text-foreground/80 transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5",
        tone === "danger" && "text-danger hover:bg-danger-soft",
      )}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function LinkBar({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const current = editor.getAttributes("link").href as string | undefined;
  const [href, setHref] = useState(current ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function apply() {
    const value = href.trim();
    if (!value) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const normalized = /^(https?:|mailto:|tel:|\/)/i.test(value) ? value : `https://${value}`;
      if (editor.state.selection.empty && !editor.isActive("link")) {
        editor.chain().focus().insertContent({ marks: [{ attrs: { href: normalized }, type: "link" }], text: value, type: "text" }).run();
      } else {
        editor.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
      }
    }
    onClose();
  }

  return (
    <div className="flex items-center gap-2 border-t border-line px-3 py-2">
      <Link2 className="size-4 shrink-0 text-muted-foreground" />
      <input
        className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-left text-[12.5px] outline-none focus-visible:border-ring"
        dir="ltr"
        onChange={(event) => setHref(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            apply();
          } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }
        }}
        placeholder="https://example.com"
        ref={inputRef}
        value={href}
      />
      <ToolButton label="اعمال پیوند" onClick={apply}>
        <Check />
      </ToolButton>
      {current ? (
        <ToolButton
          label="حذف پیوند"
          onClick={() => {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            onClose();
          }}
        >
          <Link2Off />
        </ToolButton>
      ) : null}
      <ToolButton label="بستن" onClick={onClose}>
        <X />
      </ToolButton>
    </div>
  );
}

function StatusBar({ editor, uploading }: { editor: Editor; uploading: number }) {
  const { characters, words } = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      characters: current.storage.characterCount.characters() as number,
      words: current.storage.characterCount.words() as number,
    }),
  });
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line bg-raised px-3 py-1.5 text-[11.5px] text-muted-foreground">
      <span>
        {uploading > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-primary">
            <LoaderCircle className="size-3.5 animate-spin" />
            در حال بارگذاری {faNumber(uploading)} تصویر…
          </span>
        ) : (
          "تصویر را می‌توانید مستقیم در متن بکشید یا بچسبانید."
        )}
      </span>
      <span className="shrink-0 tabular-nums">
        {faNumber(words)} کلمه · {faNumber(characters)} نویسه
      </span>
    </div>
  );
}
