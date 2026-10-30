import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { assertCan, can } from "@/lib/permissions";
import type { UserRole } from "@/db/schema/enums";
import {
  createUnitSchema,
  STALE_UNIT_MESSAGE,
  unitCodeSchema,
  updateUnitSchema,
} from "@/features/units/schema";

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

import { createUnit, updateUnit } from "@/features/units/actions";
import { db } from "@/db";
import { requireSession } from "@/lib/auth";
import { auditLog } from "@/db/schema/audit";
import { rateHistory, units } from "@/db/schema/units";

const UNIT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const FLOOR_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const CATEGORY_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const PROPERTY_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function mockSession(role: UserRole) {
  vi.mocked(requireSession).mockResolvedValue({
    user: { id: `${role.toLowerCase()}-user`, role },
  } as Awaited<ReturnType<typeof requireSession>>);
}

const baseFields = {
  unitCode: "GF-S12",
  unitNumber: "S12",
  floorId: FLOOR_ID,
  categoryId: CATEGORY_ID,
  netAreaSqft: "312.50",
  grossAreaSqft: "340.00",
  ratePerSqftPkr: "25000.00",
  priceAdjustmentPkr: "0",
  isSellable: true,
  ownershipGroup: "Sardar Group",
};

function currentUnit(overrides: Record<string, unknown> = {}) {
  return {
    id: UNIT_ID,
    propertyId: PROPERTY_ID,
    unitCode: "GF-S12",
    unitNumber: "S12",
    floorId: FLOOR_ID,
    categoryId: CATEGORY_ID,
    netAreaSqft: "312.50",
    grossAreaSqft: "340.00",
    ratePerSqftPkr: "25000.00",
    priceAdjustmentPkr: "0",
    priceAdjustmentReason: null,
    soldPricePkr: null,
    soldAt: null,
    soldBy: null,
    status: "AVAILABLE",
    isSellable: true,
    ownershipGroup: "Sardar Group",
    subOwner: null,
    bookingRef: null,
    notes: null,
    version: 1,
    archivedAt: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

type TxState = {
  selects: unknown[][];
  rateHistory: unknown[];
  audit: unknown[];
};

function mockTx(state: TxState) {
  const tx = {
    select: () => tx,
    from: () => tx,
    innerJoin: () => tx,
    where: () => tx,
    limit: async () => state.selects.shift() ?? [],
    for: async () => state.selects.shift() ?? [],
    insert: (table: unknown) => ({
      values: (values: unknown) => {
        if (table === rateHistory) {
          state.rateHistory.push(values);
        }
        if (table === auditLog) {
          state.audit.push(values);
        }
        const row =
          table === units
            ? { ...currentUnit(), ...(values as object), id: UNIT_ID, version: 1 }
            : values;
        return Object.assign(Promise.resolve(undefined), {
          returning: async () => [row],
        });
      },
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => ({
        where: () => ({
          returning: async () => [{ ...currentUnit(), ...values, id: UNIT_ID }],
        }),
      }),
    }),
  };
  return tx;
}

describe("units permissions", () => {
  it.each(["ADMIN", "INVENTORY_MANAGER"] as const)("%s can manage units", (role) => {
    expect(can(role, "units.manage")).toBe(true);
    expect(() => assertCan(role, "units.manage")).not.toThrow();
  });

  it("SALES cannot manage units", () => {
    expect(can("SALES", "units.manage")).toBe(false);
    expect(() => assertCan("SALES", "units.manage")).toThrow(ForbiddenError);
  });
});

describe("unit Zod schema", () => {
  it("uppercases unit codes and requires an adjustment reason when adjustment is not zero", () => {
    expect(unitCodeSchema.parse("gf-s12")).toBe("GF-S12");
    expect(() =>
      createUnitSchema.parse({
        ...baseFields,
        priceAdjustmentPkr: "15000.00",
      }),
    ).toThrow(/reason is required/i);
    expect(
      createUnitSchema.parse({
        ...baseFields,
        priceAdjustmentPkr: "15000.00",
        priceAdjustmentReason: "Corner premium",
      }).priceAdjustmentReason,
    ).toBe("Corner premium");
  });

  it("requires a version on update", () => {
    expect(() => updateUnitSchema.parse({ ...baseFields, id: UNIT_ID })).toThrow();
    expect(
      updateUnitSchema.parse({ ...baseFields, id: UNIT_ID, version: 3 }).version,
    ).toBe(3);
  });
});

describe("unit actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.transaction).mockRejectedValue(new Error("db reached"));
  });

  it("rejects createUnit from SALES before writing", async () => {
    mockSession("SALES");
    await expect(createUnit(baseFields)).rejects.toBeInstanceOf(ForbiddenError);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("rejects updateUnit from SALES before writing", async () => {
    mockSession("SALES");
    await expect(
      updateUnit({ ...baseFields, id: UNIT_ID, version: 1 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("rejects a stale version with the reload message", async () => {
    mockSession("ADMIN");
    const state: TxState = {
      selects: [[currentUnit({ version: 2 })]],
      rateHistory: [],
      audit: [],
    };
    vi.mocked(db.transaction).mockImplementation(async (fn) =>
      fn(mockTx(state) as never),
    );

    await expect(updateUnit({ ...baseFields, id: UNIT_ID, version: 1 })).rejects.toThrow(
      STALE_UNIT_MESSAGE,
    );
  });

  it("locks rate, area and adjustment on SOLD units for non-admins", async () => {
    mockSession("INVENTORY_MANAGER");
    const state: TxState = {
      selects: [[currentUnit({ status: "SOLD" })]],
      rateHistory: [],
      audit: [],
    };
    vi.mocked(db.transaction).mockImplementation(async (fn) =>
      fn(mockTx(state) as never),
    );

    await expect(
      updateUnit({
        ...baseFields,
        id: UNIT_ID,
        version: 1,
        ratePerSqftPkr: "30000.00",
        rateChangeReason: "Market move",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(state.rateHistory).toHaveLength(0);
  });

  it("writes rate_history when the rate changes", async () => {
    mockSession("ADMIN");
    const state: TxState = {
      selects: [
        [currentUnit()],
        [{ id: FLOOR_ID, propertyId: PROPERTY_ID }],
        [{ id: CATEGORY_ID, propertyId: PROPERTY_ID, isSellableDefault: true }],
        [],
      ],
      rateHistory: [],
      audit: [],
    };
    vi.mocked(db.transaction).mockImplementation(async (fn) =>
      fn(mockTx(state) as never),
    );

    await updateUnit({
      ...baseFields,
      id: UNIT_ID,
      version: 1,
      ratePerSqftPkr: "27500.00",
      rateChangeReason: "Revised ground-floor rate",
    });

    expect(state.rateHistory).toEqual([
      expect.objectContaining({
        unitId: UNIT_ID,
        oldRatePerSqftPkr: "25000.00",
        ratePerSqftPkr: "27500.00",
        reason: "Revised ground-floor rate",
        actorId: "admin-user",
      }),
    ]);
    expect(state.audit).toEqual([
      expect.objectContaining({
        action: "UPDATE",
        entityId: UNIT_ID,
      }),
    ]);
  });
});
