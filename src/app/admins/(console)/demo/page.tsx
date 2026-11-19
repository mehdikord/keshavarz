import { notFound } from "next/navigation";

import { AdminDemoWorkbench } from "@/components/admin-panel/demo/admin-demo-workbench";

export default function AdminDemoPage() {
  // Component showcase for development only; not part of the production console.
  if (process.env.NODE_ENV === "production") notFound();
  return <AdminDemoWorkbench />;
}
