"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

import { type NewsDialogMode, NewsFormDialog } from "./news-form-dialog";

export function AddNewsButton() {
  const canManage = useCan(ADMIN_PERMISSIONS.newsManage);
  const [mode, setMode] = useState<NewsDialogMode | null>(null);
  if (!canManage) return null;
  return (
    <>
      <Button onClick={() => setMode({ kind: "create" })}>
        <Plus />
        افزودن خبر
      </Button>
      <NewsFormDialog mode={mode} onOpenChange={(open) => !open && setMode(null)} />
    </>
  );
}
