/** Raw gateway payload, collapsed by default. */
export function JsonDetails({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  return (
    <details className="group rounded-xl border border-line">
      <summary className="cursor-pointer list-none px-4 py-3 text-[13px] font-semibold select-none marker:hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        {label}
        <span className="ms-2 text-xs font-normal text-muted-foreground group-open:hidden">(نمایش)</span>
      </summary>
      <pre className="admin-scroll max-h-80 overflow-auto border-t border-line bg-raised px-4 py-3 text-left font-mono text-[11.5px] leading-5" dir="ltr">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}
