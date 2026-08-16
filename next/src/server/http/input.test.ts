import { describe, expect, it } from "vitest";
import * as z from "zod";

import { parseWithSchema } from "@/server/http";

describe("parseWithSchema", () => {
  it("returns field-level validation errors", () => {
    const schema = z
      .object({
        name: z.string().min(2, "نام کوتاه است."),
      })
      .strict();

    expect(() => parseWithSchema(schema, { name: "" })).toThrowError(
      expect.objectContaining({
        code: "VALIDATION_FAILED",
        fields: { name: ["نام کوتاه است."] },
        status: 400,
      }),
    );
  });
});
