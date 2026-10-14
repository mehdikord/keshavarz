import { z } from "zod";

export const searchFormSchema = z.object({
  landId: z.string().min(1, "زمین را انتخاب کنید"),
  categoryId: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  serviceId: z.string().min(1, "خدمت را انتخاب کنید"),
  scheduledDates: z
    .array(z.string().min(1))
    .min(1, "حداقل یک تاریخ برای انجام کار انتخاب کنید"),
});

export type SearchFormValues = z.infer<typeof searchFormSchema>;
