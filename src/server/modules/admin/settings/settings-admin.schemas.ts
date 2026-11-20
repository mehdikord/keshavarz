import * as z from "zod";

import { JOB_NAMES } from "@/server/jobs/runner";
import { SETTING_SECTIONS } from "@/server/modules/system/settings-registry";

const SECTION_IDS = SETTING_SECTIONS.map((section) => section.id) as [string, ...string[]];

export const SettingsSectionParamsSchema = z.object({
  section: z.enum(SECTION_IDS, { message: "بخش تنظیمات معتبر نیست." }),
});

/** Values keyed by setting id (`group.key`); each is validated against the registry. */
export const SettingsSectionSaveSchema = z
  .object({
    values: z.record(z.string().max(120), z.union([z.string().max(2000), z.number(), z.boolean()])),
  })
  .strict();

export const SettingResetSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9_]+\.[a-z0-9_]+$/, "شناسه تنظیم معتبر نیست."),
  })
  .strict();

export const RunJobSchema = z
  .object({
    job: z.enum(JOB_NAMES, { message: "کار پس‌زمینه ناشناخته است." }),
  })
  .strict();
