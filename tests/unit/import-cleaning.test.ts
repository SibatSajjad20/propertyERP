import { describe, expect, it } from "vitest";
import {
  cleanArea,
  cleanCategoryName,
  cleanFloorName,
  cleanMoneyNumber,
  cleanRow,
  cleanStatus,
  cleanUnitCode,
  getFloorPrefix,
  isSellableCategory,
  isSummaryOrBlankRow,
} from "@/features/import/cleaning";
import {
  detectHeaderMapping,
  validateImportBatch,
  validateRow,
  type ImportDbContext,
} from "@/features/import/validation";
import type { ColumnMapping } from "@/features/import/types";

describe("Import cleaning rules", () => {
  describe("cleanUnitCode", () => {
    it("trims and uppercases unit codes", () => {
      expect(cleanUnitCode(" 6f-ra33 ")).toBe("6F-RA33");
      expect(cleanUnitCode("gf-s12")).toBe("GF-S12");
      expect(cleanUnitCode("10f-ph2")).toBe("10F-PH2");
    });

    it("auto-generates unit code from floor and unit number if missing or '-'", () => {
      expect(cleanUnitCode("-", { floorName: "6th", unitNumber: "ra33" })).toBe(
        "6F-RA33",
      );
      expect(cleanUnitCode("", { floorName: "Ground", unitNumber: "s12" })).toBe(
        "GF-S12",
      );
      expect(cleanUnitCode(null, { floorName: "1st", unitNumber: "k08" })).toBe("1F-K08");
      expect(cleanUnitCode("N/A", { floorName: "10th", unitNumber: "ph2" })).toBe(
        "10F-PH2",
      );
    });

    it("handles getFloorPrefix properly for levels", () => {
      expect(getFloorPrefix("Ground")).toBe("GF");
      expect(getFloorPrefix("ground")).toBe("GF");
      expect(getFloorPrefix("1st")).toBe("1F");
      expect(getFloorPrefix("6th")).toBe("6F");
      expect(getFloorPrefix("10th")).toBe("10F");
    });
  });

  describe("cleanFloorName", () => {
    it("normalises various floor name representations", () => {
      expect(cleanFloorName("Ground")).toBe("Ground");
      expect(cleanFloorName("ground")).toBe("Ground");
      expect(cleanFloorName("Level 0")).toBe("Ground");
      expect(cleanFloorName("1st")).toBe("1st");
      expect(cleanFloorName("First")).toBe("1st");
      expect(cleanFloorName("Level 1")).toBe("1st");
      expect(cleanFloorName("sixth floor")).toBe("6th");
      expect(cleanFloorName("6th")).toBe("6th");
    });
  });

  describe("cleanMoneyNumber", () => {
    it("strips commas, currency markers (Rs, PKR, etc.) and formats as decimal string", () => {
      expect(cleanMoneyNumber("Rs 25,00,000")).toBe("2500000.00");
      expect(cleanMoneyNumber("Rs. 18,500.00")).toBe("18500.00");
      expect(cleanMoneyNumber("PKR 49,02,500/-")).toBe("4902500.00");
      expect(cleanMoneyNumber(" 18500 ")).toBe("18500.00");
      expect(cleanMoneyNumber(25000)).toBe("25000.00");
      expect(cleanMoneyNumber("0")).toBe("0.00");
    });

    it("returns null for non-numeric or empty values", () => {
      expect(cleanMoneyNumber("")).toBeNull();
      expect(cleanMoneyNumber(null)).toBeNull();
      expect(cleanMoneyNumber("invalid")).toBeNull();
    });
  });

  describe("cleanArea", () => {
    it("strips commas, sqft units and formats area as decimal string", () => {
      expect(cleanArea("265.00 sq ft")).toBe("265.00");
      expect(cleanArea("1,080.00 sqft")).toBe("1080.00");
      expect(cleanArea("420")).toBe("420.00");
      expect(cleanArea(null)).toBeNull();
    });
  });

  describe("cleanStatus", () => {
    it("maps recognized status values to AVAILABLE or SOLD", () => {
      expect(cleanStatus("AVAILABLE")).toBe("AVAILABLE");
      expect(cleanStatus("available")).toBe("AVAILABLE");
      expect(cleanStatus("avail")).toBe("AVAILABLE");
      expect(cleanStatus("vacant")).toBe("AVAILABLE");
      expect(cleanStatus("open")).toBe("AVAILABLE");
      expect(cleanStatus("")).toBe("AVAILABLE");
      expect(cleanStatus(null)).toBe("AVAILABLE");

      expect(cleanStatus("SOLD")).toBe("SOLD");
      expect(cleanStatus("sold")).toBe("SOLD");
      expect(cleanStatus("booked")).toBe("SOLD");
      expect(cleanStatus("closed")).toBe("SOLD");
    });

    it("returns null for invalid status values", () => {
      expect(cleanStatus("PENDING")).toBeNull();
      expect(cleanStatus("RESERVED_CUSTOM")).toBeNull();
    });
  });

  describe("category and summary row rules", () => {
    it("marks Amenities and Meeting Room as not sellable", () => {
      expect(isSellableCategory("Amenities")).toBe(false);
      expect(isSellableCategory("Meeting Room")).toBe(false);
      expect(isSellableCategory("Shop")).toBe(true);
      expect(isSellableCategory("Food Court")).toBe(true);
    });

    it("identifies summary or blank rows", () => {
      expect(isSummaryOrBlankRow({ col1: "Total", col2: "" })).toBe(true);
      expect(isSummaryOrBlankRow({ col1: "Grand Total: 368", col2: "" })).toBe(true);
      expect(isSummaryOrBlankRow({ col1: "", col2: "" })).toBe(true);
      expect(isSummaryOrBlankRow({ col1: "6F-RA33", col2: "Shop" })).toBe(false);
    });

    it("cleanCategoryName maps standard asset classes", () => {
      expect(cleanCategoryName("retail")).toBe("Shop");
      expect(cleanCategoryName("food")).toBe("Food Court");
      expect(cleanCategoryName("kiosk")).toBe("Kiosk");
      expect(cleanCategoryName("office")).toBe("Office");
    });
  });
});

