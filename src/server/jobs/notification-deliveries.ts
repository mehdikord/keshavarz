import { systemClock } from "@/server/clock/clock";
import { runNotificationDeliveryJob } from "@/server/modules/notifications/notification.delivery";

export async function runNotificationDeliveriesJob() {
  return runNotificationDeliveryJob();
}

export async function runNotificationJobs() {
  const now = systemClock.now();
  const result = await runNotificationDeliveryJob();
  return { ...result, ranAt: now.toISOString() };
}
