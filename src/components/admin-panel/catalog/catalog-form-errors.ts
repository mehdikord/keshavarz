import { isApiClientError } from "@/lib/api/envelope";

export function mapApiFieldErrors(cause: unknown): Record<string, string> {
  if (!isApiClientError(cause) || !cause.fields) return {};
  const next: Record<string, string> = {};
  for (const [key, values] of Object.entries(cause.fields)) {
    if (values[0]) next[key] = values[0];
  }
  return next;
}

export function mapZodFieldErrors(
  issues: Array<{ message: string; path: PropertyKey[] }>,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!next[key]) next[key] = issue.message;
  }
  return next;
}
