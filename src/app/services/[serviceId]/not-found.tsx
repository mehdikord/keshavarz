import Link from "next/link";
import { SearchX } from "lucide-react";

export default function ServiceNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-[22px] bg-[#e7f1e2] text-[#2d6a4f]">
        <SearchX className="size-8" strokeWidth={1.7} />
      </span>
      <div>
        <h1 className="text-lg font-black text-foreground">این خدمت در دسترس نیست</h1>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          ممکن است حذف یا موقتاً غیرفعال شده باشد.
        </p>
      </div>
      <Link
        className="mt-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-[0_10px_24px_-12px_rgba(45,106,79,0.8)] active:scale-[0.98]"
        href="/"
      >
        بازگشت به صفحه اصلی
      </Link>
    </main>
  );
}
