import { Prisma } from "@/generated/prisma/client";
import {
  API_ERROR_CODES,
  ApiError,
} from "@/server/errors/api-error";

export function mapPrismaError(error: unknown): ApiError | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  if (error.code === "P2002") {
    return new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "رکوردی با این مشخصات از قبل وجود دارد.",
      { cause: error },
    );
  }

  if (error.code === "P2003") {
    return new ApiError(
      422,
      API_ERROR_CODES.validationFailed,
      "ارتباط داده‌های ارسالی معتبر نیست.",
      { cause: error },
    );
  }

  if (error.code === "P2025") {
    return new ApiError(
      404,
      API_ERROR_CODES.notFound,
      "منبع موردنظر پیدا نشد.",
      { cause: error },
    );
  }

  return null;
}

export function isRetryablePrismaConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code === "P2002" || error.code === "P2034") {
    return true;
  }

  if (error.code === "P2010") {
    const message = JSON.stringify(error.meta ?? {});
    return (
      message.includes("1213") ||
      message.includes("Deadlock") ||
      message.includes("TransactionWriteConflict")
    );
  }

  return false;
}
