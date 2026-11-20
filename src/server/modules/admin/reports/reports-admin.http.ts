import { API_ERROR_CODES, ApiError } from "@/server/errors";
import {
  type PeriodInput,
  ReportPeriodError,
  resolvePeriod,
  type ReportPeriod,
} from "@/server/modules/admin/reports/report-period";

/** `resolvePeriod` for API routes: an invalid custom range is a 400 with the reason. */
export function resolvePeriodOrThrow(input: PeriodInput, now: Date): ReportPeriod {
  try {
    return resolvePeriod(input, now);
  } catch (error) {
    if (error instanceof ReportPeriodError) {
      throw new ApiError(400, API_ERROR_CODES.validationFailed, error.message, { fields: { period: [error.message] } });
    }
    throw error;
  }
}
