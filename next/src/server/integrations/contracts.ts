export interface SmsMessage {
  body: string;
  recipient: string;
}

export interface SmsProvider {
  send(message: SmsMessage): Promise<{ providerMessageId: string }>;
}

export interface SmsQueue {
  enqueue(message: SmsMessage): Promise<{ jobId: string }>;
}

export interface PaymentInitiation {
  amountToman: number;
  callbackUrl: string;
  referenceId: string;
}

export interface PaymentProvider {
  initiate(
    input: PaymentInitiation,
  ): Promise<{ authority: string; redirectUrl: string }>;
  verify(input: {
    amountToman: number;
    authority: string;
  }): Promise<{ providerReference: string }>;
}

export interface ObjectStorage {
  delete(key: string): Promise<void>;
  put(input: {
    contentType: string;
    data: Uint8Array;
    key: string;
  }): Promise<{ url: string }>;
}
