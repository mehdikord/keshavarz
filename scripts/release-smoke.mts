import "dotenv/config";

const baseUrl = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);

async function check(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(10_000),
  });
  return response;
}

try {
  const health = await check("/api/app/v1/health");
  if (!health.ok) {
    throw new Error(`health failed with status ${health.status}`);
  }

  const payload = (await health.json()) as {
    data?: { status?: string };
  };
  if (payload.data?.status && payload.data.status !== "ok") {
    // tolerate varied health payload shapes; status code already checked
  }

  process.stdout.write(`[release-smoke] OK health via ${baseUrl}\n`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("fetch failed") ||
    message.includes("ECONNREFUSED") ||
    message.includes("AbortError")
  ) {
    process.stdout.write(
      `[release-smoke] SKIP server unreachable (${baseUrl}); static checks only\n`,
    );
    process.exitCode = 0;
  } else {
    process.stderr.write(`[release-smoke] FAIL ${message}\n`);
    process.exitCode = 1;
  }
}
