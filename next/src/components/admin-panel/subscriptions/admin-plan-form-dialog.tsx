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
  AdminPlanFormSchema,
  createAdminSubscriptionPlan,
  featuresToText,
  patchAdminSubscriptionPlan,
  type AdminPlanFormValues,
  type AdminSubscriptionPlan,
} from "@/lib/api/admin-subscriptions";
import { isApiClientError } from "@/lib/api/envelope";

interface AdminPlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: AdminSubscriptionPlan | null;
  onSaved: () => void;
}

const EMPTY: AdminPlanFormValues = {
  code: "",
  description: "",
  durationMonths: 1,
  featuresText: "",
  isActive: true,
  isRecommended: false,
  name: "",
  priceToman: 0,
  sortOrder: 0,
};

function toFormValues(plan: AdminSubscriptionPlan | null | undefined) {
  if (!plan) return EMPTY;
  return {
    code: plan.code,
    description: plan.description ?? "",
    durationMonths: plan.durationMonths,
    featuresText: featuresToText(plan.features),
    isActive: plan.isActive,
    isRecommended: plan.isRecommended,
    name: plan.name,
    priceToman: plan.priceToman,
    sortOrder: plan.sortOrder,
  };
}

export function AdminPlanFormDialog({
  open,
  onOpenChange,
  plan,
  onSaved,
}: AdminPlanFormDialogProps) {
  const isEdit = Boolean(plan);
  const seedKey = `${open ? "open" : "closed"}:${plan?.planId ?? "new"}`;
  const [seedSnapshot, setSeedSnapshot] = useState(seedKey);
  const [values, setValues] = useState<AdminPlanFormValues>(() =>
    toFormValues(plan),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (seedKey !== seedSnapshot) {
    setSeedSnapshot(seedKey);
    if (open) {
      setValues(toFormValues(plan));
      setFieldErrors({});
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    const parsed = AdminPlanFormSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(mapZodFieldErrors(parsed.error.issues));
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && plan) {
        await patchAdminSubscriptionPlan(plan.planId, {
          description: parsed.data.description,
          durationMonths: parsed.data.durationMonths,
          featuresText: parsed.data.featuresText,
          isActive: parsed.data.isActive,
          isRecommended: parsed.data.isRecommended,
          name: parsed.data.name,
          priceToman: parsed.data.priceToman,
          sortOrder: parsed.data.sortOrder,
        });
        toast.success("پلن به‌روزرسانی شد");
      } else {
        await createAdminSubscriptionPlan(parsed.data);
        toast.success("پلن ایجاد شد");
      }
      onOpenChange(false);
      onSaved();
    } catch (cause) {
      toast.error(
        isApiClientError(cause) ? cause.message : "ذخیره پلن ناموفق بود.",
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
          <DialogTitle>{isEdit ? "ویرایش پلن" : "ایجاد پلن"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="plan-name">نام</Label>
              <Input
                id="plan-name"
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
              <Label htmlFor="plan-code">کد پلن</Label>
              <Input
                id="plan-code"
                value={values.code}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, code: event.target.value }))
                }
                disabled={submitting || isEdit}
                dir="ltr"
                className="font-mono text-xs"
              />
              {fieldErrors.code ? (
                <p className="text-xs text-destructive">{fieldErrors.code}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-price">قیمت (تومان)</Label>
              <Input
                id="plan-price"
                type="number"
                value={values.priceToman}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    priceToman: Number(event.target.value),
                  }))
                }
                disabled={submitting}
                dir="ltr"
              />
              {fieldErrors.priceToman ? (
                <p className="text-xs text-destructive">
                  {fieldErrors.priceToman}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-duration">مدت (ماه)</Label>
              <Input
                id="plan-duration"
                type="number"
                value={values.durationMonths}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    durationMonths: Number(event.target.value),
                  }))
                }
                disabled={submitting}
                dir="ltr"
              />
              {fieldErrors.durationMonths ? (
                <p className="text-xs text-destructive">
                  {fieldErrors.durationMonths}
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
              <Label>پیشنهادی</Label>
              <Select
                value={values.isRecommended ? "1" : "0"}
                onValueChange={(value) =>
                  setValues((prev) => ({
                    ...prev,
                    isRecommended: value === "1",
                  }))
                }
                disabled={submitting}
              >
                <SelectTrigger className="w-full rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">خیر</SelectItem>
                  <SelectItem value="1">بله</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-sort">ترتیب</Label>
              <Input
                id="plan-sort"
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
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="plan-features">ویژگی‌ها (هر خط یک مورد)</Label>
              <Textarea
                id="plan-features"
                value={values.featuresText ?? ""}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    featuresText: event.target.value,
                  }))
                }
                disabled={submitting}
                rows={3}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="plan-description">توضیح</Label>
              <Textarea
                id="plan-description"
                value={values.description ?? ""}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                disabled={submitting}
                rows={2}
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
