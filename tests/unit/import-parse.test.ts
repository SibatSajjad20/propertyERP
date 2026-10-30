import { describe, expect, it } from "vitest";
import { parseImportGrid } from "@/features/import/parse";

describe("import parse", () => {
  it("skips totals and generates codes for blank unit codes", () => {
    const rows = parseImportGrid([
      ["Unit code", "Unit number", "Floor", "Category", "Net area", "Rate"],
      ["", "S99", "Ground", "Shop", "100.00", "25000.00"],
      ["", "", "", "Total", "", ""],
    ]);
    const live = rows.filter((row) => !row.skip);
    expect(live).toHaveLength(1);
    expect(live[0]?.generatedCode).toBe(true);
    expect(live[0]?.unitCode).toMatch(/S99/);
    expect(rows.some((row) => row.skip)).toBe(true);
  });

  it("warns when gross is less than net", () => {
    const rows = parseImportGrid([
      ["Code", "Unit", "Floor", "Category", "Net", "Gross", "Rate"],
      ["GF-S1", "S1", "Ground", "Shop", "100.00", "80.00", "20000.00"],
    ]);
    expect(rows[0]?.errors).toEqual([]);
    expect(rows[0]?.warnings.some((item) => item.includes("gross"))).toBe(true);
  });
});
