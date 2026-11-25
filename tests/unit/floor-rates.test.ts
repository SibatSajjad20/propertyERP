import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { updateFloorRatesSchema } from "@/features/structure/schema";
import type { UserRole } from "@/db/schema/enums";

vi.mock("@/lib/auth", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { getFloorRateSummary, updateFloorRates } from "@/features/structure/actions";
import { db } from "@/db";
import { requireSession } from "@/lib/auth";

const FLOOR_ID = "22222222-2222-4222-8222-222222222222";
const CATEGORY_ID = "33333333-3333-4333-8333-333333333333";

function mockSession(role: UserRole) {
  vi.mocked(requireSession).mockResolvedValue({
    user: { id: `${role.toLowerCase()}-user`, role },
  } as Awaited<ReturnType<typeof requireSession>>);
}

describe("updateFloorRatesSchema", () => {
  it("validates valid floor rate input", () => {
    const valid = {
      floorId: FLOOR_ID,
      newRatePerSqftPkr: "18500",
      reason: "Q1 2026 Price Escalation",
    };
    const parsed = updateFloorRatesSchema.parse(valid);
    expect(parsed.floorId).toBe(FLOOR_ID);
    expect(parsed.newRatePerSqftPkr).toBe("18500");
    expect(parsed.includeSoldBooked).toBe(false);
  });

  it("accepts categoryId and comma-separated rates", () => {
    const valid = {
      floorId: FLOOR_ID,
      categoryId: CATEGORY_ID,
      newRatePerSqftPkr: "18,500.50",
      reason: "Category revision",
      includeSoldBooked: true,
    };
    const parsed = updateFloorRatesSchema.parse(valid);
    expect(parsed.categoryId).toBe(CATEGORY_ID);
    expect(parsed.newRatePerSqftPkr).toBe("18,500.50");
    expect(parsed.includeSoldBooked).toBe(true);
  });

  it("rejects non-positive rates and empty reasons", () => {
    expect(() =>
      updateFloorRatesSchema.parse({
        floorId: FLOOR_ID,
        newRatePerSqftPkr: "-500",
        reason: "Valid reason",
      }),
    ).toThrow();

    expect(() =>
      updateFloorRatesSchema.parse({
        floorId: FLOOR_ID,
        newRatePerSqftPkr: "0",
        reason: "Valid reason",
      }),
    ).toThrow();

    expect(() =>
      updateFloorRatesSchema.parse({
        floorId: FLOOR_ID,
        newRatePerSqftPkr: "15000",
        reason: "ab", // too short
      }),
    ).toThrow();
  });
});

describe("updateFloorRates permissions & safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.transaction).mockRejectedValue(new Error("db reached"));
  });

  it("blocks SALES from reading floor rate summary", async () => {
    mockSession("SALES");
    await expect(getFloorRateSummary(FLOOR_ID)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("blocks SALES from updating rates", async () => {
    mockSession("SALES");
    await expect(
      updateFloorRates({
        floorId: FLOOR_ID,
        newRatePerSqftPkr: "20000",
        reason: "Sales attempt",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("blocks non-admin from using includeSoldBooked override", async () => {
    mockSession("INVENTORY_MANAGER");
    await expect(
      updateFloorRates({
        floorId: FLOOR_ID,
        newRatePerSqftPkr: "20000",
        reason: "Manager attempt on sold units",
        includeSoldBooked: true,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("allows INVENTORY_MANAGER to update unsold units", async () => {
    mockSession("INVENTORY_MANAGER");
    await expect(
      updateFloorRates({
        floorId: FLOOR_ID,
        newRatePerSqftPkr: "20000",
        reason: "Manager normal rate update",
      }),
    ).rejects.toThrow("db reached");
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });

  it("allows ADMIN to update rates with includeSoldBooked", async () => {
    mockSession("ADMIN");
    await expect(
      updateFloorRates({
        floorId: FLOOR_ID,
        newRatePerSqftPkr: "22000",
        reason: "Admin full rate adjustment",
        includeSoldBooked: true,
      }),
    ).rejects.toThrow("db reached");
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });
});
