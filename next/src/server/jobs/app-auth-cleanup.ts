import { systemClock } from "@/server/clock/clock";
import { cleanupExpiredAppAuth } from "@/server/modules/app-auth/app-auth.repository";

export async function runAppAuthCleanupJob() {
  return cleanupExpiredAppAuth(systemClock);
}
