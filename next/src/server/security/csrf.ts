import type { NextRequest } from "next/server";

import { API_HEADERS } from "@/server/contracts";
import {
  API_ERROR_CODES,
  ApiError,
} from "@/server/errors";
import {
  getCsrfCookieName,
} from "@/server/security/cookies";
import type { AuthRealm } from "@/server/security/cookies";
import { safeEqual } from "@/server/security/crypto";

function resolveRequestOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");

  if (origin) {
    return origin;
  }

  const referer = request.headers.get("referer");

  if (!referer) {
    return null;
  }

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function assertTrustedOrigin(
  request: NextRequest,
  allowedOrigins: ReadonlySet<string>,
): void {
  const origin = resolveRequestOrigin(request);

  if (!origin || !allowedOrigins.has(origin)) {
    throw new ApiError(
      403,
      API_ERROR_CODES.originNotAllowed,
      "مبدأ درخواست مجاز نیست.",
    );
  }
}

export function assertCsrfToken(
  request: NextRequest,
  realm: AuthRealm,
): void {
  const cookieToken = request.cookies.get(
    getCsrfCookieName(realm),
  )?.value;
  const headerToken = request.headers.get(API_HEADERS.csrfToken);

  if (
    !cookieToken ||
    !headerToken ||
    !safeEqual(cookieToken, headerToken)
  ) {
    throw new ApiError(
      403,
      API_ERROR_CODES.csrfInvalid,
      "توکن CSRF معتبر نیست.",
    );
  }
}

export function assertMutationProtection(
  request: NextRequest,
  realm: AuthRealm,
  allowedOrigins: ReadonlySet<string>,
): void {
  assertTrustedOrigin(request, allowedOrigins);
  assertCsrfToken(request, realm);
}
