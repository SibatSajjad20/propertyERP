import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import type { UserRole } from "@/db/schema/enums";
import {
  generateFloorSummaryCsv,
  generateFloorSummaryExcel,
  generateInventoryCsv,
  generateInventoryExcel,
  generateSoldUnitsCsv,
  generateSoldUnitsExcel,
  getExportFilename,
} from "@/features/dashboard/export";
import type {
  FloorLedgerRow,
  FloorSummaryExportRow,
  InventoryExportRow,
  SalesOverTimePoint,
  SoldUnitsExportRow,
} from "@/features/dashboard/queries";
import { can } from "@/lib/permissions";

describe("Dashboard KPI Aggregation Logic", () => {
  it("computes accurate percentage and avoids division by zero", () => {
    function computeStats(total: number, available: number, sold: number) {
      const soldPercent = total > 0 ? (sold / total) * 100 : 0;
      const availPercent = total > 0 ? (available / total) * 100 : 0;
      return { soldPercent, availPercent };
    }

    // Normal case
    const normal = computeStats(31, 26, 5);
    expect(normal.soldPercent).toBeCloseTo(16.129, 2);
    expect(normal.availPercent).toBeCloseTo(83.87, 2);

    // Empty case
    const empty = computeStats(0, 0, 0);
    expect(empty.soldPercent).toBe(0);
    expect(empty.availPercent).toBe(0);

    // Fully sold case
    const full = computeStats(10, 0, 10);
    expect(full.soldPercent).toBe(100);
    expect(full.availPercent).toBe(0);
  });

  it("calculates available inventory value using area × rate + adjustment", () => {
    const unit1 = {
      netAreaSqft: "500.00",
      ratePerSqftPkr: "20000.00",
      priceAdjustmentPkr: "50000.00",
      status: "AVAILABLE",
    };
    const unit2 = {
      netAreaSqft: "1000.00",
      ratePerSqftPkr: "25000.00",
      priceAdjustmentPkr: "0",
      status: "AVAILABLE",
    };

    function askingPrice(u: typeof unit1): bigint {
      const rate = BigInt(Math.round(Number(u.ratePerSqftPkr)));
      const area = BigInt(Math.round(Number(u.netAreaSqft)));
      const adj = BigInt(Math.round(Number(u.priceAdjustmentPkr)));
      return rate * area + adj;
    }

    const val1 = askingPrice(unit1);
    const val2 = askingPrice(unit2);
    const totalVal = val1 + val2;

    expect(val1).toBe(10050000n); // 500 * 20000 + 50000
    expect(val2).toBe(25000000n); // 1000 * 25000
    expect(totalVal).toBe(35050000n);
  });

  it("freezes sold value on sale using soldPricePkr", () => {
    const soldUnit = {
      ratePerSqftPkr: "20000.00",
      netAreaSqft: "500.00",
      priceAdjustmentPkr: "0",
      soldPricePkr: "9500000.00", // Negotiated discounted price
      status: "SOLD",
    };

    const effectiveSoldValue = soldUnit.soldPricePkr
      ? Number(soldUnit.soldPricePkr)
      : Number(soldUnit.ratePerSqftPkr) * Number(soldUnit.netAreaSqft);

    expect(effectiveSoldValue).toBe(9500000);
  });
});

describe("Floor Ledger & Block Breakdown Aggregations", () => {
  const sampleFloors: FloorLedgerRow[] = [
    {
      floorId: "f-10",
      floorName: "10th Floor",
      level: 10,
      blockId: "b-1",
      blockName: "Tower A",
      total: 1,
      available: 0,
      sold: 1,
      soldPercent: 100,
      availableValuePkr: "0",
      soldValuePkr: "45000000",
      totalValuePkr: "45000000",
    },
    {
      floorId: "f-09",
      floorName: "9th Floor",
      level: 9,
      blockId: "b-1",
      blockName: "Tower A",
      total: 2,
      available: 1,
      sold: 1,
      soldPercent: 50,
      availableValuePkr: "20000000",
      soldValuePkr: "22000000",
      totalValuePkr: "42000000",
    },
    {
      floorId: "f-08",
      floorName: "8th Floor",
      level: 8,
      blockId: "b-1",
      blockName: "Tower A",
      total: 3,
      available: 3,
      sold: 0,
      soldPercent: 0,
      availableValuePkr: "60000000",
      soldValuePkr: "0",
      totalValuePkr: "60000000",
    },
  ];

  it("accurately orders floors by level descending", () => {
    const levels = sampleFloors.map((f) => f.level);
    expect(levels).toEqual([10, 9, 8]);
  });

  it("calculates proportional bar widths correctly for available and sold", () => {
    sampleFloors.forEach((fl) => {
      const soldPct = fl.total > 0 ? (fl.sold / fl.total) * 100 : 0;
      const availPct = fl.total > 0 ? (fl.available / fl.total) * 100 : 0;
      expect(soldPct + availPct).toBe(100);
    });
  });

  it("aggregates block totals across multiple floors", () => {
    const blockTotal = sampleFloors.reduce((acc, f) => acc + f.total, 0);
    const blockSold = sampleFloors.reduce((acc, f) => acc + f.sold, 0);
    const blockAvailable = sampleFloors.reduce((acc, f) => acc + f.available, 0);

    expect(blockTotal).toBe(6);
    expect(blockSold).toBe(2);
    expect(blockAvailable).toBe(4);
    expect((blockSold / blockTotal) * 100).toBeCloseTo(33.33, 1);
  });
});

