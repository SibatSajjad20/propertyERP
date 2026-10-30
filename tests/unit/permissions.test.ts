import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@/lib/errors";
import { actions, assertCan, can, permissionMatrix } from "@/lib/permissions";
import { userRoles, type UserRole } from "@/db/schema/enums";

const allowed: Record<UserRole, ReadonlySet<string>> = {
  ADMIN: new Set(actions),
  INVENTORY_MANAGER: new Set([
    "units.read",
    "units.manage",
    "units.sell",
    "units.change_status",
    "units.update_rate",
    "units.import",
    "units.export",
    "structure.read",
    "structure.manage",
    "dashboard.read",
    "profile.update",
  ]),
  SALES: new Set([
    "units.read",
    "units.sell",
    "units.change_status",
    "structure.read",
    "dashboard.read",
    "profile.update",
  ]),
};

describe("permission matrix", () => {
  it("covers every action for every role", () => {
    for (const action of actions) {
      expect(permissionMatrix[action]).toBeDefined();
      for (const role of userRoles) {
        const shouldAllow = allowed[role].has(action);
        expect(can(role, action), `${role} ${action}`).toBe(shouldAllow);
        if (shouldAllow) {
          expect(() => assertCan(role, action)).not.toThrow();
        } else {
          expect(() => assertCan(role, action)).toThrow(ForbiddenError);
        }
      }
    }
  });

  it("gives ADMIN every action", () => {
    for (const action of actions) {
      expect(can("ADMIN", action)).toBe(true);
    }
  });

  it("keeps user management and reverse-sale off SALES and inventory", () => {
    expect(can("SALES", "users.manage")).toBe(false);
    expect(can("SALES", "users.read")).toBe(false);
    expect(can("SALES", "audit.read")).toBe(false);
    expect(can("SALES", "units.import")).toBe(false);
    expect(can("SALES", "units.export")).toBe(false);
    expect(can("SALES", "units.update_rate")).toBe(false);
    expect(can("SALES", "units.manage")).toBe(false);
    expect(can("SALES", "units.reverse_sale")).toBe(false);
    expect(can("INVENTORY_MANAGER", "users.manage")).toBe(false);
    expect(can("INVENTORY_MANAGER", "users.read")).toBe(false);
    expect(can("INVENTORY_MANAGER", "units.reverse_sale")).toBe(false);
  });
});
