const SENSITIVE_KEY_PATTERN =
  /(password|token|secret|hash|otp|authorization|cookie)/i;

export function redactAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactAuditValue(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      result[key] = "[REDACTED]";
      continue;
    }
    if (key === "phone" && typeof nested === "string" && nested.length >= 4) {
      result[key] = `${nested.slice(0, 4)}****${nested.slice(-2)}`;
      continue;
    }
    result[key] = redactAuditValue(nested);
  }
  return result;
}
