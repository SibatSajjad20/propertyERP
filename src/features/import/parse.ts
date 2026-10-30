import {
  DECIMAL_PATTERN,
  POSITIVE_DECIMAL_PATTERN,
  UNIT_CODE_PATTERN,
} from "@/features/units/schema";
import {
  floorLabelForLevel,
  normaliseFloorLabel,
} from "@/features/structure/floor-labels";

export type ImportDraftRow = {
  rowNumber: number;
  unitCode: string;
  unitNumber: string;
  floorKey: string;
  categoryName: string;
  netAreaSqft: string;
  grossAreaSqft: string | null;
  ratePerSqftPkr: string;
  priceAdjustmentPkr: string;
  ownershipGroup: string | null;
  subOwner: string | null;
  bookingRef: string | null;
  notes: string | null;
  status: "AVAILABLE" | "SOLD" | null;
  isSellable: boolean | null;
  generatedCode: boolean;
  warnings: string[];
  errors: string[];
  skip: boolean;
};

const HEADER_ALIASES: Record<string, string> = {
  unitcode: "unitCode",
  unit_code: "unitCode",
  code: "unitCode",
  unitnumber: "unitNumber",
  unit_number: "unitNumber",
  unitno: "unitNumber",
  unit: "unitNumber",
  floor: "floor",
  floorname: "floor",
  floor_name: "floor",
  level: "floor",
  category: "category",
  type: "category",
  net: "netAreaSqft",
  netarea: "netAreaSqft",
  net_area: "netAreaSqft",
  netsqft: "netAreaSqft",
  gross: "grossAreaSqft",
  grossarea: "grossAreaSqft",
  gross_area: "grossAreaSqft",
  rate: "ratePerSqftPkr",
  ratepersqft: "ratePerSqftPkr",
  rate_per_sqft: "ratePerSqftPkr",
  adjustment: "priceAdjustmentPkr",
  ownership: "ownershipGroup",
  ownershipgroup: "ownershipGroup",
  subowner: "subOwner",
  status: "status",
  sellable: "isSellable",
  notes: "notes",
  bookingref: "bookingRef",
  booking_ref: "bookingRef",
};

function keyOf(header: unknown): string {
  return String(header ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function cell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function looksLikeSummary(
  unitCode: string,
  unitNumber: string,
  category: string,
): boolean {
  const blob = `${unitCode} ${unitNumber} ${category}`.toLowerCase();
  return (
    blob.includes("total") ||
    blob.includes("summary") ||
    blob.includes("grand") ||
    (unitCode === "" && unitNumber === "")
  );
}

export function mapHeaders(headers: unknown[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((header, index) => {
    const alias = HEADER_ALIASES[keyOf(header)];
    if (alias) {
      map[alias] = index;
    }
  });
  return map;
}

export function parseImportGrid(grid: unknown[][]): ImportDraftRow[] {
  if (grid.length === 0) {
    return [];
  }
  const headerRow = grid[0] ?? [];
  const columns = mapHeaders(headerRow);
  const drafts: ImportDraftRow[] = [];

  grid.slice(1).forEach((raw, offset) => {
    const rowNumber = offset + 2;
    const get = (name: string) =>
      columns[name] === undefined ? "" : cell(raw[columns[name] as number]);

    let unitCode = get("unitCode").toUpperCase();
    const unitNumber = get("unitNumber");
    const floorRaw = get("floor");
    const categoryName = get("category");
    const netAreaSqft = get("netAreaSqft");
    const grossRaw = get("grossAreaSqft");
    const ratePerSqftPkr = get("ratePerSqftPkr");
    const priceAdjustmentPkr = get("priceAdjustmentPkr") || "0";
    const ownershipGroup = get("ownershipGroup") || null;
    const subOwner = get("subOwner") || null;
    const bookingRef = get("bookingRef") || null;
    const notes = get("notes") || null;
    const statusRaw = get("status").toUpperCase();
    const sellableRaw = get("isSellable").toLowerCase();

    const warnings: string[] = [];
    const errors: string[] = [];
    let generatedCode = false;
    let skip = false;

    if (looksLikeSummary(unitCode, unitNumber, categoryName)) {
      skip = true;
    }

    if (!skip && (unitCode === "-" || unitCode === "")) {
      const level = Number.parseInt(floorRaw.replace(/\D/g, ""), 10);
      const floorBit = Number.isFinite(level)
        ? floorLabelForLevel(level).replace(/\s+/g, "")
        : normaliseFloorLabel(floorRaw).replace(/\s+/g, "") || "U";
      unitCode = `${floorBit}-${unitNumber || `R${rowNumber}`}`
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, "");
      generatedCode = true;
      warnings.push(`Row ${rowNumber}: generated unit code ${unitCode}.`);
    }

    if (!skip) {
      if (!UNIT_CODE_PATTERN.test(unitCode)) {
        errors.push(`Row ${rowNumber}: unit code ${unitCode} is invalid.`);
      }
      if (!unitNumber) {
        errors.push(`Row ${rowNumber}: unit number is required.`);
      }
      if (!floorRaw) {
        errors.push(`Row ${rowNumber}: floor is required.`);
      }
      if (!categoryName) {
        errors.push(`Row ${rowNumber}: category is required.`);
      }
      if (!POSITIVE_DECIMAL_PATTERN.test(netAreaSqft)) {
        errors.push(`Row ${rowNumber}: net area must be a decimal string.`);
      }
      if (grossRaw && !POSITIVE_DECIMAL_PATTERN.test(grossRaw)) {
        errors.push(`Row ${rowNumber}: gross area must be a decimal string.`);
      }
      if (!POSITIVE_DECIMAL_PATTERN.test(ratePerSqftPkr)) {
        errors.push(`Row ${rowNumber}: rate must be a decimal string.`);
      }
      if (!DECIMAL_PATTERN.test(priceAdjustmentPkr)) {
        errors.push(`Row ${rowNumber}: adjustment must be a decimal string.`);
      }
      if (grossRaw && Number(grossRaw) < Number(netAreaSqft)) {
        warnings.push(`Row ${rowNumber}: gross area is less than net area.`);
      }
    }

    const status =
      statusRaw === "SOLD" ? "SOLD" : statusRaw === "AVAILABLE" ? "AVAILABLE" : null;
    const isSellable =
      sellableRaw === "yes" || sellableRaw === "true"
        ? true
        : sellableRaw === "no" || sellableRaw === "false"
          ? false
          : null;

    drafts.push({
      rowNumber,
      unitCode,
      unitNumber,
      floorKey: floorRaw,
      categoryName,
      netAreaSqft,
      grossAreaSqft: grossRaw || null,
      ratePerSqftPkr,
      priceAdjustmentPkr,
      ownershipGroup,
      subOwner,
      bookingRef,
      notes,
      status,
      isSellable,
      generatedCode,
      warnings,
      errors,
      skip,
    });
  });

  return drafts;
}
