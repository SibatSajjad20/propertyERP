import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseSpreadsheetBuffer } from "@/features/import/excel";
import { IMPORT_CHUNK_SIZE } from "@/features/import/types";
import {
  detectHeaderMapping,
  validateImportBatch,
  type ImportDbContext,
} from "@/features/import/validation";

const HEADERS = [
  "Unique Unit #",
  "Unit No",
  "Floor",
  "Category",
  "Net Area",
  "Gross Area",
  "Rate",
  "Status",
  "Ownership-1",
  "Sub Ownership-2",
];

function inventoryContext(): ImportDbContext {
  const floors = Array.from({ length: 11 }, (_, level) => ({
    id: `f${level}`,
    name:
      level === 0
        ? "Ground"
        : `${level}${level === 1 ? "st" : level === 2 ? "nd" : level === 3 ? "rd" : "th"}`,
    blockId: "b1",
    blockName: "Main",
    level,
  }));
  return {
    propertyId: "prop-1",
    blocks: [{ id: "b1", name: "Main" }],
    floors,
    categories: [
      { id: "c1", name: "Shop", isSellableDefault: true },
      { id: "c2", name: "Amenities", isSellableDefault: false },
    ],
    existingUnits: [],
    actorRole: "ADMIN",
  };
}

function buildInventoryRows(count: number): unknown[][] {
  const rows: unknown[][] = [HEADERS];
  for (let i = 0; i < count; i++) {
    const floorLevel = i % 11;
    const floor =
      floorLevel === 0 ? (i % 5 === 0 ? "Ground-Floor" : "GF") : `${floorLevel}th Floor`;
    const isAmenity = i % 40 === 0;
    const unique = isAmenity ? "-" : `U${String(i).padStart(4, "0")}`;
    const unitNo = isAmenity ? "-" : `N${i}`;
    const category = isAmenity
      ? "Amenities"
      : i % 17 === 0
        ? "1-BED"
        : i % 19 === 0
          ? "Food Outlets"
          : "Shop";
    const status = isAmenity ? "Amenities" : i % 23 === 0 ? "SOLD" : "AVAILABLE";
    const gross = i % 11 === 0 ? "0" : "300";
    rows.push([
      unique,
      unitNo,
      floor,
      category,
      "250",
      gross,
      "18500",
      status,
      i % 9 === 0 ? "Owner A" : "",
      i % 9 === 0 ? "Sub B" : "",
    ]);
  }
  return rows;
}

function workbookBuffer(sheets: Array<{ name: string; rows: unknown[][] }>): Buffer {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

describe("multi-sheet inventory import", () => {
  it("picks Inventory List from a 3-sheet workbook, parses 368 rows, and counts sum to 368", () => {
    const formSheet = [
      ["Sardar's Mall", "Unit form"],
      ["Printed on", "2026-01-01"],
    ];
    const inventory = buildInventoryRows(368);
    const summary = [
      ["SUBTOTAL", "368"],
      ["Grand Total", "1"],
    ];
    const buffer = workbookBuffer([
      { name: "Cover", rows: formSheet },
      { name: "Inventory List", rows: inventory },
      { name: "Totals", rows: summary },
    ]);

    const parsed = parseSpreadsheetBuffer(buffer, "sardars.xlsx");
    expect(parsed.sheetName).toBe("Inventory List");
    expect(parsed.dataRows).toBe(368);

    const mapping = detectHeaderMapping(parsed.headers);
    expect(mapping.unitCode).toBe("Unique Unit #");
    expect(mapping.buyer).toBe("Ownership-1");
    expect(mapping.subOwner).toBe("Sub Ownership-2");

    const result = validateImportBatch(
      parsed.rawRows,
      mapping,
      inventoryContext(),
      "UPSERT",
      { createMissingStructure: true },
    );

    expect(
      result.validCount + result.warningCount + result.errorCount + result.skippedCount,
    ).toBe(368);
    expect(result.validCount + result.warningCount).toBeGreaterThanOrEqual(324);
  });

  it("parses and validates a 5000-row sheet under 5s and chunks at 250", () => {
    const started = performance.now();
    const buffer = workbookBuffer([
      { name: "Inventory List", rows: buildInventoryRows(5000) },
    ]);
    const parsed = parseSpreadsheetBuffer(buffer, "large.xlsx");
    const mapping = detectHeaderMapping(parsed.headers);
    const result = validateImportBatch(
      parsed.rawRows,
      mapping,
      inventoryContext(),
      "CREATE_AND_UPDATE",
      { createMissingStructure: true },
    );
    const elapsed = performance.now() - started;
    expect(parsed.dataRows).toBe(5000);
    expect(
      result.validCount + result.warningCount + result.errorCount + result.skippedCount,
    ).toBe(5000);
    expect(elapsed).toBeLessThan(5000);
    expect(Math.ceil(5000 / IMPORT_CHUNK_SIZE)).toBe(20);
  });
});
