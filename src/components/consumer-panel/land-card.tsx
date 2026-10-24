"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { MapPinned, Pencil, Trash2 } from "lucide-react";

import { ParsimapMap } from "@/components/shared/parsimap-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatAreaSqm } from "@/lib/utils/format";
import type { Land } from "@/types";

interface LandCardProps {
  land: Land;
  index?: number;
  onDelete: (landId: string) => void;
}

export function LandCard({ land, index = 0, onDelete }: LandCardProps) {
  const [mapOpen, setMapOpen] = useState(false);
  const area = formatAreaSqm(land.areaSqm);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.2,
          delay: Math.min(index * 0.03, 0.18),
          ease: "easeOut",
        }}
      >
        <Card
          className={cn(
            "overflow-hidden rounded-xl border-border/70 bg-surface",
            "shadow-[0_2px_10px_rgba(45,106,79,0.05)] transition-colors duration-200",
            "hover:border-primary/25",
          )}
        >
          <CardContent className="flex items-start gap-3 p-3.5">
            <span
              className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary"
              aria-hidden="true"
            >
              <MapPinned className="size-4" strokeWidth={1.85} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="truncate text-sm font-bold leading-6 text-foreground">
                  {land.title}
                </h2>
                <span className="shrink-0 rounded-lg bg-muted/70 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground">
                  {area.primary} {area.primaryUnit}
                </span>
              </div>

              {land.description ? (
                <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-muted-foreground">
                  {land.description}
                </p>
              ) : null}

              <div className="mt-2.5 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg px-2.5 text-xs text-primary hover:bg-primary/8 hover:text-primary"
                  onClick={() => setMapOpen(true)}
                >
                  <MapPinned className="size-3.5" aria-hidden="true" />
                  نمایش روی نقشه
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Link
                    href={`/users/lands/${land.id}/edit`}
                    aria-label={`ویرایش ${land.title}`}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/8 hover:text-destructive"
                  onClick={() => onDelete(land.id)}
                  aria-label={`حذف ${land.title}`}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="gap-3 rounded-2xl p-4 sm:max-w-lg">
          <DialogHeader className="gap-1 text-right">
            <DialogTitle className="text-base">{land.title}</DialogTitle>
            <DialogDescription>
              موقعیت این زمین روی نقشه مشخص شده است.
            </DialogDescription>
          </DialogHeader>
          {mapOpen ? (
            <ParsimapMap
              center={land.location}
              value={land.location}
              interactive={false}
              className="h-64 rounded-xl border border-border/70 sm:h-72"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
