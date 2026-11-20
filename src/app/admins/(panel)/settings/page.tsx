import { redirect } from "next/navigation";

export default function AdminSettingsIndex() {
  redirect("/admins/settings/general");
}