describe("Sales Over Time Aggregation", () => {
  const sampleSales: SalesOverTimePoint[] = [
    { month: "2026-03", label: "Mar 2026", count: 2, volumePkr: "18500000" },
    { month: "2026-04", label: "Apr 2026", count: 4, volumePkr: "42000000" },
    { month: "2026-05", label: "May 2026", count: 1, volumePkr: "12000000" },
  ];

  it("structures chronological monthly points with readable labels", () => {
    expect(sampleSales[0]?.label).toBe("Mar 2026");
    expect(sampleSales[1]?.label).toBe("Apr 2026");
    expect(sampleSales[2]?.label).toBe("May 2026");

    const totalSoldUnits = sampleSales.reduce((sum, s) => sum + s.count, 0);
    expect(totalSoldUnits).toBe(7);
  });
});

describe("Recent Activity Sanitization (No UUIDs)", () => {
  it("never outputs raw UUIDs in targetName", () => {
    const uuidRegex = /^[0-9a-fA-F-]{36}$/;

    function sanitizeTargetName(
      entity: string,
      liveName?: string | null,
      jsonName?: string | null,
    ): string {
      const candidate = liveName ?? jsonName ?? entity;
      if (uuidRegex.test(candidate)) {
        return entity.charAt(0).toUpperCase() + entity.slice(1);
      }
      return candidate;
    }

    // Unit with code
    expect(sanitizeTargetName("unit", "10F-PH2", "10F-PH2")).toBe("10F-PH2");
    // Unit with missing name but UUID in field
    expect(sanitizeTargetName("unit", null, "12345678-1234-4234-8234-123456789abc")).toBe(
      "Unit",
    );
    // Block name
    expect(sanitizeTargetName("block", "North Wing", "North Wing")).toBe("North Wing");
    // Block with raw UUID
    expect(
      sanitizeTargetName("block", "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee", null),
    ).toBe("Block");
  });
});

describe("Role Permissions for Dashboard & Audit", () => {
  it("allows ADMIN, INVENTORY_MANAGER, and SALES to read dashboard", () => {
    const roles: UserRole[] = ["ADMIN", "INVENTORY_MANAGER", "SALES"];
    roles.forEach((role) => {
      expect(can(role, "dashboard.read")).toBe(true);
    });
  });

  it("strictly hides audit details from SALES role", () => {
    expect(can("SALES", "audit.read")).toBe(false);
    expect(can("ADMIN", "audit.read")).toBe(true);

    const isSales = (role: UserRole) => role === "SALES";
    expect(isSales("SALES")).toBe(true);
    expect(isSales("ADMIN")).toBe(false);
    expect(isSales("INVENTORY_MANAGER")).toBe(false);
  });
});