describe("Header auto-detection", () => {
  it("auto-detects headers from typical spreadsheet variants", () => {
    const headers = [
      "Unit Code",
      "Unit No",
      "Floor Name",
      "Block",
      "Asset Class",
      "Net Area (sq ft)",
      "Gross Area (sq ft)",
      "Rate (PKR)",
      "Availability",
      "Sold Price (PKR)",
      "Customer",
      "Remarks",
    ];

    const mapping = detectHeaderMapping(headers);

    expect(mapping.unitCode).toBe("Unit Code");
    expect(mapping.unitNumber).toBe("Unit No");
    expect(mapping.floor).toBe("Floor Name");
    expect(mapping.block).toBe("Block");
    expect(mapping.category).toBe("Asset Class");
    expect(mapping.netAreaSqft).toBe("Net Area (sq ft)");
    expect(mapping.grossAreaSqft).toBe("Gross Area (sq ft)");
    expect(mapping.ratePerSqftPkr).toBe("Rate (PKR)");
    expect(mapping.status).toBe("Availability");
    expect(mapping.soldPricePkr).toBe("Sold Price (PKR)");
    expect(mapping.buyer).toBe("Customer");
    expect(mapping.notes).toBe("Remarks");
  });
});

describe("Row and batch validation rules", () => {
  const dummyContext: ImportDbContext = {
    propertyId: "prop-1",
    blocks: [{ id: "b1", name: "Main" }],
    floors: [
      { id: "f0", name: "Ground", blockId: "b1", blockName: "Main", level: 0 },
      { id: "f1", name: "1st", blockId: "b1", blockName: "Main", level: 1 },
      { id: "f5", name: "5th", blockId: "b1", blockName: "Main", level: 5 },
      { id: "f6", name: "6th", blockId: "b1", blockName: "Main", level: 6 },
    ],
    categories: [
      { id: "c1", name: "Shop", isSellableDefault: true },
      { id: "c2", name: "Amenities", isSellableDefault: false },
    ],
    existingUnits: [
      {
        id: "u-ra33",
        unitCode: "6F-RA33",
        unitNumber: "RA33",
        floorId: "f6",
        floorName: "6th",
        blockName: "Main",
        status: "AVAILABLE",
        netAreaSqft: "265.00",
        ratePerSqftPkr: "18500.00",
        priceAdjustmentPkr: "0.00",
        grossAreaSqft: "290.00",
        version: 1,
        isSellable: true,
      },
    ],
    actorRole: "ADMIN",
  };

  const defaultMapping: ColumnMapping = {
    unitCode: "Unit Code",
    unitNumber: "Unit No",
    floor: "Floor",
    block: "Block",
    category: "Category",
    netAreaSqft: "Net Area",
    grossAreaSqft: "Gross Area",
    ratePerSqftPkr: "Rate",
    status: "Status",
    buyer: "Buyer",
    soldPricePkr: "Sold Price",
    notes: "Notes",
  };

  it("marks a fully valid row as VALID", () => {
    const raw = {
      "Unit Code": "6F-RA35",
      "Unit No": "RA35",
      Floor: "6th",
      Block: "Main",
      Category: "Shop",
      "Net Area": "248.00",
      "Gross Area": "270.00",
      Rate: "18500.00",
      Status: "AVAILABLE",
      Buyer: "",
      "Sold Price": "",
      Notes: "Clean unit",
    };

    const cleaned = cleanRow(raw, defaultMapping, 0);
    const validated = validateRow(
      cleaned,
      raw,
      defaultMapping,
      dummyContext,
      "CREATE_ONLY",
      new Map(),
      new Map(),
    );

    expect(validated.status).toBe("VALID");
    expect(validated.errors).toHaveLength(0);
  });

  it("flags SOLD rows with no sold price as ERROR", () => {
    const raw = {
      "Unit Code": "6F-RA36",
      "Unit No": "RA36",
      Floor: "6th",
      Block: "Main",
      Category: "Shop",
      "Net Area": "250.00",
      Rate: "18500.00",
      Status: "SOLD",
      "Sold Price": "", // Missing sold price
    };

    const cleaned = cleanRow(raw, defaultMapping, 0);
    const validated = validateRow(
      cleaned,
      raw,
      defaultMapping,
      dummyContext,
      "CREATE_ONLY",
      new Map(),
      new Map(),
    );

    expect(validated.status).toBe("ERROR");
    expect(validated.errors.some((e) => e.includes("sold price"))).toBe(true);
  });

  it("flags conflicting data like 6F-RA33 with 5th floor", () => {
    const raw = {
      "Unit Code": "6F-RA33",
      "Unit No": "RA33",
      Floor: "5th", // Conflicts with 6F- prefix
      Block: "Main",
      Category: "Shop",
      "Net Area": "265.00",
      Rate: "18500.00",
      Status: "AVAILABLE",
    };

    const cleaned = cleanRow(raw, defaultMapping, 0);
    const validated = validateRow(
      cleaned,
      raw,
      defaultMapping,
      dummyContext,
      "CREATE_ONLY",
      new Map(),
      new Map(),
    );

    expect(validated.status).toBe("ERROR");
    expect(validated.errors.some((e) => e.includes("conflicts with floor"))).toBe(true);
  });

  it("flags duplicate unit codes within the import file", () => {
    const rows = [
      {
        "Unit Code": "1F-K08",
        "Unit No": "K08",
        Floor: "1st",
        Block: "Main",
        Category: "Shop",
        "Net Area": "100.00",
        Rate: "20000.00",
        Status: "AVAILABLE",
      },
      {
        "Unit Code": "1F-K08", // Duplicate in file
        "Unit No": "K08",
        Floor: "1st",
        Block: "Main",
        Category: "Shop",
        "Net Area": "100.00",
        Rate: "20000.00",
        Status: "AVAILABLE",
      },
    ];

    const result = validateImportBatch(rows, defaultMapping, dummyContext, "CREATE_ONLY");

    expect(result.errorCount).toBe(1);
    expect(result.rows[1]?.errors.some((e) => e.includes("Duplicate unit code"))).toBe(
      true,
    );
  });

  it("flags non-existent block or floor", () => {
    const raw = {
      "Unit Code": "XF-U1",
      "Unit No": "U1",
      Floor: "99th", // Non-existent
      Block: "Tower Z", // Non-existent
      Category: "Shop",
      "Net Area": "100.00",
      Rate: "20000.00",
      Status: "AVAILABLE",
    };

    const cleaned = cleanRow(raw, defaultMapping, 0);
    const validated = validateRow(
      cleaned,
      raw,
      defaultMapping,
      dummyContext,
      "CREATE_ONLY",
      new Map(),
      new Map(),
    );

    expect(validated.status).toBe("ERROR");
    expect(
      validated.errors.some((e) => e.includes('Block "Tower Z" does not exist')),
    ).toBe(true);
  });

  it("records WARNING when gross area is less than net area", () => {
    const raw = {
      "Unit Code": "6F-RA40",
      "Unit No": "RA40",
      Floor: "6th",
      Block: "Main",
      Category: "Shop",
      "Net Area": "300.00",
      "Gross Area": "250.00", // gross < net
      Rate: "18500.00",
      Status: "AVAILABLE",
    };

    const cleaned = cleanRow(raw, defaultMapping, 0);
    const validated = validateRow(
      cleaned,
      raw,
      defaultMapping,
      dummyContext,
      "CREATE_ONLY",
      new Map(),
      new Map(),
    );

    expect(validated.status).toBe("WARNING");
    expect(validated.warnings.some((w) => w.includes("less than net area"))).toBe(true);
  });
});
