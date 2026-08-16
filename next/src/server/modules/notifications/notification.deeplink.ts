const PUBLIC_ID = "[0-9A-HJKMNP-TV-Z]{26}";

const ALLOWED_DEEP_LINKS: RegExp[] = [
  new RegExp(`^/users/requests/${PUBLIC_ID}$`),
  new RegExp(`^/provider/requests/${PUBLIC_ID}$`),
  /^\/users\/subscription$/,
  /^\/users\/payments$/,
  /^\/users\/search$/,
  /^\/provider\/dashboard$/,
];

export function sanitizeNotificationDeepLink(
  value: string | null | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!ALLOWED_DEEP_LINKS.some((pattern) => pattern.test(trimmed))) {
    return undefined;
  }
  return trimmed;
}

export function extractDeepLinkFromData(data: unknown): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }
  const deepLink = (data as { deepLink?: unknown }).deepLink;
  if (typeof deepLink !== "string") {
    return null;
  }
  return sanitizeNotificationDeepLink(deepLink) ?? null;
}
