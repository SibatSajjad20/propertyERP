import type { UserRole } from "@/db/schema/enums";
import {
  cleanMoneyNumber,
  cleanRow,
  cleanStatus,
  getFloorPrefix,
  isSummaryOrBlankRow,
} from "./cleaning";
import type {
  CleanedImportRow,
  ColumnMapping,
  ImportColumnKey,
  ImportMode,
  ImportValidationResult,
  ValidatedImportRow,
} from "./types";

export interface ExistingUnitContext {
  id: string;
  unitCode: string;
  unitNumber: string;
  floorId: string;
  floorName: string;
  blockName: string;
  status: "AVAILABLE" | "SOLD";
  netAreaSqft: string;
  ratePerSqftPkr: string;
  priceAdjustmentPkr: string;
  grossAreaSqft: string | null;
  version: number;
  isSellable: boolean;
}

export interface ImportDbContext {
  propertyId: string;
  blocks: { id: string; name: string }[];
  floors: {
    id: string;
    name: string;
    blockId: string;
    blockName: string;
    level: number;
  }[];
  categories: { id: string; name: string; isSellableDefault: boolean }[];
  existingUnits: ExistingUnitContext[];
  actorRole: UserRole;
}

const ALIASES: Record<ImportColumnKey, string[]> = {
  unitNumber: ["unit no", "unit_no", "unit number", "unit #", "unitno", "unit"],
  unitCode: ["unit code", "unit_code", "code", "flat no", "shop no"],
  floor: ["floor", "floor name", "level", "storey"],
  block: ["block", "block name", "tower", "building", "phase"],
  category: ["category", "type", "unit type", "asset class"],
  netAreaSqft: [
    "net area",
    "area",
    "net sqft",
    "area (sq ft)",
    "net area sqft",
    "area sqft",
    "sqft",
    "size",
  ],
  grossAreaSqft: [
    "gross area",
    "gross sqft",
    "gross (sq ft)",
    "gross area sqft",
    "builtup area",
  ],
  ratePerSqftPkr: [
    "rate",
    "rate / sq ft",
    "rate per sqft",
    "rate (pkr)",
    "rate/sqft",
    "unit price",
    "price/sqft",
  ],
  status: ["status", "unit status", "availability", "current status"],
  buyer: [
    "buyer",
    "buyer name",
    "customer",
    "client",
    "purchaser",
    "sub owner",
    "ownership group",
    "booking ref",
  ],
  soldPricePkr: [
    "sold price",
    "sale price",
    "sold price (pkr)",
    "selling price",
    "booking amount",
    "sold amount",
  ],
  notes: ["notes", "note", "remarks", "comments", "description"],
};

function normalizeHeaderString(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Automatically inspects spreadsheet headers and detects matching columns.
 */
export function detectHeaderMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    unitCode: null,
    unitNumber: null,
    floor: null,
    block: null,
    category: null,
    netAreaSqft: null,
    grossAreaSqft: null,
    ratePerSqftPkr: null,
    status: null,
    buyer: null,
    soldPricePkr: null,
    notes: null,
  };

  const usedHeaders = new Set<string>();

  for (const [key, aliasList] of Object.entries(ALIASES) as [
    ImportColumnKey,
    string[],
  ][]) {
    for (const alias of aliasList) {
      const normAlias = normalizeHeaderString(alias);
      const matched = headers.find(
        (h) => !usedHeaders.has(h) && normalizeHeaderString(h) === normAlias,
      );
      if (matched) {
        mapping[key] = matched;
        usedHeaders.add(matched);
        break;
      }
    }
  }

  // Second pass: relaxed substring matching if exact match not found
  for (const [key, aliasList] of Object.entries(ALIASES) as [
    ImportColumnKey,
    string[],
  ][]) {
    if (mapping[key]) continue;
    for (const alias of aliasList) {
      const normAlias = normalizeHeaderString(alias);
      const matched = headers.find(
        (h) => !usedHeaders.has(h) && normalizeHeaderString(h).includes(normAlias),
      );
      if (matched) {
        mapping[key] = matched;
        usedHeaders.add(matched);
        break;
      }
    }
  }

  return mapping;
}

