import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveContext = vi.fn();

vi.mock("@/server/modules/admin-rbac/require-admin-permission", () => ({
  resolveAdminPermissionContext: (adminId: bigint) => resolveContext(adminId),
}));

const {
  assertCanGrantPermissions,
  assertCanGrantSuperAdmin,
  assertCanManageAdminTarget,
  assertNotSelfAccessChange,
} = await import("@/server/modules/admin-rbac/admin-escalation-guards");

const regular = { internalAdminId: BigInt(1), isSuperAdmin: false };
const superAdmin = { internalAdminId: BigInt(2), isSuperAdmin: true };

describe("admin escalation guards", () => {
  beforeEach(() => {
    resolveContext.mockReset();
  });

  it("only lets super admins manage super-admin accounts", () => {
    expect(() =>
      assertCanManageAdminTarget(regular, { id: BigInt(9), isSuperAdmin: 1 }),
    ).toThrow();
    expect(() =>
      assertCanManageAdminTarget(regular, { id: BigInt(9), isSuperAdmin: 0 }),
    ).not.toThrow();
    expect(() =>
      assertCanManageAdminTarget(superAdmin, { id: BigInt(9), isSuperAdmin: 1 }),
    ).not.toThrow();
  });

  it("only lets super admins create super admins", () => {
    expect(() => assertCanGrantSuperAdmin(regular)).toThrow();
    expect(() => assertCanGrantSuperAdmin(superAdmin)).not.toThrow();
  });

  it("blocks non-super admins from changing their own access", () => {
    expect(() => assertNotSelfAccessChange(regular, BigInt(1))).toThrow();
    expect(() => assertNotSelfAccessChange(regular, BigInt(5))).not.toThrow();
    expect(() => assertNotSelfAccessChange(superAdmin, BigInt(2))).not.toThrow();
  });

  it("rejects granting permissions the actor does not hold", async () => {
    resolveContext.mockResolvedValue({
      allowedPermissions: new Set(["users.view", "admins.manage"]),
      deniedPermissions: new Set(["settings.manage"]),
      isSuperAdmin: false,
    });

    await expect(
      assertCanGrantPermissions(regular, ["users.view"]),
    ).resolves.toBeUndefined();
    await expect(
      assertCanGrantPermissions(regular, ["users.view", "roles.manage"]),
    ).rejects.toThrow(/roles\.manage/);
    await expect(
      assertCanGrantPermissions(regular, ["settings.manage"]),
    ).rejects.toThrow();
  });

  it("skips the permission lookup for super admins and empty grants", async () => {
    await assertCanGrantPermissions(superAdmin, ["anything.at_all"]);
    await assertCanGrantPermissions(regular, []);
    expect(resolveContext).not.toHaveBeenCalled();
  });
});
