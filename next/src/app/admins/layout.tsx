import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "پنل مدیریت کشاورز",
  description: "سیستم مدیریت پلتفرم خدمات کشاورزی",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#13261a",
};

export default function AdminsRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
