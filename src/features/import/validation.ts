import type { UnitStatus, UserRole } from "@/db/schema/enums";
import { computeTotalPrice } from "@/lib/money";
import {
  cleanMoneyNumber,
  cleanRow,
  cleanStatus,
  getFloorPrefix,
  isAmenityStatusLabel,
  isSummaryOrBlankRow,
} from "./cleaning";
import type {
  ColumnMapping,
  ImportColumnKey,
  ImportMode,
  ImportValidationResult,
  MappingConfidenceLevel,
  MappingDetection,
  MappingFieldMeta,
  ValidatedImportRow,
} from "./types";
import { EMPTY_COLUMN_MAPPING, IMPORT_COLUMN_KEYS } from "./types";

export interface ExistingUnitContext {
  id: string;
  unitCode: string;
  unitNumber: string;
  floorId: string;
  floorName: string;
  blockName: string;
  status: UnitStatus;
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

export type ImportValidateOptions = {
  createMissingStructure?: boolean;
};

const ALIASES: Record<ImportColumnKey, string[]> = {
  unitCode: [
    "unique unit #",
    "unique unit",
    "unique unit no",
    "unique unit number",
    "unit code",
    "unit_code",
    "unitcode",
    "code",
    "flat no",
    "shop no",
  ],
  unitNumber: ["unit no", "unit_no", "unit number", "unit #", "unitno", "unit"],
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
    "ownership-1",
    "ownership 1",
    "ownership1",
    "buyer",
    "buyer name",
    "customer",
    "client",
    "purchaser",
    "booking ref",
  ],
  subOwner: [
    "sub ownership-2",
    "sub ownership 2",
    "subownership2",
    "sub owner",
    "sub-owner",
    "sub ownership",
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

export function normalizeHeaderString(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function emptyMapping(): ColumnMapping {
  return { ...EMPTY_COLUMN_MAPPING };
}

function matchHeader(
  headers: string[],
  usedHeaders: Set<string>,
  alias: string,
  mode: "exact" | "includes",
): string | undefined {
  const normAlias = normalizeHeaderString(alias);
  if (!normAlias) return undefined;
  if (mode === "includes" && normAlias.length < 6) return undefined;
  return headers.find((h) => {
    if (usedHeaders.has(h)) return false;
    const norm = normalizeHeaderString(h);
    return mode === "exact" ? norm === normAlias : norm.includes(normAlias);
  });
}

/**
 * Automatically inspects spreadsheet headers and detects matching columns.
 */
export function detectHeaderMappingDetailed(
  headers: string[],
  sampleRow: Record<string, unknown> = {},
): MappingDetection {
  const mapping = emptyMapping();
  const usedHeaders = new Set<string>();
  const confidence = new Map<ImportColumnKey, MappingConfidenceLevel>();

  for (const key of IMPORT_COLUMN_KEYS) {
    const aliasList = ALIASES[key];
    for (const alias of aliasList) {
      const matched = matchHeader(headers, usedHeaders, alias, "exact");
      if (matched) {
        mapping[key] = matched;
        usedHeaders.add(matched);
        confidence.set(key, "high");
        break;
      }
    }
  }

  for (const key of IMPORT_COLUMN_KEYS) {
    if (mapping[key]) continue;
    const aliasList = ALIASES[key];
    for (const alias of aliasList) {
      const matched = matchHeader(headers, usedHeaders, alias, "includes");
      if (matched) {
        mapping[key] = matched;
        usedHeaders.add(matched);
        confidence.set(key, "medium");
        break;
      }
    }
  }

  const fields = {} as Record<ImportColumnKey, MappingFieldMeta>;
  for (const key of IMPORT_COLUMN_KEYS) {
    const header = mapping[key];
    const sample =
      header && sampleRow[header] !== undefined && sampleRow[header] !== null
        ? String(sampleRow[header])
        : null;
    fields[key] = {
      header,
      confidence: header ? (confidence.get(key) ?? "low") : "none",
      sample,
    };
  }

  return { mapping, fields };
}

export function detectHeaderMapping(headers: string[]): ColumnMapping {
  return detectHeaderMappingDetailed(headers).mapping;
}

export function scoreHeaderRow(cells: unknown[]): number {
  const headers = cells
    .map((c) => (c === undefined || c === null ? "" : String(c).trim()))
    .filter((h) => h.length > 0);
  if (headers.length < 2) return 0;
  const blob = headers.join(" ").toLowerCase();
  if (
    /\bsubtotal\b|\bgrand total\b/.test(blob) ||
    headers.every((h) => /^total$/i.test(h))
  ) {
    return 0;
  }
  const mapping = detectHeaderMapping(headers);
  const important: ImportColumnKey[] = [
    "unitCode",
    "unitNumber",
    "floor",
    "netAreaSqft",
    "ratePerSqftPkr",
  ];
  let score = 0;
  for (const key of IMPORT_COLUMN_KEYS) {
    if (!mapping[key]) continue;
    score += important.includes(key) ? 3 : 1;
  }
  return score;
}

function findExisting(
  context: ImportDbContext,
  unitCode: string,
  blockName: string,
  mode: ImportMode,
) {
  return context.existingUnits.find((u) => {
    if (u.unitCode.toLowerCase() !== unitCode.toLowerCase()) return false;
    if (mode === "UPSERT") return true;
    return u.blockName.toLowerCase() === blockName.toLowerCase();
  });
}

/**
 * Validates a cleaned row against business rules and DB context.
 */
export function validateRow(
  cleaned: ReturnType<typeof cleanRow>,
  raw: Record<string, unknown>,
  mapping: ColumnMapping,
  context: ImportDbContext,
  mode: ImportMode,
  seenCodesInFile: Map<string, number>,
  seenFloorUnitsInFile: Map<string, number>,
  options: ImportValidateOptions = {},
): ValidatedImportRow {
  const errors: string[] = [];
  const warnings: string[] = [];
  const createMissing = Boolean(options.createMissingStructure);

  const rawStatus = mapping.status ? raw[mapping.status] : undefined;
  if (rawStatus !== undefined && rawStatus !== null && String(rawStatus).trim() !== "") {
    if (isAmenityStatusLabel(rawStatus)) {
      warnings.push(
        `Status "${String(rawStatus)}" treated as AVAILABLE and not sellable.`,
      );
    } else if (cleanStatus(rawStatus) === null) {
      errors.push(`Invalid status "${String(rawStatus)}". Must be AVAILABLE or SOLD.`);
    }
  }

  if (!cleaned.unitNumber) {
    errors.push("Unit number is required.");
  }
  if (!cleaned.unitCode) {
    errors.push("Unit code could not be determined.");
  }
  if (cleaned.generatedUnitCode) {
    warnings.push(
      `Generated unit code ${cleaned.unitCode} because Unique Unit # was blank or "-".`,
    );
  }

  const matchedBlock = context.blocks.find(
    (b) => b.name.toLowerCase() === cleaned.blockName.toLowerCase(),
  );
  if (!matchedBlock) {
    if (createMissing) {
      warnings.push(`Block "${cleaned.blockName}" will be created on the property.`);
    } else {
      errors.push(`Block "${cleaned.blockName}" does not exist on property.`);
    }
  }

  let matchedFloor: ImportDbContext["floors"][number] | undefined;
  if (matchedBlock) {
    matchedFloor = context.floors.find(
      (f) =>
        f.blockId === matchedBlock.id &&
        f.name.toLowerCase() === cleaned.floorName.toLowerCase(),
    );
  }
  if (!matchedFloor) {
    if (createMissing) {
      warnings.push(
        `Floor "${cleaned.floorName}" will be created in block "${cleaned.blockName}".`,
      );
    } else if (matchedBlock) {
      errors.push(
        `Floor "${cleaned.floorName}" does not exist in block "${cleaned.blockName}".`,
      );
    }
  }

  if (cleaned.unitCode && cleaned.floorName) {
    const expectedPrefix = getFloorPrefix(cleaned.floorName);
    const codeMatch = cleaned.unitCode.match(/^([A-Z0-9]+F)-/);
    if (codeMatch?.[1] && codeMatch[1] !== expectedPrefix) {
      errors.push(
        `Unit code "${cleaned.unitCode}" conflicts with floor "${cleaned.floorName}" (expected prefix "${expectedPrefix}").`,
      );
    }
  }

  const netNum = Number(cleaned.netAreaSqft);
  if (!cleaned.netAreaSqft || Number.isNaN(netNum) || netNum <= 0) {
    errors.push("Valid net area (sq ft) is required.");
  }

  const rateNum = Number(cleaned.ratePerSqftPkr);
  if (!cleaned.ratePerSqftPkr || Number.isNaN(rateNum) || rateNum < 0) {
    errors.push("Valid rate per sq ft (PKR) is required.");
  }

  if (!cleaned.categoryName) {
    errors.push("Category is required.");
  } else {
    const matchedCategory = context.categories.find(
      (c) => c.name.toLowerCase() === cleaned.categoryName.toLowerCase(),
    );
    if (!matchedCategory) {
      if (createMissing) {
        warnings.push(`Category "${cleaned.categoryName}" will be created.`);
      } else {
        errors.push(
          `Category "${cleaned.categoryName}" does not exist. Enable auto-create or add it in Structure.`,
        );
      }
    }
  }

  if (!cleaned.isSellable) {
    warnings.push(
      `Unit is classified as "${cleaned.categoryName || "non-sellable"}" and will be imported as not sellable.`,
    );
  }

  if (cleaned.status === "SOLD") {
    if (!cleaned.soldPricePkr || Number(cleaned.soldPricePkr) <= 0) {
      const areaForPricing = cleaned.grossAreaSqft || cleaned.netAreaSqft;
      if (cleaned.ratePerSqftPkr && areaForPricing) {
        cleaned.soldPricePkr = computeTotalPrice(cleaned.ratePerSqftPkr, areaForPricing);
        warnings.push(
          `SOLD row has no sold price; using rate × ${cleaned.grossAreaSqft ? "gross" : "net"} area (${cleaned.soldPricePkr}).`,
        );
      } else {
        warnings.push("SOLD units should specify a sold price; none could be computed.");
      }
    }
    if (!cleaned.isSellable) {
      errors.push(`Unit is classified as "${cleaned.categoryName}" and cannot be sold.`);
    }
  }

  if (cleaned.grossAreaSqft && !Number.isNaN(netNum)) {
    const grossNum = Number(cleaned.grossAreaSqft);
    if (!Number.isNaN(grossNum) && grossNum < netNum) {
      warnings.push(
        `Gross area (${cleaned.grossAreaSqft} sq ft) is less than net area (${cleaned.netAreaSqft} sq ft).`,
      );
    }
  }

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

  const existing = cleaned.unitCode
    ? findExisting(context, cleaned.unitCode, cleaned.blockName, mode)
    : undefined;

  if (existing) {
    if (mode === "CREATE_ONLY") {
      errors.push(`Unit code "${cleaned.unitCode}" already exists in inventory.`);
    } else {
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
  options: ImportValidateOptions = {},
): ImportValidationResult {
  const seenCodes = new Map<string, number>();
  const seenFloorUnits = new Map<string, number>();
  const validatedRows: ValidatedImportRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    if (!raw) continue;

    if (isSummaryOrBlankRow(raw)) {
      validatedRows.push({
        rowIndex: i,
        status: "SKIPPED",
        errors: [],
        warnings: ["Skipped title, blank, or SUBTOTAL row."],
        cleaned: null,
        raw,
      });
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
      options,
    );
    validatedRows.push(validated);
  }

  const validCount = validatedRows.filter((r) => r.status === "VALID").length;
  const warningCount = validatedRows.filter((r) => r.status === "WARNING").length;
  const errorCount = validatedRows.filter((r) => r.status === "ERROR").length;
  const skippedCount = validatedRows.filter((r) => r.status === "SKIPPED").length;

  return {
    rows: validatedRows,
    totalCount: validatedRows.length,
    validCount,
    warningCount,
    errorCount,
    skippedCount,
  };
}
