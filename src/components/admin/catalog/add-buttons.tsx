"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

import { CategoryFormDialog, type CategoryDialogMode } from "./category-form-dialog";
import { type CategoryOption, type ServiceDialogMode, ServiceFormDialog } from "./service-form-dialog";

export function AddServiceButton({ categories, categoryId }: { categories: CategoryOption[]; categoryId?: string }) {
  const canManage = useCan(ADMIN_PERMISSIONS.catalogManage);
  const [mode, setMode] = useState<ServiceDialogMode | null>(null);
  if (!canManage) return null;
  return (
    <>
      <Button onClick={() => setMode({ categoryId, kind: "create" })}>
        <Plus />
        افزودن خدمت
      </Button>
      <ServiceFormDialog categories={categories} mode={mode} onOpenChange={(open) => !open && setMode(null)} />
    </>
  );
}

export function AddCategoryButton() {
  const canManage = useCan(ADMIN_PERMISSIONS.catalogManage);
  const [mode, setMode] = useState<CategoryDialogMode | null>(null);
  if (!canManage) return null;
  return (
    <>
      <Button onClick={() => setMode({ kind: "create" })}>
        <Plus />
        افزودن دسته‌بندی
      </Button>
      <CategoryFormDialog mode={mode} onOpenChange={(open) => !open && setMode(null)} />
    </>
  );
}
