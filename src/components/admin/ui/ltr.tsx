import { formatPhone } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

/** Left-to-right run (phone, IP, ID) isolated inside right-to-left text. */
export function Ltr({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <bdi className={cn("tabular-nums", className)} dir="ltr">
      {children}
    </bdi>
  );
}

export function PhoneText({ className, phone }: { className?: string; phone: string | null | undefined }) {
  return <Ltr className={className}>{formatPhone(phone)}</Ltr>;
}
