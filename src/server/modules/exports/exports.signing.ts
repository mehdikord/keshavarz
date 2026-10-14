import { EXPORT_DOWNLOAD_TTL_SECONDS } from "@/server/modules/exports/exports.schemas";
import { signPayload, verifyPayloadSignature } from "@/server/security/crypto";

function createDownloadSignature(payload: string): string {
  return signPayload(payload, "base64url");
}

export function createExportDownloadToken(input: {
  adminId: string;
  exportId: string;
  now?: Date;
}): { expiresAt: Date; token: string } {
  const now = input.now ?? new Date();
  const exp = Math.floor(now.getTime() / 1000) + EXPORT_DOWNLOAD_TTL_SECONDS;
  const payload = `${input.exportId}.${input.adminId}.${exp}`;
  const token = `${exp}.${createDownloadSignature(payload)}`;
  return {
    expiresAt: new Date(exp * 1000),
    token,
  };
}

export function verifyExportDownloadToken(input: {
  adminId: string;
  exportId: string;
  token: string;
  now?: Date;
}): boolean {
  const [expRaw, signature] = input.token.split(".");
  const exp = Number(expRaw);
  if (!expRaw || !signature || !Number.isFinite(exp)) {
    return false;
  }
  const now = input.now ?? new Date();
  if (exp * 1000 < now.getTime()) {
    return false;
  }
  const payload = `${input.exportId}.${input.adminId}.${exp}`;
  return verifyPayloadSignature({
    encoding: "base64url",
    payload,
    signature,
  });
}
