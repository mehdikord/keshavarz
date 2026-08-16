import { systemClock } from "@/server/clock/clock";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import { mapLand } from "@/server/modules/lands/lands.mapper";
import {
  countLandServiceRequests,
  createUserLand,
  findUserLandByPublicId,
  listUserLands,
  softDeleteUserLand,
  updateUserLand,
} from "@/server/modules/lands/lands.repository";

export async function listCurrentUserLands(
  userId: bigint,
  input: { cursor?: string; limit: number },
) {
  let cursorId: bigint | undefined;
  if (input.cursor) {
    const cursorLand = await findUserLandByPublicId(userId, input.cursor);
    if (!cursorLand) {
      throw new ApiError(400, API_ERROR_CODES.validationFailed, "cursor معتبر نیست.");
    }
    cursorId = cursorLand.id;
  }

  const rows = await listUserLands({
    cursorId,
    limit: input.limit,
    userId,
  });
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map(mapLand),
    meta: {
      hasMore,
      limit: input.limit,
      nextCursor: hasMore && last ? last.publicId : null,
    },
  };
}

export async function createCurrentUserLand(
  userId: bigint,
  input: {
    areaSquareMeters: string;
    description?: string | null;
    latitude: string;
    longitude: string;
    title: string;
  },
) {
  const land = await createUserLand({
    ...input,
    publicId: createPublicId(),
    userId,
  });
  return mapLand(land);
}

export async function getCurrentUserLand(userId: bigint, landId: string) {
  const land = await findUserLandByPublicId(userId, landId);
  if (!land) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "زمین یافت نشد.");
  }
  return mapLand(land);
}

export async function updateCurrentUserLand(
  userId: bigint,
  landId: string,
  input: {
    areaSquareMeters?: string;
    description?: string | null;
    latitude?: string;
    longitude?: string;
    title?: string;
  },
) {
  const land = await findUserLandByPublicId(userId, landId);
  if (!land) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "زمین یافت نشد.");
  }
  return mapLand(await updateUserLand(land.id, input));
}

export async function deleteCurrentUserLand(userId: bigint, landId: string) {
  const land = await findUserLandByPublicId(userId, landId);
  if (!land) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "زمین یافت نشد.");
  }

  const requestCount = await countLandServiceRequests(land.id);
  if (requestCount > 0) {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "زمینی که سابقه درخواست دارد قابل حذف نیست.",
    );
  }

  await softDeleteUserLand(land.id, systemClock.now());
  return { deleted: true };
}
