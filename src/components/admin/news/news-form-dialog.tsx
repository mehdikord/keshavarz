"use client";

import { Link2, Star, Upload } from "lucide-react";
import { useState } from "react";

import { type ImageChange, ImageField, NO_IMAGE_CHANGE } from "@/components/admin/catalog/image-field";
import { Button } from "@/components/admin/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";
import { Field, Input, Textarea } from "@/components/admin/ui/input";
import { Switch } from "@/components/admin/ui/switch";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { NewsImage } from "@/components/shared/news-image";
import { adminApi } from "@/lib/admin/api";
import { faNumber } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import type { AdminNewsItem } from "@/server/modules/admin/news/news-admin.service";

export type NewsDialogMode = { kind: "create" } | { item: AdminNewsItem; kind: "edit" };

type ImageSource = "upload" | "url";

const IMAGE_SOURCES = [
  { icon: Upload, key: "upload", label: "آپلود فایل" },
  { icon: Link2, key: "url", label: "آدرس مستقیم" },
] as const;

const TITLE_MAX = 255;

export function NewsFormDialog({
  mode,
  onOpenChange,
}: {
  mode: NewsDialogMode | null;
  onOpenChange: (open: boolean) => void;
}) {
  const editing = mode?.kind === "edit";
  return (
    <Dialog onOpenChange={onOpenChange} open={mode !== null}>
      <DialogContent
        description="متن خبر ذخیره نمی‌شود؛ کاربر با «مشاهده خبر» آن را در سایت منبع می‌خواند."
        // A half-filled form must not be lost to a stray outside click.
        onInteractOutside={(event) => event.preventDefault()}
        size="lg"
        title={editing ? "ویرایش خبر" : "افزودن خبر"}
      >
        {mode ? (
          <NewsForm
            item={mode.kind === "edit" ? mode.item : null}
            key={mode.kind === "edit" ? mode.item.id : "create"}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function NewsForm({ item, onDone }: { item: AdminNewsItem | null; onDone: () => void }) {
  const action = useAdminAction();
  const savedUrl = item && !item.imageUploaded ? item.image : "";
  const savedUpload = item?.imageUploaded ? item.image : null;

  const [title, setTitle] = useState(item?.title ?? "");
  const [link, setLink] = useState(item?.link ?? "");
  const [isImportant, setIsImportant] = useState(item?.isImportant ?? false);
  const [source, setSource] = useState<ImageSource>(savedUrl ? "url" : "upload");
  const [image, setImage] = useState<ImageChange>(NO_IMAGE_CHANGE);
  const [imageUrl, setImageUrl] = useState(savedUrl);
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState<Record<string, string>>({});

  const url = imageUrl.trim();
  const previewUrl = /^https:\/\/[^\s/]+\.\S+$/i.test(url) ? url : null;
  const errors = { ...action.errors, ...missing };
  const imageError = errors.image ?? errors.imageUrl;

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const file = source === "upload" ? image.file : null;
    const required: Record<string, string> = {};
    if (title.trim().length < 3) required.title = "عنوان خبر باید حداقل ۳ حرف باشد.";
    if (!link.trim()) required.link = "لینک خبر را وارد کنید.";
    if (source === "upload" && !file && !savedUpload) required.image = "فایل تصویر یا لوگو را انتخاب کنید.";
    if (source === "url" && !url) required.imageUrl = "آدرس مستقیم تصویر را وارد کنید.";
    setMissing(required);
    if (Object.keys(required).length) {
      action.reset();
      return;
    }

    // An edit sends only what changed, so the audit log shows exactly that.
    const data: Record<string, unknown> = {};
    if (!item || title !== item.title) data.title = title;
    if (!item || link !== item.link) data.link = link;
    if (!item || isImportant !== item.isImportant) data.isImportant = isImportant;
    if (source === "url" && url !== savedUrl) data.imageUrl = url;
    if (item && !file && Object.keys(data).length === 0) {
      onDone();
      return;
    }

    let body: FormData | Record<string, unknown> = data;
    if (file) {
      body = new FormData();
      body.append("data", JSON.stringify(data));
      body.append("image", file);
    }
    const saved = await action.run(
      () => (item ? adminApi.patch(`/news/${item.id}`, body) : adminApi.post("/news", body)),
      item ? "خبر ویرایش شد." : "خبر اضافه شد.",
    );
    if (saved) onDone();
  }

  return (
    <form noValidate onSubmit={(event) => void submit(event)}>
      <DialogBody>
        <Field
          error={errors.title}
          hint={`${faNumber(title.length)} از ${faNumber(TITLE_MAX)} نویسه`}
          htmlFor="news-title"
          label="عنوان خبر"
        >
          <Textarea
            aria-invalid={Boolean(errors.title)}
            autoFocus
            className="min-h-16"
            id="news-title"
            maxLength={TITLE_MAX}
            onChange={(event) => setTitle(event.target.value)}
            // A title is one line; Enter saves like in any other text field.
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="تیتر خبر، همان‌طور که در سایت منبع آمده"
            rows={2}
            value={title}
          />
        </Field>

        <Field error={errors.link} hint="نشانی صفحه خود خبر در سایت منبع." htmlFor="news-link" label="لینک خبر">
          <Input
            aria-invalid={Boolean(errors.link)}
            autoComplete="off"
            className="text-left"
            dir="ltr"
            id="news-link"
            inputMode="url"
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://example.com/news/123"
            value={link}
          />
        </Field>

        <fieldset className="grid gap-2.5">
          <legend className="mb-1.5 text-[12.5px] font-semibold text-foreground/85">تصویر یا لوگو</legend>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {IMAGE_SOURCES.map(({ icon: Icon, key, label }) => (
              <button
                aria-pressed={source === key}
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-2 rounded-lg text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  source === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
                key={key}
                onClick={() => {
                  if (key === source) return;
                  setSource(key);
                  // The file field forgets its preview when hidden, so forget the file too.
                  setImage(NO_IMAGE_CHANGE);
                  setMissing({});
                  action.reset();
                }}
                type="button"
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          {source === "upload" ? (
            <ImageField
              current={savedUpload}
              error={imageError}
              hint="JPEG، PNG یا WebP تا ۵ مگابایت. لوگوی سایت منبع هم مناسب است."
              label="فایل تصویر"
              onChange={setImage}
              required
              value={image}
            />
          ) : (
            <div className="flex items-start gap-3">
              <NewsImage
                className="size-24 rounded-xl border border-line bg-card text-muted-foreground"
                onFail={() => setBrokenUrl(previewUrl)}
                src={previewUrl}
              />
              <div className="min-w-0 flex-1">
                <Field
                  error={imageError}
                  hint="آدرس خود فایل تصویر، با https."
                  htmlFor="news-image-url"
                  label="آدرس تصویر"
                >
                  <Input
                    aria-invalid={Boolean(imageError)}
                    autoComplete="off"
                    className="text-left"
                    dir="ltr"
                    id="news-image-url"
                    inputMode="url"
                    onChange={(event) => setImageUrl(event.target.value)}
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                  />
                </Field>
                {previewUrl && brokenUrl === previewUrl ? (
                  <p className="mt-1.5 text-xs leading-5 text-warn" role="status">
                    این آدرس تصویری نشان نمی‌دهد. شاید نشانی صفحه باشد یا سایت اجازه نمایش ندهد؛ بهتر است تصویر را آپلود کنید.
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </fieldset>

        <div
          className={cn(
            "flex items-start justify-between gap-4 rounded-xl border border-line px-4 py-3 transition-colors",
            isImportant && "border-wheat/50 bg-wheat-soft",
          )}
        >
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold" htmlFor="news-important">
              <Star className={cn("size-4 text-muted-foreground", isImportant && "fill-current text-wheat-ink")} />
              خبر مهم
            </label>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              در اپلیکیشن با نشان «مهم» برجسته می‌شود؛ ترتیب خبرها تغییر نمی‌کند.
            </p>
          </div>
          <Switch
            checked={isImportant}
            className={cn("mt-0.5", isImportant && "bg-wheat")}
            id="news-important"
            onCheckedChange={setIsImportant}
          />
        </div>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onDone} type="button" variant="ghost">
          انصراف
        </Button>
        <Button loading={action.pending} type="submit">
          {item ? "ذخیره تغییرات" : "افزودن خبر"}
        </Button>
      </DialogFooter>
    </form>
  );
}
