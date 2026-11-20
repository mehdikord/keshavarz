import { cn } from "@/lib/utils";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function render(value: Json | undefined): string {
  if (value === undefined) return "—";
  if (value === null) return "خالی";
  if (typeof value === "boolean") return value ? "بله" : "خیر";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function asRecord(value: unknown): Record<string, Json> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, Json>) : null;
}

/** Field-by-field comparison of an audit row's old and new values. */
export function AuditDiff({ newValues, oldValues }: { newValues: unknown; oldValues: unknown }) {
  const before = asRecord(oldValues);
  const after = asRecord(newValues);
  if (!before && !after) return <p className="px-5 pb-5 text-[12.5px] text-muted-foreground">این رویداد مقدار قبل/بعد ندارد.</p>;
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])].sort();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-[12.5px]">
        <thead>
          <tr className="border-y border-line text-right text-[11.5px] text-muted-foreground">
            <th className="w-44 py-2.5 pr-5 pl-3 font-semibold">فیلد</th>
            <th className="px-3 font-semibold">پیش از تغییر</th>
            <th className="px-3 pl-5 font-semibold">پس از تغییر</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => {
            const oldValue = before?.[key];
            const newValue = after?.[key];
            const changed = JSON.stringify(oldValue) !== JSON.stringify(newValue);
            return (
              <tr className={cn("border-b border-line align-top last:border-0", changed && "bg-wheat-soft/30")} key={key}>
                <td className="py-2.5 pr-5 pl-3 font-mono text-[11.5px]" dir="ltr">
                  {key}
                </td>
                <td className={cn("px-3 py-2.5", changed && before ? "text-danger" : "text-muted-foreground")}>
                  <pre className="font-sans break-words whitespace-pre-wrap">{before ? render(oldValue) : "—"}</pre>
                </td>
                <td className={cn("px-3 py-2.5 pl-5", changed && after ? "text-ok" : "text-muted-foreground")}>
                  <pre className="font-sans break-words whitespace-pre-wrap">{after ? render(newValue) : "—"}</pre>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
