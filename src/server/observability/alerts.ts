import { createLogger } from "@/server/observability/logger";
import { incrementMetric } from "@/server/observability/metrics";

export type AlertType =
  | "auth_abuse"
  | "payment_mismatch"
  | "queue_backlog"
  | "notification_dead_letter"
  | "job_failure";

export function emitAlert(
  type: AlertType,
  payload: Record<string, unknown> = {},
): void {
  incrementMetric("alerts_total", { type });
  const logger = createLogger(
    "01ALERT00000000000000000000" as never,
    "alerts",
  );
  logger.warn("ops.alert", {
    alertType: type,
    ...payload,
  });
}
