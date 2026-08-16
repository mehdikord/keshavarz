import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type {
  PaymentInitiation,
  PaymentProvider,
} from "@/server/integrations/contracts";

export class MockPaymentProvider implements PaymentProvider {
  constructor(private readonly secret: string) {}

  async initiate(
    input: PaymentInitiation,
  ): Promise<{ authority: string; redirectUrl: string }> {
    const authority = `mock_${createHash("sha256")
      .update(
        `${input.referenceId}:${input.amountToman}:${randomBytes(8).toString("hex")}`,
      )
      .digest("hex")
      .slice(0, 32)}`;

    const url = new URL(input.callbackUrl);
    url.searchParams.set("Authority", authority);
    url.searchParams.set("Amount", String(input.amountToman));

    return {
      authority,
      redirectUrl: url.toString(),
    };
  }

  async verify(input: {
    amountToman: number;
    authority: string;
  }): Promise<{ providerReference: string }> {
    if (!input.authority.startsWith("mock_") || input.amountToman <= 0) {
      throw new Error("GATEWAY_VERIFY_FAILED");
    }

    return {
      providerReference: `ref_${input.authority}`,
    };
  }

  signCallback(authority: string, amountToman: number): string {
    return createHmac("sha256", this.secret)
      .update(`${authority}:${amountToman}`)
      .digest("hex");
  }

  verifyCallbackSignature(input: {
    amountToman: number;
    authority: string;
    signature: string;
  }): boolean {
    const expected = this.signCallback(input.authority, input.amountToman);
    const left = Buffer.from(expected);
    const right = Buffer.from(input.signature);
    return (
      left.length === right.length && timingSafeEqual(left, right)
    );
  }
}

export function createMockPaymentProvider(secret: string): MockPaymentProvider {
  return new MockPaymentProvider(secret);
}
