import { redirect } from "next/navigation";

export default function AdminBillingIndex() {
  redirect("/admins/billing/subscriptions");
}
