import type { Clock } from "@/server/clock/clock";
import { systemClock } from "@/server/clock/clock";
import {
  checkDatabaseConnection,
} from "@/server/modules/system/health.repository";

export interface HealthResult {
  checkedAt: Date;
  status: "ok";
}

export async function getApiHealth(
  clock: Clock = systemClock,
): Promise<HealthResult> {
  await checkDatabaseConnection();

  return {
    checkedAt: clock.now(),
    status: "ok",
  };
}
