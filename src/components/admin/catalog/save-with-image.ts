import { adminApi, errorMessage } from "@/lib/admin/api";
import { toast } from "@/lib/toast";

import type { ImageChange } from "./image-field";

/**
 * Applies the picked image after the record itself is saved. An image failure
 * does not undo the save: the record is kept and the admin is told to retry
 * the image alone.
 */
export async function applyImageChange(basePath: string, change: ImageChange): Promise<void> {
  try {
    if (change.file) await adminApi.upload(`${basePath}/image`, change.file);
    else if (change.remove) await adminApi.delete(`${basePath}/image`);
  } catch (error) {
    toast.error(`اطلاعات ذخیره شد اما تصویر ${change.file ? "بارگذاری" : "حذف"} نشد: ${errorMessage(error)}`);
  }
}
