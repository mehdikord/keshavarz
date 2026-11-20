import { redirect } from "next/navigation";

export default function AdminTeamIndex() {
  redirect("/admins/team/admins");
}
