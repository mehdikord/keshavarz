import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

export type TransactionClient = Prisma.TransactionClient;

export async function runInTransaction<TResult>(
  operation: (transaction: TransactionClient) => Promise<TResult>,
  options: {
    isolationLevel?: Prisma.TransactionIsolationLevel;
    maxWait?: number;
    timeout?: number;
  } = {},
): Promise<TResult> {
  return prisma.$transaction(operation, options);
}
