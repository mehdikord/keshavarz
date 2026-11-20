"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/** Inline copy affordance for IDs, phone numbers and IPs. */
export function CopyButton({ className, label = "کپی", value }: { className?: string; label?: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      aria-label={copied ? "کپی شد" : label}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        } catch {
          // Clipboard blocked (insecure context); nothing useful to do.
        }
      }}
      title={copied ? "کپی شد" : label}
      type="button"
    >
      {copied ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
    </button>
  );
}