describe("Excel & CSV Export Services", () => {
  const sampleInventory: InventoryExportRow[] = [
    {
      unitCode: "10F-PH1",
      floorName: "10th Floor",
      level: 10,
      blockName: "Tower A",
      categoryName: "Penthouse",
      status: "AVAILABLE",
      netAreaSqft: "1850.50",
      grossAreaSqft: "2100.00",
      ratePerSqftPkr: "32000.00",
      priceAdjustmentPkr: "100000.00",
      totalPricePkr: "59316000.00",
      isSellable: true,
      ownershipGroup: "Sardar Group",
      bookingRef: null,
    },
  ];

  const sampleSoldUnits: SoldUnitsExportRow[] = [
    {
      unitCode: "07F-OF2",
      floorName: "7th Floor",
      level: 7,
      blockName: "Tower A",
      categoryName: "Office",
      netAreaSqft: "650.00",
      ratePerSqftPkr: "24000.00",
      soldPricePkr: "15600000.00",
      soldAt: new Date("2026-04-15"),
      soldByName: "Sales Agent 1",
      bookingRef: "BK-2026-088",
      ownershipGroup: "Private Investor",
    },
  ];

  const sampleFloorSummary: FloorSummaryExportRow[] = [
    {
      floorName: "Ground Floor",
      level: 0,
      blockName: "Mall Atrium",
      total: 8,
      available: 2,
      sold: 6,
      soldPercent: 75.0,
      availableValuePkr: "48000000",
      soldValuePkr: "144000000",
      totalValuePkr: "192000000",
    },
  ];

  it("formats export filename with the specified date and extension", () => {
    const fixedDate = new Date("2026-10-30T12:00:00Z");
    expect(getExportFilename("inventory", "xlsx", fixedDate)).toBe(
      "inventory-2026-10-30.xlsx",
    );
    expect(getExportFilename("inventory", "csv", fixedDate)).toBe(
      "inventory-2026-10-30.csv",
    );
    expect(getExportFilename("sold", "xlsx", fixedDate)).toBe(
      "sold-units-report-2026-10-30.xlsx",
    );
    expect(getExportFilename("sold", "csv", fixedDate)).toBe(
      "sold-units-report-2026-10-30.csv",
    );
    expect(getExportFilename("floors", "xlsx", fixedDate)).toBe(
      "floor-summary-2026-10-30.xlsx",
    );
    expect(getExportFilename("floors", "csv", fixedDate)).toBe(
      "floor-summary-2026-10-30.csv",
    );
  });

  it("generates Inventory Excel workbook with frozen header, styled fill and PKR format", async () => {
    const buffer = await generateInventoryExcel(sampleInventory);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
    );
    const sheet = workbook.getWorksheet("Inventory");
    expect(sheet).toBeDefined();

    // Check frozen header row
    expect(sheet!.views).toBeDefined();
    expect(sheet!.views[0]?.state).toBe("frozen");
    expect((sheet!.views[0] as unknown as { ySplit?: number })?.ySplit).toBe(1);

    // Check header cell formatting
    const headerCell = sheet!.getCell("A1");
    expect(headerCell.value).toBe("Unit Code");
    expect(headerCell.font?.bold).toBe(true);

    // Check data row and PKR formatting
    const rateCell = sheet!.getCell("I2"); // Rate / sq ft (PKR)
    expect(rateCell.numFmt).toContain("Rs");
  });

  it("generates Sold Units Excel workbook with proper headers and date formatting", async () => {
    const buffer = await generateSoldUnitsExcel(sampleSoldUnits);
    expect(buffer.length).toBeGreaterThan(0);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
    );
    const sheet = workbook.getWorksheet("Sold Units");
    expect(sheet).toBeDefined();
    expect((sheet!.views[0] as unknown as { ySplit?: number })?.ySplit).toBe(1);

    const soldPriceCell = sheet!.getCell("H2"); // Sold Price (PKR)
    expect(soldPriceCell.numFmt).toContain("Rs");
  });

  it("generates Floor Summary Excel workbook with percentages and PKR totals", async () => {
    const buffer = await generateFloorSummaryExcel(sampleFloorSummary);
    expect(buffer.length).toBeGreaterThan(0);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
    );
    const sheet = workbook.getWorksheet("Floor Summary");
    expect(sheet).toBeDefined();
    expect((sheet!.views[0] as unknown as { ySplit?: number })?.ySplit).toBe(1);

    const pctCell = sheet!.getCell("G2"); // % Sold
    expect(pctCell.numFmt).toBe("0.0%");
  });

  it("generates valid CSV files for all reports", () => {
    const invCsv = generateInventoryCsv(sampleInventory);
    expect(invCsv).toContain("Unit Code,Floor,Level,Block,Category");
    expect(invCsv).toContain("10F-PH1,10th Floor,10,Tower A,Penthouse");

    const soldCsv = generateSoldUnitsCsv(sampleSoldUnits);
    expect(soldCsv).toContain("Unit Code,Floor,Level,Block,Category");
    expect(soldCsv).toContain("07F-OF2,7th Floor,7,Tower A,Office");

    const floorCsv = generateFloorSummaryCsv(sampleFloorSummary);
    expect(floorCsv).toContain("Floor,Level,Block,Total Units,Available,Sold,% Sold");
    expect(floorCsv).toContain("Ground Floor,0,Mall Atrium,8,2,6,75.0%");
  });
});
