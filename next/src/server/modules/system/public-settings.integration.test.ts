import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { getPublicSettings } from "@/server/modules/system/public-settings.service";

const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const publicKey = `public-settings-test-public-${uniqueSuffix}`;
const privateKey = `public-settings-test-private-${uniqueSuffix}`;

async function cleanup() {
  await prisma.systemSetting.deleteMany({
    where: {
      settingGroup: "app",
      settingKey: { in: [publicKey, privateKey] },
    },
  });
}

async function seedSetting(input: {
  key: string;
  isPublic: number;
  value: unknown;
  valueType: "string" | "integer" | "boolean" | "json";
}) {
  await prisma.systemSetting.upsert({
    where: {
      settingGroup_settingKey: {
        settingGroup: "app",
        settingKey: input.key,
      },
    },
    update: {
      isPublic: input.isPublic,
      settingValue: input.value as never,
      valueType: input.valueType,
    },
    create: {
      settingGroup: "app",
      settingKey: input.key,
      isPublic: input.isPublic,
      settingValue: input.value as never,
      valueType: input.valueType,
      description: "تنظیم تستی public settings",
    },
  });
}

describe.sequential("public settings (app public allow-list)", () => {
  beforeAll(async () => {
    await cleanup();
    await seedSetting({ key: publicKey, isPublic: 1, value: "09120000000", valueType: "string" });
    await seedSetting({ key: privateKey, isPublic: 0, value: "secret-value", valueType: "string" });
  });

  afterAll(async () => {
    await cleanup();
  });

  it("only exposes isPublic settings without internal fields", async () => {
    const { settings } = await getPublicSettings();

    const publicSetting = settings.find((setting) => setting.key === publicKey);
    const privateSetting = settings.find((setting) => setting.key === privateKey);

    expect(publicSetting).toBeDefined();
    expect(publicSetting?.settingValue).toBe("09120000000");
    expect(publicSetting?.group).toBe("app");
    expect(publicSetting?.valueType).toBe("string");
    expect(publicSetting?.description).toBe("تنظیم تستی public settings");
    expect(typeof publicSetting?.updatedAt).toBe("string");

    expect(privateSetting).toBeUndefined();

    for (const setting of settings) {
      expect(setting).not.toHaveProperty("isPublic");
      expect(setting).not.toHaveProperty("updatedByAdminId");
      expect(setting).not.toHaveProperty("id");
    }
  });
});
