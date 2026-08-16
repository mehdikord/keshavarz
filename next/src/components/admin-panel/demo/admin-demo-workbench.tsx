"use client";

import { useMemo, useState } from "react";
import { Columns3, Copy } from "lucide-react";
import { toast } from "sonner";

import {
  AdminColumnVisibilityControls,
  AdminConfirmDialog,
  AdminCursorPagination,
  AdminDataTable,
  AdminFilterBar,
  AdminFilterChips,
  AdminFilterDrawer,
  AdminPageHeader,
  AdminSectionCard,
  AdminStatusBadge,
  type AdminDataTableColumn,
  type AdminTableDensity,
} from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminFilterChip, AdminListLimit } from "@/lib/admin/search-params";

interface DemoRow {
  id: string;
  name: string;
  phone: string;
  status: string;
}

const DEMO_ROWS: DemoRow[] = [
  {
    id: "01HXDEMOUSER00000000000001",
    name: "علی کشاورزی",
    phone: "09121234567",
    status: "active",
  },
  {
    id: "01HXDEMOUSER00000000000002",
    name: "مریم زراعی",
    phone: "09129876543",
    status: "pending",
  },
  {
    id: "01HXDEMOUSER00000000000003",
    name: "حسین باغبان",
    phone: "09351234567",
    status: "suspended",
  },
];

export function AdminDemoWorkbench() {
  const [search, setSearch] = useState("");
  const [statusDraft, setStatusDraft] = useState<string>("all");
  const [statusApplied, setStatusApplied] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [density, setDensity] = useState<AdminTableDensity>("comfortable");
  const [visibleColumnIds, setVisibleColumnIds] = useState([
    "name",
    "phone",
    "status",
    "actions",
  ]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [limit, setLimit] = useState<AdminListLimit>(20);
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredRows = useMemo(() => {
    return DEMO_ROWS.filter((row) => {
      const matchesSearch =
        !search ||
        row.name.includes(search) ||
        row.phone.includes(search) ||
        row.id.includes(search);
      const matchesStatus =
        statusApplied === "all" || row.status === statusApplied;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusApplied]);

  const chips: AdminFilterChip[] = [];
  if (search) {
    chips.push({ id: "q", label: `جستجو: ${search}`, keys: ["q"] });
  }
  if (statusApplied !== "all") {
    chips.push({
      id: "status",
      label: `وضعیت: ${statusApplied}`,
      keys: ["status"],
    });
  }

  const columns: AdminDataTableColumn<DemoRow>[] = [
    {
      id: "name",
      header: "نام",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      id: "phone",
      header: "موبایل",
      cell: (row) => (
        <span className="font-mono text-xs" dir="ltr">
          {row.phone}
        </span>
      ),
    },
    {
      id: "status",
      header: "وضعیت",
      cell: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      id: "actions",
      header: "عملیات",
      stickyActions: true,
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => {
              void navigator.clipboard.writeText(row.id);
              toast.success("شناسه عمومی کپی شد");
            }}
          >
            <Copy className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => {
              setSelectedRowId(row.id);
              setConfirmOpen(true);
            }}
          >
            اکشن نمونه
          </Button>
        </div>
      ),
    },
  ];

  const meta = {
    nextCursor: filteredRows.length > 0 ? "demo-next-cursor" : null,
    hasMore: filteredRows.length > 0 && cursorStack.length < 1,
    limit,
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="نمایش کامپوننت‌های ادمین"
        description="صفحه داخلی برای بررسی DataTable، فیلتر، صفحه‌بندی cursor و Confirm Dialog — بدون وابستگی به API."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              window.setTimeout(() => setLoading(false), 700);
            }}
          >
            شبیه‌سازی Loading
          </Button>
        }
      />

      <AdminFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="نام، موبایل یا public_id"
        onOpenFilters={() => setFiltersOpen(true)}
        onReset={() => {
          setSearch("");
          setStatusApplied("all");
          setStatusDraft("all");
          setCursorStack([]);
        }}
        filtersActiveCount={chips.length}
        trailing={
          <>
            <Select
              value={density}
              onValueChange={(value) =>
                setDensity(value as AdminTableDensity)
              }
            >
              <SelectTrigger size="sm" className="min-w-32 rounded-lg">
                <SelectValue placeholder="تراکم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comfortable">راحت</SelectItem>
                <SelectItem value="compact">فشرده</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" className="h-10">
              <Columns3 className="size-4" />
              ستون‌ها
            </Button>
          </>
        }
      />

      <AdminFilterChips
        chips={chips}
        onRemove={(chip) => {
          if (chip.id === "q") setSearch("");
          if (chip.id === "status") {
            setStatusApplied("all");
            setStatusDraft("all");
          }
          setCursorStack([]);
        }}
        onClearAll={() => {
          setSearch("");
          setStatusApplied("all");
          setStatusDraft("all");
          setCursorStack([]);
        }}
      />

      <AdminSectionCard padded>
        <AdminColumnVisibilityControls
          columns={[
            { id: "name", label: "نام" },
            { id: "phone", label: "موبایل" },
            { id: "status", label: "وضعیت" },
            { id: "actions", label: "عملیات" },
          ]}
          visibleColumnIds={visibleColumnIds}
          onChange={setVisibleColumnIds}
        />
      </AdminSectionCard>

      <AdminDataTable
        columns={columns}
        rows={filteredRows}
        getRowId={(row) => row.id}
        density={density}
        loading={loading}
        visibleColumnIds={visibleColumnIds}
        selectedRowId={selectedRowId}
        onRowClick={(row) => setSelectedRowId(row.id)}
      />

      <AdminCursorPagination
        meta={meta}
        pageItemCount={filteredRows.length}
        canGoPrevious={cursorStack.length > 0}
        onPrevious={() => setCursorStack((stack) => stack.slice(0, -1))}
        onNext={() => {
          if (meta.nextCursor) {
            setCursorStack((stack) => [...stack, meta.nextCursor!]);
          }
        }}
        onLimitChange={(nextLimit) => {
          setLimit(nextLimit);
          setCursorStack([]);
        }}
      />

      <AdminFilterDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        onReset={() => setStatusDraft("all")}
        onApply={() => {
          setStatusApplied(statusDraft);
          setCursorStack([]);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="demo-status">وضعیت</Label>
          <Select value={statusDraft} onValueChange={setStatusDraft}>
            <SelectTrigger id="demo-status" className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="active">فعال</SelectItem>
              <SelectItem value="pending">در انتظار</SelectItem>
              <SelectItem value="suspended">معلق</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AdminFilterDrawer>

      <AdminConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="تأیید اکشن نمونه"
        description="این دیالوگ الگوی اکشن‌های حساس ادمین است."
        destructive
        requireReason
        confirmLabel="اجرا"
        onConfirm={(reason) => {
          toast.message("اکشن نمونه ثبت شد", {
            description: reason,
          });
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}
