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
  AdminServiceFormSchema,
  createAdminService,
  patchAdminService,
  type AdminCategory,
  type AdminService,
  type AdminServiceFormValues,
} from "@/lib/api/admin-catalog";
import { isApiClientError } from "@/lib/api/envelope";

interface AdminServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: AdminService | null;
  categories: AdminCategory[];
  defaultCategoryId?: string | null;
  onSaved: () => void;
}

function emptyValues(defaultCategoryId?: string | null): AdminServiceFormValues {
  return {
    categoryId: defaultCategoryId ?? "",
    description: "",
    image: "",
    isActive: true,
    name: "",
    slug: "",
    sortOrder: 0,
  };
}

function toFormValues(
  service: AdminService | null | undefined,
  defaultCategoryId?: string | null,
): AdminServiceFormValues {
  if (!service) return emptyValues(defaultCategoryId);
  return {
    categoryId: service.category.categoryId,
    description: service.description ?? "",
    image: service.image ?? "",
    isActive: service.isActive,
    name: service.name,
    slug: service.serviceId,
    sortOrder: service.sortOrder,
  };
}

export function AdminServiceFormDialog({
  open,
  onOpenChange,
  service,
  categories,
  defaultCategoryId,
  onSaved,
}: AdminServiceFormDialogProps) {
  const isEdit = Boolean(service);
  const seedKey = `${open ? "open" : "closed"}:${service?.serviceId ?? "new"}:${defaultCategoryId ?? ""}`;
  const [seedSnapshot, setSeedSnapshot] = useState(seedKey);
  const [values, setValues] = useState<AdminServiceFormValues>(() =>
    toFormValues(service, defaultCategoryId),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (seedKey !== seedSnapshot) {
    setSeedSnapshot(seedKey);
    if (open) {
      setValues(toFormValues(service, defaultCategoryId));
      setFieldErrors({});
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const parsed = AdminServiceFormSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(mapZodFieldErrors(parsed.error.issues));
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && service) {
        await patchAdminService(service.serviceId, parsed.data);
        toast.success("خدمت به‌روزرسانی شد");
      } else {
        await createAdminService(parsed.data);
        toast.success("خدمت ایجاد شد");
      }
      onOpenChange(false);
      onSaved();
    } catch (cause) {
      toast.error(
        isApiClientError(cause) ? cause.message : "ذخیره خدمت ناموفق بود.",
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
          <DialogTitle>{isEdit ? "ویرایش خدمت" : "ایجاد خدمت"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>دسته</Label>
              <Select
                value={values.categoryId || undefined}
                onValueChange={(value) =>
                  setValues((prev) => ({ ...prev, categoryId: value }))
                }
                disabled={submitting}
              >
                <SelectTrigger className="w-full rounded-lg">
                  <SelectValue placeholder="انتخاب دسته" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item.categoryId} value={item.categoryId}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.categoryId ? (
                <p className="text-xs text-destructive">
                  {fieldErrors.categoryId}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="service-name">نام</Label>
              <Input
                id="service-name"
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
              <Label htmlFor="service-slug">شناسه (slug)</Label>
              <Input
                id="service-slug"
                value={values.slug}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, slug: event.target.value }))
                }
                disabled={submitting}
                dir="ltr"
                className="font-mono text-xs"
                placeholder="drip-irrigation"
              />
              {fieldErrors.slug ? (
                <p className="text-xs text-destructive">{fieldErrors.slug}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-sort">ترتیب</Label>
              <Input
                id="service-sort"
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="service-image">تصویر (URL)</Label>
              <Input
                id="service-image"
                value={values.image ?? ""}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, image: event.target.value }))
                }
                disabled={submitting}
                dir="ltr"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="service-description">توضیح</Label>
              <Textarea
                id="service-description"
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
