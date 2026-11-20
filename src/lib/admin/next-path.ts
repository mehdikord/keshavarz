/** Only same-console paths are accepted as a post-login destination. */
export function safeAdminNext(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith("/admins") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.startsWith("/admins/login")
  ) {
    return "/admins";
  }
  return value;
}
