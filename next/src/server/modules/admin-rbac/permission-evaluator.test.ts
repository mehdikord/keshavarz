import { beforeEach, describe, expect, it, vi } from "vitest";

import * as adminAuthRepository from "@/server/modules/admin-auth/admin-auth.repository";
import {
  assertNotLastSuperAdminRemoval,
  assertNotSelfDeactivation,
} from "@/server/modules/admin-rbac/admin-status-guards";
import { buildPermissionContext } from "@/server/modules/admin-rbac/permission-evaluator";
import { requirePermission } from "@/server/security";

describe("admin permission evaluator", () => {
  it("applies deny override over role allow and super-admin bypass", () => {
    const context = buildPermissionContext({
      isSuperAdmin: true,
      overrides: [{ code: "users.update", effect: "deny" }],
      rolePermissionCodes: ["users.update", "users.view"],
    });

    expect(() => requirePermission(context, "users.update")).toThrow();
    expect(() => requirePermission(context, "payments.refund")).not.toThrow();
  });

  it("grants allow override and role permissions for non-super admins", () => {
    const context = buildPermissionContext({
      isSuperAdmin: false,
      overrides: [{ code: "reports.view", effect: "allow" }],
      rolePermissionCodes: ["users.view"],
    });

    expect(() => requirePermission(context, "users.view")).not.toThrow();
    expect(() => requirePermission(context, "reports.view")).not.toThrow();
    expect(() => requirePermission(context, "admins.manage")).toThrow();
  });

  it("blocks admin A from changing admin B without admins.manage", () => {
    const context = buildPermissionContext({
      isSuperAdmin: false,
      overrides: [],
      rolePermissionCodes: ["admins.view"],
    });
    expect(() => requirePermission(context, "admins.manage")).toThrow();
  });
});

describe("admin status guards", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks self-deactivation", () => {
    expect(() =>
      assertNotSelfDeactivation(BigInt(1), BigInt(1), false),
    ).toThrow(/غیرفعال/);
    expect(() =>
      assertNotSelfDeactivation(BigInt(1), BigInt(2), false),
    ).not.toThrow();
  });

  it("blocks removing the last super-admin", async () => {
    vi.spyOn(adminAuthRepository, "findAdminStatusTarget").mockResolvedValue({
      id: BigInt(1),
      isActive: 1,
      isSuperAdmin: 1,
    });
    vi.spyOn(adminAuthRepository, "countActiveSuperAdmins").mockResolvedValue(0);

    await expect(
      assertNotLastSuperAdminRemoval(BigInt(1), false, true, false),
    ).rejects.toThrow(/آخرین super-admin/);

    await expect(
      assertNotLastSuperAdminRemoval(BigInt(1), true, false, false),
    ).rejects.toThrow(/آخرین super-admin/);
  });

  it("allows removing a super-admin when another remains", async () => {
    vi.spyOn(adminAuthRepository, "findAdminStatusTarget").mockResolvedValue({
      id: BigInt(1),
      isActive: 1,
      isSuperAdmin: 1,
    });
    vi.spyOn(adminAuthRepository, "countActiveSuperAdmins").mockResolvedValue(1);

    await expect(
      assertNotLastSuperAdminRemoval(BigInt(1), false, true, false),
    ).resolves.toBeUndefined();
  });
});
