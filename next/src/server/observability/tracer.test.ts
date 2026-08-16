import { afterEach, describe, expect, it } from "vitest";

import {
  getRecentTraces,
  resetTracesForTests,
  startSpan,
} from "@/server/observability/tracer";

describe("observability tracer", () => {
  afterEach(() => {
    resetTracesForTests();
  });

  it("records a successful span with duration and attributes", () => {
    const span = startSpan({
      name: "payment.callback",
      attributes: { gateway: "mock" },
    });
    span.finish({ outcome: "paid" });

    const traces = getRecentTraces();
    expect(traces).toHaveLength(1);
    expect(traces[0]).toMatchObject({
      attributes: expect.objectContaining({ gateway: "mock" }),
      name: "payment.callback",
      status: "ok",
    });
    expect(traces[0]!.durationMs).toBeGreaterThanOrEqual(0);
    expect(traces[0]!.requestId).toBeTruthy();
    expect(new Date(traces[0]!.startedAt).getTime()).not.toBeNaN();
  });

  it("records a failed span with an error code", () => {
    const span = startSpan({ name: "app.service-request.accept" });
    span.error(new Error("request_already_accepted"));

    const traces = getRecentTraces();
    expect(traces).toHaveLength(1);
    expect(traces[0]!.status).toBe("error");
    expect(traces[0]!.errorCode).toBe("Error");
  });

  it("keeps only the recent trace buffer", () => {
    for (let index = 0; index < 250; index += 1) {
      const span = startSpan({ name: "load-test" });
      span.finish();
    }

    expect(getRecentTraces().length).toBeLessThanOrEqual(200);
  });
});
