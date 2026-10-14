import type { RequestId } from "@/server/contracts";

const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|password|secret|token|otp|hash|phone)/i;

type LogLevel = "error" | "info" | "warn";

export interface LogAttributes {
  [key: string]: unknown;
}

export interface Logger {
  error(event: string, attributes?: LogAttributes): void;
  info(event: string, attributes?: LogAttributes): void;
  warn(event: string, attributes?: LogAttributes): void;
}

function redact(value: unknown, key = ""): unknown {
  if (
    SENSITIVE_KEY_PATTERN.test(key) ||
    key.toLowerCase() === "code"
  ) {
    return "[REDACTED]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redact(entryValue, entryKey),
      ]),
    );
  }

  return value;
}

function writeLog(
  level: LogLevel,
  event: string,
  base: LogAttributes,
  attributes: LogAttributes = {},
): void {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...base,
    ...(redact(attributes) as LogAttributes),
  };

  process.stdout.write(`${JSON.stringify(record)}\n`);
}

export function createLogger(
  requestId: RequestId,
  route: string,
): Logger {
  const base = { requestId, route };

  return {
    error: (event, attributes) =>
      writeLog("error", event, base, attributes),
    info: (event, attributes) =>
      writeLog("info", event, base, attributes),
    warn: (event, attributes) =>
      writeLog("warn", event, base, attributes),
  };
}

export function redactLogValue(value: unknown): unknown {
  return redact(value);
}