/**
 * Validates a cleaned row against business rules and DB context.
 */
export function validateRow(
  cleaned: CleanedImportRow,
  raw: Record<string, unknown>,
  mapping: ColumnMapping,
  context: ImportDbContext,
  mode: ImportMode,
  seenCodesInFile: Map<string, number>,
  seenFloorUnitsInFile: Map<string, number>,
): ValidatedImportRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Raw status check
  const rawStatus = mapping.status ? raw[mapping.status] : undefined;
  if (rawStatus !== undefined && rawStatus !== null && String(rawStatus).trim() !== "") {
    if (cleanStatus(rawStatus) === null) {
      errors.push(`Invalid status "${String(rawStatus)}". Must be AVAILABLE or SOLD.`);
    }
  }

  // 2. Unit Number & Code
  if (!cleaned.unitNumber) {
    errors.push("Unit number is required.");
  }
  if (!cleaned.unitCode) {
    errors.push("Unit code could not be determined.");
  }

  // 3. Block validation
  const matchedBlock = context.blocks.find(
    (b) => b.name.toLowerCase() === cleaned.blockName.toLowerCase(),
  );
  if (!matchedBlock) {
    errors.push(`Block "${cleaned.blockName}" does not exist on property.`);
  }

  // 4. Floor validation
  let matchedFloor: ImportDbContext["floors"][number] | undefined;
  if (matchedBlock) {
    matchedFloor = context.floors.find(
      (f) =>
        f.blockId === matchedBlock.id &&
        f.name.toLowerCase() === cleaned.floorName.toLowerCase(),
    );
    if (!matchedFloor) {
      errors.push(
        `Floor "${cleaned.floorName}" does not exist in block "${cleaned.blockName}".`,
      );
    }
  }

  // 5. Check conflicting data in unit code (e.g. 6F-RA33 specifying floor 5th)
  if (cleaned.unitCode && cleaned.floorName) {
    const expectedPrefix = getFloorPrefix(cleaned.floorName);
    const codeMatch = cleaned.unitCode.match(/^([A-Z0-9]+F)-/);
    if (codeMatch?.[1] && codeMatch[1] !== expectedPrefix) {
      errors.push(
        `Unit code "${cleaned.unitCode}" conflicts with floor "${cleaned.floorName}" (expected prefix "${expectedPrefix}").`,
      );
    }
  }

  // 6. Net Area
  const netNum = Number(cleaned.netAreaSqft);
  if (!cleaned.netAreaSqft || Number.isNaN(netNum) || netNum <= 0) {
    errors.push("Valid net area (sq ft) is required.");
  }

  // 7. Rate
  const rateNum = Number(cleaned.ratePerSqftPkr);
  if (!cleaned.ratePerSqftPkr || Number.isNaN(rateNum) || rateNum < 0) {
    errors.push("Valid rate per sq ft (PKR) is required.");
  }

  // 8. SOLD unit validations
  if (cleaned.status === "SOLD") {
    if (!cleaned.soldPricePkr || Number(cleaned.soldPricePkr) <= 0) {
      errors.push("SOLD units must specify a valid sold price.");
    }
    if (!cleaned.isSellable) {
      errors.push(`Unit is classified as "${cleaned.categoryName}" and cannot be sold.`);
    }
  }

  // 9. Gross area warning
  if (cleaned.grossAreaSqft && !Number.isNaN(netNum)) {
    const grossNum = Number(cleaned.grossAreaSqft);
    if (!Number.isNaN(grossNum) && grossNum < netNum) {
      warnings.push(
        `Gross area (${cleaned.grossAreaSqft} sq ft) is less than net area (${cleaned.netAreaSqft} sq ft).`,
      );
    }
  }

  // 10. File-level duplicate checks
  if (cleaned.unitCode) {
    const prevRow = seenCodesInFile.get(cleaned.unitCode);
    if (prevRow !== undefined) {
      errors.push(
        `Duplicate unit code "${cleaned.unitCode}" in file (row ${prevRow + 1} and ${cleaned.rowIndex + 1}).`,
      );
    } else {
      seenCodesInFile.set(cleaned.unitCode, cleaned.rowIndex);
    }
  }

  if (cleaned.floorName && cleaned.unitNumber) {
    const key = `${cleaned.blockName}::${cleaned.floorName}::${cleaned.unitNumber}`;
    const prevRow = seenFloorUnitsInFile.get(key);
    if (prevRow !== undefined && prevRow !== cleaned.rowIndex) {
      errors.push(
        `Duplicate unit number "${cleaned.unitNumber}" on floor "${cleaned.floorName}" in file (row ${prevRow + 1} and ${cleaned.rowIndex + 1}).`,
      );
    } else {
      seenFloorUnitsInFile.set(key, cleaned.rowIndex);
    }
  }

  // 11. Database matching & mode validation
  const existing = context.existingUnits.find(
    (u) =>
      u.unitCode.toLowerCase() === cleaned.unitCode.toLowerCase() &&
      u.blockName.toLowerCase() === cleaned.blockName.toLowerCase(),
  );

  if (existing) {
    if (mode === "CREATE_ONLY") {
      errors.push(`Unit code "${cleaned.unitCode}" already exists in inventory.`);
    } else {
      // CREATE_AND_UPDATE mode
      if (existing.status === "SOLD" && cleaned.status === "AVAILABLE") {
        warnings.push(
          `Unit "${cleaned.unitCode}" is currently SOLD in inventory. Reversing a sale via import is not permitted; sale status will be preserved.`,
        );
      }
      if (existing.status === "SOLD") {
        const rateChanged =
          cleanMoneyNumber(existing.ratePerSqftPkr) !== cleaned.ratePerSqftPkr;
        const areaChanged =
          cleanMoneyNumber(existing.netAreaSqft) !== cleaned.netAreaSqft;
        if ((rateChanged || areaChanged) && context.actorRole !== "ADMIN") {
          errors.push(
            `Unit "${cleaned.unitCode}" is SOLD. Modifying rate or area on a sold unit requires ADMIN role.`,
          );
        }
      }
      if (
        matchedFloor &&
        existing.floorName.toLowerCase() !== cleaned.floorName.toLowerCase()
      ) {
        errors.push(
          `Unit "${cleaned.unitCode}" exists on floor "${existing.floorName}", but import row specifies "${cleaned.floorName}".`,
        );
      }
    }
  }

  const status: ValidatedImportRow["status"] =
    errors.length > 0 ? "ERROR" : warnings.length > 0 ? "WARNING" : "VALID";

  return {
    rowIndex: cleaned.rowIndex,
    status,
    errors,
    warnings,
    cleaned,
    raw,
  };
}

/**
 * Validates the entire set of rows in a batch.
 */
export function validateImportBatch(
  rawRows: Record<string, unknown>[],
  mapping: ColumnMapping,
  context: ImportDbContext,
  mode: ImportMode,
): ImportValidationResult {
  const seenCodes = new Map<string, number>();
  const seenFloorUnits = new Map<string, number>();

  const validatedRows: ValidatedImportRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    if (!raw || isSummaryOrBlankRow(raw)) {
      continue;
    }

    const cleaned = cleanRow(raw, mapping, i);
    const validated = validateRow(
      cleaned,
      raw,
      mapping,
      context,
      mode,
      seenCodes,
      seenFloorUnits,
    );
    validatedRows.push(validated);
  }

  const validCount = validatedRows.filter((r) => r.status === "VALID").length;
  const warningCount = validatedRows.filter((r) => r.status === "WARNING").length;
  const errorCount = validatedRows.filter((r) => r.status === "ERROR").length;

  return {
    rows: validatedRows,
    totalCount: validatedRows.length,
    validCount,
    warningCount,
    errorCount,
  };
}
