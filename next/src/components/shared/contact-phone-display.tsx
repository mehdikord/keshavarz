"use client";

import { Phone, ShieldAlert } from "lucide-react";

import { getContactInfo, type ViewerRole } from "@/lib/contact-privacy";
import { cn } from "@/lib/utils";
import type { Request } from "@/types";

interface ContactPhoneDisplayProps {
  request: Request;
  viewerRole: ViewerRole;
  className?: string;
}

export function ContactPhoneDisplay({
  request,
  viewerRole,
  className,
}: ContactPhoneDisplayProps) {
  const contact = getContactInfo(request, viewerRole);

  if (contact.phone) {
    return (
      <a
        href={`tel:${contact.phone}`}
        dir="ltr"
        className={cn(
          "inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15",
          className,
        )}
      >
        <Phone className="size-4 shrink-0" />
        {contact.phone}
      </a>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground",
        className,
      )}
    >
      <ShieldAlert className="size-4 shrink-0 text-accent" />
      {contact.maskedMessage}
    </div>
  );
}
