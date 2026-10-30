import { normaliseFloorLabel } from "@/features/structure/floor-labels";
import type { CleanedImportRow, ColumnMapping } from "./types";

/**
 * Derives floor prefix for unit code generation (e.g. 6 -> "6F", 0 -> "GF").
 */
export function getFloorPrefix(floorName: string): string {
  const norm = normaliseFloorLabel(floorName);
  if (!norm) return "GF";
  if (norm.toLowerCase() === "ground" || norm.toLowerCase() === "g") {
    return "GF";
  }
  const match = norm.match(/^(\d+)/);
  if (match?.[1]) {
    return `${match[1]}F`;
  }
  return norm.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Trims and uppercases unit code (e.g. " 6f-ra33 " -> "6F-RA33").
 * If missing, empty, or "-", generates a code from floor + unit number.
 */
export function cleanUnitCode(
  code: unknown,
  context?: { floorName?: string; unitNumber?: string },
): string {
  if (typeof code === "string") {
    const trimmed = code.trim().toUpperCase();
    if (trimmed && trimmed !== "-" && trimmed !== "N/A" && trimmed !== "NULL") {
      return trimmed;
    }
  }

  // Auto-generate code from floor + unitNumber if available
  const unitNum = context?.unitNumber
    ? String(context.unitNumber).trim().toUpperCase()
    : "";
  if (unitNum) {
    const prefix = context?.floorName ? getFloorPrefix(context.floorName) : "GF";
    return `${prefix}-${unitNum}`;
  }

  return "";
}

/**
 * Normalises floor names (e.g. "Ground", "1st", "First", "Level 1" -> canonical floor name).
 */
export function cleanFloorName(floor: unknown): string {
  if (floor === null || floor === undefined) return "";
  const str = String(floor).trim();
  if (!str) return "";
  return normaliseFloorLabel(str);
}

/**
 * Strips commas, currency symbols ("Rs", "PKR", etc.) and converts to decimal string.
 * Rejects invalid non-numeric strings or infinite values.
 */
export function cleanMoneyNumber(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value.toFixed(2);
  }

  let str = String(value).trim();
  if (!str) return null;

  // Remove currency signs, "Rs", "PKR", commas, slashes, whitespace
  str = str
    .replace(/(?:rs\.?|pkr|₨|\$)/gi, "")
    .replace(/,/g, "")
    .replace(/[\s\/-]+$/g, "")
    .replace(/^[\s\/-]+/g, "")
    .trim();

  if (!str) return null;

  const num = Number(str);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return null;
  }

  return num.toFixed(2);
}

/**
 * Cleans net or gross area: strips commas, "sq ft", spaces, and formats as decimal.
 */
export function cleanArea(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value.toFixed(2);
  }

  let str = String(value).trim();
  if (!str) return null;

  str = str
    .replace(/(?:sq\.?\s*ft\.?|sqft|sft)/gi, "")
    .replace(/,/g, "")
    .trim();

  if (!str) return null;

  const num = Number(str);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return null;
  }

  return num.toFixed(2);
}

/**
 * Maps status text to AVAILABLE or SOLD only.
 * Returns null if unrecognized text.
 */
export function cleanStatus(value: unknown): "AVAILABLE" | "SOLD" | null {
  if (value === null || value === undefined) return "AVAILABLE";
  const str = String(value).trim().toUpperCase();
  if (!str) return "AVAILABLE";

  if (
    str === "AVAILABLE" ||
    str === "AVAIL" ||
    str === "VACANT" ||
    str === "OPEN" ||
    str === "UNSOLD"
  ) {
    return "AVAILABLE";
  }

  if (str === "SOLD" || str === "BOOKED" || str === "CLOSED") {
    return "SOLD";
  }

  return null;
}

/**
 * Determines sellable status based on category name.
 * Meeting Room and Amenities are not sellable by default.
 */
export function isSellableCategory(categoryName: string): boolean {
  const norm = categoryName.trim().toLowerCase();
  if (norm.includes("amenit") || norm.includes("meeting")) {
    return false;
  }
  return true;
}

/**
 * Normalises category name. Defaults to "Shop".
 */
export function cleanCategoryName(value: unknown): string {
  if (value === null || value === undefined) return "Shop";
  const str = String(value).trim();
  if (!str) return "Shop";

  const lower = str.toLowerCase();
  if (lower.includes("food")) return "Food Court";
  if (lower.includes("kiosk")) return "Kiosk";
  if (lower.includes("office")) return "Office";
  if (lower.includes("amenit")) return "Amenities";
  if (lower.includes("meeting")) return "Meeting Room";
  if (lower.includes("shop") || lower.includes("retail")) return "Shop";

  return str;
}

/**
 * Checks if a row is completely blank or a summary / total row that should be ignored.
 */
export function isSummaryOrBlankRow(row: Record<string, unknown>): boolean {
  const values = Object.values(row)
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
    .map((v) => String(v).trim().toLowerCase());

  if (values.length === 0) return true;

  const summaryKeywords = ["total", "grand total", "summary", "subtotal", "sub total"];
  return values.some((val) =>
    summaryKeywords.some((k) => val === k || val.startsWith(`${k}:`)),
  );
}

/**
 * Cleans a raw spreadsheet row into a structured CleanedImportRow.
 */
export function cleanRow(
  raw: Record<string, unknown>,
  mapping: ColumnMapping,
  rowIndex: number,
): CleanedImportRow {
  const getMapped = (key: keyof ColumnMapping): unknown => {
    const colName = mapping[key];
    return colName ? raw[colName] : undefined;
  };

  const rawUnitNumber = getMapped("unitNumber");
  const unitNumber =
    rawUnitNumber !== undefined && rawUnitNumber !== null
      ? String(rawUnitNumber).trim().toUpperCase()
      : "";

  const rawFloor = getMapped("floor");
  const floorName = cleanFloorName(rawFloor);

  const rawBlock = getMapped("block");
  const blockName = rawBlock ? String(rawBlock).trim() : "Main";

  const rawUnitCode = getMapped("unitCode");
  const unitCode = cleanUnitCode(rawUnitCode, { floorName, unitNumber });

  const rawCategory = getMapped("category");
  const categoryName = cleanCategoryName(rawCategory);

  const rawNetArea = getMapped("netAreaSqft");
  const netAreaSqft = cleanArea(rawNetArea) ?? "";

  const rawGrossArea = getMapped("grossAreaSqft");
  const grossAreaSqft = cleanArea(rawGrossArea);

  const rawRate = getMapped("ratePerSqftPkr");
  const ratePerSqftPkr = cleanMoneyNumber(rawRate) ?? "";

  const rawStatus = getMapped("status");
  const status = cleanStatus(rawStatus) ?? "AVAILABLE";

  const rawSoldPrice = getMapped("soldPricePkr");
  const soldPricePkr = cleanMoneyNumber(rawSoldPrice);

  const rawBuyer = getMapped("buyer");
  const buyer = rawBuyer ? String(rawBuyer).trim() : null;

  const rawNotes = getMapped("notes");
  const notes = rawNotes ? String(rawNotes).trim() : null;

  const isSellable = isSellableCategory(categoryName);

  return {
    rowIndex,
    unitCode,
    unitNumber,
    floorName,
    blockName: blockName || "Main",
    categoryName,
    netAreaSqft,
    grossAreaSqft,
    ratePerSqftPkr,
    status,
    buyer,
    soldPricePkr,
    notes,
    isSellable,
    originalRow: raw,
  };
}
