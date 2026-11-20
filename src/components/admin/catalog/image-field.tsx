"use client";

import { ImagePlus, RotateCcw, Trash2, Upload } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/admin/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/** What the form should do with the image on save. */
export interface ImageChange {
  file: File | null;
  remove: boolean;
}

export const NO_IMAGE_CHANGE: ImageChange = { file: null, remove: false };

/** Keeps digits only, turning Persian digits into Latin ones (for numeric inputs). */
export const toLatinDigits = (value: string) =>
  value.replace(/[^\d۰-۹]/g, "").replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));

export function ImageField({
  current,
  error,
  hint,
  label,
  onChange,
  value,
}: {
  current: string | null;
  error?: string;
  hint: string;
  label: string;
  onChange: (change: ImageChange) => void;
  value: ImageChange;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const previewRef = useRef<string | null>(null);

  // The blob URL lives as long as its file is picked; release it on change and unmount.
  function setPreviewFor(file: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = file ? URL.createObjectURL(file) : null;
    setPreview(previewRef.current);
  }

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  function change(next: ImageChange) {
    setPreviewFor(next.file);
    onChange(next);
  }

  function pick(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setLocalError("فقط تصویر JPEG، PNG یا WebP پذیرفته می‌شود.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError("حجم تصویر باید حداکثر ۵ مگابایت باشد.");
      return;
    }
    setLocalError(null);
    change({ file, remove: false });
  }

  const shown = preview ?? (value.remove ? null : current);
  const message = localError ?? error;

  return (
    <div className="grid gap-1.5">
      <label className="text-[12.5px] font-semibold text-foreground/85" htmlFor={inputId}>
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-4 rounded-xl border border-dashed border-input bg-raised p-3 transition-colors",
          dragging && "border-ring bg-wheat-soft/60",
          message && "border-danger",
        )}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          pick(event.dataTransfer.files[0]);
        }}
      >
        <button
          aria-label={shown ? "تغییر تصویر" : "انتخاب تصویر"}
          className="group relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-card text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob preview or stored upload
            <img alt="" className="size-full object-cover" src={shown} />
          ) : (
            <ImagePlus className="size-7" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-soil/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Upload className="size-5" />
          </span>
        </button>
        <div className="grid min-w-0 gap-2">
          <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
          <div className="flex flex-wrap gap-1.5">
            <Button onClick={() => inputRef.current?.click()} size="sm" type="button" variant="outline">
              <Upload />
              {shown ? "تغییر تصویر" : "انتخاب تصویر"}
            </Button>
            {value.file || value.remove ? (
              <Button
                onClick={() => {
                  setLocalError(null);
                  change(NO_IMAGE_CHANGE);
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                <RotateCcw />
                بازگرداندن
              </Button>
            ) : null}
            {shown && !value.file ? (
              <Button onClick={() => change({ file: null, remove: true })} size="sm" type="button" variant="danger-soft">
                <Trash2 />
                حذف تصویر
              </Button>
            ) : null}
          </div>
          {value.file ? (
            <p className="truncate text-[11.5px] text-muted-foreground" dir="ltr">
              {value.file.name}
            </p>
          ) : value.remove ? (
            <p className="text-[11.5px] text-danger">تصویر فعلی پس از ذخیره حذف می‌شود.</p>
          ) : null}
        </div>
        <input
          accept={ACCEPTED.join(",")}
          className="sr-only"
          id={inputId}
          onChange={(event) => {
            pick(event.target.files?.[0]);
            event.target.value = "";
          }}
          ref={inputRef}
          tabIndex={-1}
          type="file"
        />
      </div>
      {message ? (
        <p className="text-xs text-danger" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
