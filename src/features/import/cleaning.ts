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

function isPlaceholderCode(value: string): boolean {
  const trimmed = value.trim().toUpperCase();
  return !trimmed || trimmed === "-" || trimmed === "N/A" || trimmed === "NULL";
}

/**
 * Trims and uppercases unit code (e.g. " 6f-ra33 " -> "6F-RA33").
 * If missing, empty, or "-", generates a code from floor + unit number / row.
 */
export function cleanUnitCode(
  code: unknown,
  context?: { floorName?: string; unitNumber?: string; rowIndex?: number },
): { unitCode: string; generated: boolean } {
  if (typeof code === "string" && !isPlaceholderCode(code)) {
    return { unitCode: code.trim().toUpperCase(), generated: false };
  }

  const unitNumRaw = context?.unitNumber
    ? String(context.unitNumber).trim().toUpperCase()
    : "";
  const unitNum = isPlaceholderCode(unitNumRaw)
    ? `X${(context?.rowIndex ?? 0) + 1}`
    : unitNumRaw;
  if (unitNum) {
    const prefix = context?.floorName ? getFloorPrefix(context.floorName) : "GF";
    return { unitCode: `${prefix}-${unitNum}`, generated: true };
  }

  return { unitCode: "", generated: false };
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

  str = str
    .replace(/(?:rs\.?|pkr|₨|\$)/gi, "")
    .replace(/,/g, "")
    .replace(/[\s/-]+$/g, "")
    .replace(/^[\s/-]+/g, "")
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
 * Zero gross/net is treated as empty so it does not warn as gross < net.
 */
export function cleanArea(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value === 0) return null;
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
  if (Number.isNaN(num) || !Number.isFinite(num) || num === 0) {
    return null;
  }

  return num.toFixed(2);
}

function looksLikeAmenityStatus(value: string): boolean {
  const lower = value.trim().toLowerCase();
  return lower.includes("amenit") || lower.includes("meeting");
}

/**
 * Maps status text to AVAILABLE or SOLD.
 * Amenities / Meeting Room are treated as AVAILABLE (not sellable) by the caller.
 * Returns null if unrecognized text.
 */
export function cleanStatus(value: unknown): "AVAILABLE" | "SOLD" | null {
  if (value === null || value === undefined) return "AVAILABLE";
  const str = String(value).trim();
  if (!str) return "AVAILABLE";
  if (looksLikeAmenityStatus(str)) return "AVAILABLE";

  const upper = str.toUpperCase();
  if (
    upper === "AVAILABLE" ||
    upper === "AVAIL" ||
    upper === "VACANT" ||
    upper === "OPEN" ||
    upper === "UNSOLD"
  ) {
    return "AVAILABLE";
  }

  if (upper === "SOLD" || upper === "BOOKED" || upper === "CLOSED") {
    return "SOLD";
  }

  return null;
}

export function isAmenityStatusLabel(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  return looksLikeAmenityStatus(String(value));
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
 * Normalises well-known category names. Unknown values are kept as-is
 * (never silently rewritten to Shop).
 */
export function cleanCategoryName(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  if (!str) return "";

  const lower = str.toLowerCase();
  if (lower === "food court" || lower === "foodcourt") return "Food Court";
  if (lower.includes("kiosk")) return "Kiosk";
  if (lower === "office" || lower.includes("office")) return "Office";
  if (lower.includes("amenit")) return "Amenities";
  if (lower.includes("meeting")) return "Meeting Room";
  if (lower === "shop" || lower === "retail" || lower.includes("shop")) return "Shop";

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
    summaryKeywords.some(
      (k) => val === k || val.startsWith(`${k}:`) || val.startsWith(`${k} `),
    ),
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
  const unitNumberRaw =
    rawUnitNumber !== undefined && rawUnitNumber !== null
      ? String(rawUnitNumber).trim().toUpperCase()
      : "";
  const unitNumber = isPlaceholderCode(unitNumberRaw)
    ? `X${rowIndex + 1}`
    : unitNumberRaw;

  const rawFloor = getMapped("floor");
  const floorName = cleanFloorName(rawFloor);

  const rawBlock = getMapped("block");
  const blockName = rawBlock ? String(rawBlock).trim() : "Main";

  const rawUnitCode = getMapped("unitCode");
  const { unitCode, generated } = cleanUnitCode(rawUnitCode, {
    floorName,
    unitNumber,
    rowIndex,
  });

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

  const rawSubOwner = getMapped("subOwner");
  const subOwner = rawSubOwner ? String(rawSubOwner).trim() : null;

  const rawNotes = getMapped("notes");
  const notes = rawNotes ? String(rawNotes).trim() : null;

  const amenityStatus = isAmenityStatusLabel(rawStatus);
  const isSellable = isSellableCategory(categoryName) && !amenityStatus;

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
    subOwner,
    soldPricePkr,
    notes,
    isSellable,
    generatedUnitCode: generated,
    originalRow: raw,
  };
}
