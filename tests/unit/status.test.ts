import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { assertCan, can } from "@/lib/permissions";
import { computeTotalPrice } from "@/lib/money";
import type { UserRole } from "@/db/schema/enums";
import { STALE_UNIT_MESSAGE } from "@/features/units/schema";
import {
  assertTransition,
  canTransition,
  BOOKING_REF_REQUIRED_MESSAGE,
  NOT_SELLABLE_MESSAGE,
  REVERSE_REASON_MESSAGE,
  STATUS_TRANSITIONS,
} from "@/features/units/status";

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

import { changeUnitStatus } from "@/features/units/actions";
import { db } from "@/db";
import { requireSession } from "@/lib/auth";
import { auditLog } from "@/db/schema/audit";
import { unitStatusHistory, units } from "@/db/schema/units";

const UNIT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const FLOOR_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const CATEGORY_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const PROPERTY_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function mockSession(role: UserRole) {
  vi.mocked(requireSession).mockResolvedValue({
    user: { id: `${role.toLowerCase()}-user`, role },
  } as Awaited<ReturnType<typeof requireSession>>);
}

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
    status: "AVAILABLE" as const,
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

const FROZEN_PRICE = computeTotalPrice("25000.00", "312.50", "0");

type Store = {
  unit: ReturnType<typeof currentUnit>;
  history: unknown[];
  audit: unknown[];
  failAudit: boolean;
};

function createTx(store: Store) {
  const tx = {
    select: () => tx,
    from: () => tx,
    innerJoin: () => tx,
    where: () => tx,
    limit: async () => [store.unit],
    for: async () => [store.unit],
    insert: (table: unknown) => ({
      values: (values: unknown) => {
        if (table === unitStatusHistory) {
          store.history.push(values);
        }
        if (table === auditLog) {
          if (store.failAudit) {
            throw new Error("audit write failed");
          }
          store.audit.push(values);
        }
        return Promise.resolve(undefined);
      },
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: () => ({
          returning: async () => {
            if (table === units) {
              store.unit = { ...store.unit, ...values };
              return [store.unit];
            }
            return [];
          },
        }),
      }),
    }),
  };
  return tx;
}

function installStore(store: Store) {
  let chain = Promise.resolve();
  vi.mocked(db.transaction).mockImplementation(async (fn) => {
    const run = chain.then(async () => {
      const snapshot = {
        unit: { ...store.unit },
        history: [...store.history],
        audit: [...store.audit],
      };
      try {
        return await fn(createTx(store) as never);
      } catch (error) {
        store.unit = snapshot.unit;
        store.history = snapshot.history;
        store.audit = snapshot.audit;
        throw error;
      }
    });
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  });
}

const sellInput = {
  unitId: UNIT_ID,
  expectedVersion: 1,
  toStatus: "SOLD" as const,
  bookingRef: "BK-1001",
  reason: "Walk-in buyer",
};

describe("status transition map", () => {
  it("allows AVAILABLE → SOLD and SOLD → AVAILABLE only", () => {
    expect(STATUS_TRANSITIONS.AVAILABLE).toEqual(["SOLD"]);
    expect(STATUS_TRANSITIONS.SOLD).toEqual(["AVAILABLE"]);
    expect(canTransition("AVAILABLE", "SOLD")).toBe(true);
    expect(canTransition("SOLD", "AVAILABLE")).toBe(true);
    expect(canTransition("AVAILABLE", "AVAILABLE")).toBe(false);
    expect(canTransition("SOLD", "SOLD")).toBe(false);
    expect(() => assertTransition("SOLD", "SOLD")).toThrow(ValidationError);
  });
});

describe("status permissions", () => {
  it.each(["ADMIN", "INVENTORY_MANAGER", "SALES"] as const)(
    "%s can mark a unit sold",
    (role) => {
      expect(can(role, "units.sell")).toBe(true);
      expect(() => assertCan(role, "units.sell")).not.toThrow();
    },
  );

  it("only ADMIN can reverse a sale", () => {
    expect(can("ADMIN", "units.reverse_sale")).toBe(true);
    expect(can("INVENTORY_MANAGER", "units.reverse_sale")).toBe(false);
    expect(can("SALES", "units.reverse_sale")).toBe(false);
    expect(() => assertCan("SALES", "units.reverse_sale")).toThrow(ForbiddenError);
  });
});

