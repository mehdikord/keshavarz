import type { Metadata } from "next";

import { NewsScreen } from "@/components/news/news-screen";

export const metadata: Metadata = {
  description: "جدیدترین اخبار حوزه کشاورزی از سایت‌های معتبر",
  title: "اخبار کشاورزی",
};

/** Public page (no panel, no account): every news headline, searchable. */
export default function NewsPage() {
  return <NewsScreen />;
}
