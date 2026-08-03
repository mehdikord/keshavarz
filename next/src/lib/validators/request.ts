import { z } from "zod";

export const cancelReasonSchema = z.object({
  cancelReason: z
    .string()
    .trim()
    .min(10, "دلیل لغو باید حداقل ۱۰ کاراکتر باشد")
    .max(500, "دلیل لغو نباید بیشتر از ۵۰۰ کاراکتر باشد"),
});

export type CancelReasonFormValues = z.infer<typeof cancelReasonSchema>;