describe("changeUnitStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.transaction).mockRejectedValue(new Error("db reached"));
  });

  it("sells an available unit, freezes sold_price_pkr, and writes history + audit", async () => {
    mockSession("SALES");
    const store: Store = {
      unit: currentUnit(),
      history: [],
      audit: [],
      failAudit: false,
    };
    installStore(store);

    const row = await changeUnitStatus(sellInput);

    expect(row.status).toBe("SOLD");
    expect(row.soldPricePkr).toBe(FROZEN_PRICE);
    expect(row.soldBy).toBe("sales-user");
    expect(row.soldAt).toBeInstanceOf(Date);
    expect(row.bookingRef).toBe("BK-1001");
    expect(row.version).toBe(2);
    expect(store.history).toEqual([
      expect.objectContaining({
        unitId: UNIT_ID,
        fromStatus: "AVAILABLE",
        toStatus: "SOLD",
        reason: "Walk-in buyer",
        bookingRef: "BK-1001",
        soldPricePkr: FROZEN_PRICE,
        actorId: "sales-user",
      }),
    ]);
    expect(store.audit).toEqual([
      expect.objectContaining({
        action: "SALE",
        entityId: UNIT_ID,
      }),
    ]);
  });

  it("rejects an invalid transition", async () => {
    mockSession("ADMIN");
    const store: Store = {
      unit: currentUnit({ status: "SOLD", soldPricePkr: FROZEN_PRICE, version: 2 }),
      history: [],
      audit: [],
      failAudit: false,
    };
    installStore(store);

    await expect(
      changeUnitStatus({
        unitId: UNIT_ID,
        expectedVersion: 2,
        toStatus: "SOLD",
        bookingRef: "BK-1001",
      }),
    ).rejects.toThrow(/Cannot change status from SOLD to SOLD/);
    expect(store.history).toHaveLength(0);
    expect(store.audit).toHaveLength(0);
  });

  it("rejects a stale version with the reload message", async () => {
    mockSession("ADMIN");
    const store: Store = {
      unit: currentUnit({ version: 2 }),
      history: [],
      audit: [],
      failAudit: false,
    };
    installStore(store);

    await expect(changeUnitStatus(sellInput)).rejects.toThrow(STALE_UNIT_MESSAGE);
    expect(store.unit.status).toBe("AVAILABLE");
    expect(store.history).toHaveLength(0);
  });

  it("does not sell a non-sellable unit", async () => {
    mockSession("ADMIN");
    const store: Store = {
      unit: currentUnit({ isSellable: false }),
      history: [],
      audit: [],
      failAudit: false,
    };
    installStore(store);

    await expect(changeUnitStatus(sellInput)).rejects.toBeInstanceOf(ValidationError);
    await expect(changeUnitStatus(sellInput)).rejects.toThrow(NOT_SELLABLE_MESSAGE);
    expect(store.unit.status).toBe("AVAILABLE");
  });

  it("does not sell an archived unit", async () => {
    mockSession("ADMIN");
    const store: Store = {
      unit: currentUnit({ archivedAt: new Date("2026-02-01") }),
      history: [],
      audit: [],
      failAudit: false,
    };
    installStore(store);

    await expect(changeUnitStatus(sellInput)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("requires a booking ref on sale", async () => {
    mockSession("SALES");
    const store: Store = {
      unit: currentUnit(),
      history: [],
      audit: [],
      failAudit: false,
    };
    installStore(store);

    await expect(
      changeUnitStatus({
        unitId: UNIT_ID,
        expectedVersion: 1,
        toStatus: "SOLD",
      }),
    ).rejects.toThrow(BOOKING_REF_REQUIRED_MESSAGE);
  });

  it("rejects reverse from SALES before writing", async () => {
    mockSession("SALES");
    const store: Store = {
      unit: currentUnit({
        status: "SOLD",
        soldPricePkr: FROZEN_PRICE,
        bookingRef: "BK-1001",
        version: 2,
      }),
      history: [],
      audit: [],
      failAudit: false,
    };
    installStore(store);

    await expect(
      changeUnitStatus({
        unitId: UNIT_ID,
        expectedVersion: 2,
        toStatus: "AVAILABLE",
        reason: "Customer cancelled the booking",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(store.unit.status).toBe("SOLD");
    expect(store.history).toHaveLength(0);
  });

  it("requires a reason of at least 10 characters to reverse", async () => {
    mockSession("ADMIN");
    const store: Store = {
      unit: currentUnit({
        status: "SOLD",
        soldPricePkr: FROZEN_PRICE,
        bookingRef: "BK-1001",
        version: 2,
      }),
      history: [],
      audit: [],
      failAudit: false,
    };
    installStore(store);

    await expect(
      changeUnitStatus({
        unitId: UNIT_ID,
        expectedVersion: 2,
        toStatus: "AVAILABLE",
        reason: "too short",
      }),
    ).rejects.toThrow(REVERSE_REASON_MESSAGE);
    expect(store.unit.status).toBe("SOLD");
  });

  it("reverses a sale, clears sold fields, and keeps booking_ref on the unit and in history", async () => {
    mockSession("ADMIN");
    const soldAt = new Date("2026-10-01");
    const store: Store = {
      unit: currentUnit({
        status: "SOLD",
        soldPricePkr: FROZEN_PRICE,
        soldAt,
        soldBy: "sales-user",
        bookingRef: "BK-1001",
        version: 2,
      }),
      history: [],
      audit: [],
      failAudit: false,
    };
    installStore(store);

    const row = await changeUnitStatus({
      unitId: UNIT_ID,
      expectedVersion: 2,
      toStatus: "AVAILABLE",
      reason: "Buyer financing fell through",
    });

    expect(row.status).toBe("AVAILABLE");
    expect(row.soldPricePkr).toBeNull();
    expect(row.soldAt).toBeNull();
    expect(row.soldBy).toBeNull();
    expect(row.bookingRef).toBe("BK-1001");
    expect(store.history).toEqual([
      expect.objectContaining({
        fromStatus: "SOLD",
        toStatus: "AVAILABLE",
        bookingRef: "BK-1001",
        soldPricePkr: FROZEN_PRICE,
        reason: "Buyer financing fell through",
      }),
    ]);
    expect(store.audit).toEqual([expect.objectContaining({ action: "REVERSE_SALE" })]);
  });

  it("writes nothing if audit fails in the same transaction", async () => {
    mockSession("SALES");
    const store: Store = {
      unit: currentUnit(),
      history: [],
      audit: [],
      failAudit: true,
    };
    installStore(store);

    await expect(changeUnitStatus(sellInput)).rejects.toThrow("audit write failed");
    expect(store.unit.status).toBe("AVAILABLE");
    expect(store.unit.soldPricePkr).toBeNull();
    expect(store.history).toHaveLength(0);
    expect(store.audit).toHaveLength(0);
  });

  it("lets only one of two simultaneous sells succeed", async () => {
    mockSession("SALES");
    const store: Store = {
      unit: currentUnit(),
      history: [],
      audit: [],
      failAudit: false,
    };
    installStore(store);

    const results = await Promise.allSettled([
      changeUnitStatus({ ...sellInput, bookingRef: "BK-A" }),
      changeUnitStatus({ ...sellInput, bookingRef: "BK-B" }),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.status === "rejected" && rejected[0].reason).toEqual(
      expect.objectContaining({ message: STALE_UNIT_MESSAGE }),
    );
    expect(store.unit.status).toBe("SOLD");
    expect(store.history).toHaveLength(1);
    expect(store.audit).toHaveLength(1);
  });
});
