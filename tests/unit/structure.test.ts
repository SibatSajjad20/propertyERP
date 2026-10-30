import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  activeUnitsArchiveMessage,
  assertNoActiveUnits,
} from "@/features/structure/archive-guard";
import {
  floorLabelForLevel,
  normaliseFloorLabel,
  SARDARS_MALL_FLOORS,
} from "@/features/structure/floor-labels";
import { ForbiddenError } from "@/lib/errors";
import { assertCan, can } from "@/lib/permissions";
import type { UserRole } from "@/db/schema/enums";

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

import { archiveBlock, archiveFloor, createFloor } from "@/features/structure/actions";
import { db } from "@/db";
import { requireSession } from "@/lib/auth";

const BLOCK_ID = "11111111-1111-4111-8111-111111111111";
const FLOOR_ID = "22222222-2222-4222-8222-222222222222";

function mockSession(role: UserRole) {
  vi.mocked(requireSession).mockResolvedValue({
    user: { id: `${role.toLowerCase()}-user`, role },
  } as Awaited<ReturnType<typeof requireSession>>);
}

describe("structure permissions", () => {
  it.each(["ADMIN", "INVENTORY_MANAGER", "SALES"] as const)(
    "%s can read structure",
    (role) => {
      expect(can(role, "structure.read")).toBe(true);
      expect(() => assertCan(role, "structure.read")).not.toThrow();
    },
  );

  it.each(["ADMIN", "INVENTORY_MANAGER"] as const)("%s can manage structure", (role) => {
    expect(can(role, "structure.manage")).toBe(true);
    expect(() => assertCan(role, "structure.manage")).not.toThrow();
  });

  it("SALES cannot manage structure", () => {
    expect(can("SALES", "structure.manage")).toBe(false);
    expect(() => assertCan("SALES", "structure.manage")).toThrow(ForbiddenError);
  });
});

describe("archive guard", () => {
  it("allows archive when no active units remain", () => {
    expect(assertNoActiveUnits("floor", 0)).toEqual({ ok: true });
    expect(assertNoActiveUnits("block", 0)).toEqual({ ok: true });
  });

  it("blocks archiving a floor that still has active units", () => {
    expect(assertNoActiveUnits("floor", 1)).toEqual({
      ok: false,
      error:
        "Cannot archive this floor: 1 active unit still exists. Archive or move them first.",
    });
  });

  it("blocks archiving a block that still has active units", () => {
    expect(assertNoActiveUnits("block", 12)).toEqual({
      ok: false,
      error:
        "Cannot archive this block: 12 active units still exist. Archive or move them first.",
    });
    expect(activeUnitsArchiveMessage("block", 12)).toBe(
      "Cannot archive this block: 12 active units still exist. Archive or move them first.",
    );
  });
});

describe("normalised floor labels", () => {
  it("seeds Ground then 1st–10th", () => {
    expect(SARDARS_MALL_FLOORS).toHaveLength(11);
    expect(SARDARS_MALL_FLOORS[0]).toEqual({ level: 0, name: "Ground" });
    expect(SARDARS_MALL_FLOORS[1]).toEqual({ level: 1, name: "1st" });
    expect(SARDARS_MALL_FLOORS[10]).toEqual({ level: 10, name: "10th" });
  });

  it("normalises common aliases onto the canonical label", () => {
    expect(normaliseFloorLabel("Ground Floor")).toBe("Ground");
    expect(normaliseFloorLabel("First")).toBe("1st");
    expect(normaliseFloorLabel("Level 1")).toBe("1st");
    expect(floorLabelForLevel(2)).toBe("2nd");
    expect(floorLabelForLevel(3)).toBe("3rd");
  });
});

describe("structure actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.transaction).mockRejectedValue(new Error("db reached"));
  });

  it("rejects createFloor from SALES before writing", async () => {
    mockSession("SALES");
    await expect(
      createFloor({ blockId: BLOCK_ID, level: 1, name: "1st" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("rejects archiveFloor from SALES before writing", async () => {
    mockSession("SALES");
    await expect(archiveFloor({ id: FLOOR_ID })).rejects.toBeInstanceOf(ForbiddenError);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("rejects archiveBlock from SALES before writing", async () => {
    mockSession("SALES");
    await expect(archiveBlock({ id: BLOCK_ID })).rejects.toBeInstanceOf(ForbiddenError);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("lets INVENTORY_MANAGER past the createFloor permission check", async () => {
    mockSession("INVENTORY_MANAGER");
    await expect(
      createFloor({ blockId: BLOCK_ID, level: 11, name: "11th" }),
    ).rejects.toThrow("db reached");
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });

  it("lets ADMIN past the archiveFloor permission check", async () => {
    mockSession("ADMIN");
    await expect(archiveFloor({ id: FLOOR_ID })).rejects.toThrow("db reached");
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });
});
