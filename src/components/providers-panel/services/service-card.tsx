"use client";

import { Pencil, Sprout, Trash2 } from "lucide-react";

import { pricingUnitLabel, type AppProviderService } from "@/lib/api/app-provider";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: AppProviderService;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  const inactive = !service.isActive;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[24px] ring-1",
        inactive
          ? "bg-muted/40 ring-border/50"
          : "bg-surface shadow-[0_14px_30px_-22px_rgba(45,106,79,0.5)] ring-border/60",
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl",
            inactive
              ? "bg-muted text-muted-foreground"
              : "bg-gradient-to-br from-[#d8f3dc] to-[#b7e4c7] text-[#2d6a4f]",
          )}
        >
          <Sprout className="size-6" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "truncate text-[14.5px] font-black",
                inactive ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {service.serviceName}
            </h3>
            {!inactive ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#d8f3dc] px-2 py-0.5 text-[10px] font-bold text-[#1b5e3b]">
                <span className="size-1.5 rounded-full bg-[#40916c]" />
                فعال
              </span>
            ) : null}
          </div>
          {service.description ? (
            <p className="mt-1 line-clamp-2 text-[11.5px] leading-5 text-muted-foreground">
              {service.description}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "flex items-center justify-between gap-3 border-t px-4 py-3",
          inactive
            ? "border-border/40"
            : "border-primary/10 bg-gradient-to-l from-primary/[0.05] to-transparent",
        )}
      >
        <p className="min-w-0">
          <span
            className={cn(
              "text-[17px] font-black tabular-nums",
              inactive ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {new Intl.NumberFormat("fa-IR").format(service.priceToman)}
          </span>
          <span className="ms-1 text-[11px] font-bold text-muted-foreground">
            تومان / {pricingUnitLabel(service.pricingUnit)}
          </span>
        </p>

        {!inactive && (onEdit || onDelete) ? (
          <div className="flex shrink-0 items-center gap-1.5">
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                aria-label={`ویرایش ${service.serviceName}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary/10 px-3 text-[12px] font-bold text-primary transition-colors hover:bg-primary/15"
              >
                <Pencil className="size-3.5" />
                ویرایش
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                aria-label={`حذف ${service.serviceName}`}
                className="flex size-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-colors hover:bg-destructive/15"
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
