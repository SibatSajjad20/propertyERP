import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import type { UserRole } from "@/db/schema/enums";
import {
  LAST_ADMIN_MESSAGE,
  SELF_DEMOTE_MESSAGE,
  SELF_DISABLE_MESSAGE,
  assertActiveAdminRemains,
  assertNotSelfDisable,
  assertNotSelfRoleChange,
  nextActiveAdminCount,
} from "@/features/users/guards";

vi.mock("@/lib/auth", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    transaction: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("better-auth/crypto", () => ({
  hashPassword: vi.fn(async () => "hashed"),
}));

import { createUser, setUserDisabled, updateUserRole } from "@/features/users/actions";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";

function mockSession(role: UserRole, id = `${role.toLowerCase()}-user`) {
  vi.mocked(requireSession).mockResolvedValue({
    user: { id, role, name: role, email: `${id}@sardarsmall.local` },
  } as Awaited<ReturnType<typeof requireSession>>);
}

describe("user admin guards", () => {
  it("refuses self role change and self disable", () => {
    expect(() => assertNotSelfRoleChange("a", "a")).toThrow(SELF_DEMOTE_MESSAGE);
    expect(() => assertNotSelfDisable("a", "a")).toThrow(SELF_DISABLE_MESSAGE);
    expect(() => assertNotSelfRoleChange("a", "b")).not.toThrow();
  });

  it("keeps at least one active admin", () => {
    expect(
      nextActiveAdminCount({
        nextRole: "SALES",
        nextDisabled: false,
        otherActiveAdmins: 0,
      }),
    ).toBe(0);
    expect(() => assertActiveAdminRemains(0)).toThrow(LAST_ADMIN_MESSAGE);
    expect(
      nextActiveAdminCount({
        nextRole: "ADMIN",
        nextDisabled: false,
        otherActiveAdmins: 0,
      }),
    ).toBe(1);
    expect(
      nextActiveAdminCount({
        nextRole: "SALES",
        nextDisabled: true,
        otherActiveAdmins: 1,
      }),
    ).toBe(1);
  });
});

describe("user actions permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.transaction).mockRejectedValue(new Error("db reached"));
  });

  it("rejects create, role change, and disable from SALES before writing", async () => {
    mockSession("SALES");
    await expect(
      createUser({
        name: "Pat",
        email: "pat@sardarsmall.local",
        role: "SALES",
        temporaryPassword: "Temporary1!",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(updateUserRole({ id: "other", role: "ADMIN" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(setUserDisabled({ id: "other", disabled: true })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("rejects an admin changing their own role", async () => {
    mockSession("ADMIN", "admin-1");
    await expect(updateUserRole({ id: "admin-1", role: "SALES" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
