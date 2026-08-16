"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  mapApiFieldErrors,
  mapZodFieldErrors,
} from "@/components/admin-panel/catalog/catalog-form-errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminCategoryFormSchema,
  createAdminCategory,
  patchAdminCategory,
  type AdminCategory,
  type AdminCategoryFormValues,
} from "@/lib/api/admin-catalog";
import { isApiClientError } from "@/lib/api/envelope";

interface AdminCategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: AdminCategory | null;
  onSaved: () => void;
}

const EMPTY: AdminCategoryFormValues = {
  description: "",
  icon: "",
  image: "",
  isActive: true,
  name: "",
  slug: "",
  sortOrder: 0,
};

function toFormValues(category: AdminCategory | null | undefined) {
  if (!category) return EMPTY;
  return {
    description: category.description ?? "",
    icon: category.icon ?? "",
    image: category.image ?? "",
    isActive: category.isActive,
    name: category.name,
    slug: category.categoryId,
    sortOrder: category.sortOrder,
  };
}

export function AdminCategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: AdminCategoryFormDialogProps) {
  const isEdit = Boolean(category);
  const seedKey = `${open ? "open" : "closed"}:${category?.categoryId ?? "new"}`;
  const [seedSnapshot, setSeedSnapshot] = useState(seedKey);
  const [values, setValues] = useState<AdminCategoryFormValues>(() =>
    toFormValues(category),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (seedKey !== seedSnapshot) {
    setSeedSnapshot(seedKey);
    if (open) {
      setValues(toFormValues(category));
      setFieldErrors({});
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const parsed = AdminCategoryFormSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(mapZodFieldErrors(parsed.error.issues));
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && category) {
        await patchAdminCategory(category.categoryId, parsed.data);
        toast.success("دسته به‌روزرسانی شد");
      } else {
        await createAdminCategory(parsed.data);
        toast.success("دسته ایجاد شد");
      }
      onOpenChange(false);
      onSaved();
    } catch (cause) {
      toast.error(
        isApiClientError(cause) ? cause.message : "ذخیره دسته ناموفق بود.",
      );
      setFieldErrors(mapApiFieldErrors(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ویرایش دسته" : "ایجاد دسته"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="category-name">نام</Label>
              <Input
                id="category-name"
                value={values.name}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, name: event.target.value }))
                }
                disabled={submitting}
              />
              {fieldErrors.name ? (
                <p className="text-xs text-destructive">{fieldErrors.name}</p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="category-slug">شناسه (slug)</Label>
              <Input
                id="category-slug"
                value={values.slug}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, slug: event.target.value }))
                }
                disabled={submitting}
                dir="ltr"
                className="font-mono text-xs"
                placeholder="irrigation"
              />
              {fieldErrors.slug ? (
                <p className="text-xs text-destructive">{fieldErrors.slug}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-sort">ترتیب</Label>
              <Input
                id="category-sort"
                type="number"
                value={values.sortOrder}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    sortOrder: Number(event.target.value),
                  }))
                }
                disabled={submitting}
                dir="ltr"
              />
              {fieldErrors.sortOrder ? (
                <p className="text-xs text-destructive">
                  {fieldErrors.sortOrder}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>وضعیت</Label>
              <Select
                value={values.isActive ? "1" : "0"}
                onValueChange={(value) =>
                  setValues((prev) => ({ ...prev, isActive: value === "1" }))
                }
                disabled={submitting}
              >
                <SelectTrigger className="w-full rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">فعال</SelectItem>
                  <SelectItem value="0">غیرفعال</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-icon">آیکون</Label>
              <Input
                id="category-icon"
                value={values.icon ?? ""}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, icon: event.target.value }))
                }
                disabled={submitting}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-image">تصویر (URL)</Label>
              <Input
                id="category-image"
                value={values.image ?? ""}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, image: event.target.value }))
                }
                disabled={submitting}
                dir="ltr"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="category-description">توضیح</Label>
              <Textarea
                id="category-description"
                value={values.description ?? ""}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                disabled={submitting}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
