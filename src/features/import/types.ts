export type ImportMode = "CREATE_ONLY" | "CREATE_AND_UPDATE" | "UPSERT";

export type ImportColumnKey =
  | "unitCode"
  | "unitNumber"
  | "floor"
  | "block"
  | "category"
  | "netAreaSqft"
  | "grossAreaSqft"
  | "ratePerSqftPkr"
  | "status"
  | "buyer"
  | "subOwner"
  | "soldPricePkr"
  | "notes";

export type ColumnMapping = Record<ImportColumnKey, string | null>;

export type MappingConfidenceLevel = "high" | "medium" | "low" | "none";

export type MappingFieldMeta = {
  header: string | null;
  confidence: MappingConfidenceLevel;
  sample: string | null;
};

export type MappingDetection = {
  mapping: ColumnMapping;
  fields: Record<ImportColumnKey, MappingFieldMeta>;
};

export interface ParsedSpreadsheet {
  fileName: string;
  sheetName: string;
  sheetNames: string[];
  headers: string[];
  rawRows: Record<string, unknown>[];
  totalRows: number;
  headerRow: number;
  dataRows: number;
  blankSkipped: number;
  summarySkipped: number;
}

export interface CleanedImportRow {
  rowIndex: number;
  unitCode: string;
  unitNumber: string;
  floorName: string;
  blockName: string;
  categoryName: string;
  netAreaSqft: string;
  grossAreaSqft: string | null;
  ratePerSqftPkr: string;
  status: "AVAILABLE" | "SOLD";
  buyer: string | null;
  subOwner: string | null;
  soldPricePkr: string | null;
  notes: string | null;
  isSellable: boolean;
  generatedUnitCode: boolean;
  originalRow: Record<string, unknown>;
}

export type RowValidationStatus = "VALID" | "WARNING" | "ERROR" | "SKIPPED";

export interface ValidatedImportRow {
  rowIndex: number;
  status: RowValidationStatus;
  errors: string[];
  warnings: string[];
  cleaned: CleanedImportRow | null;
  raw: Record<string, unknown>;
}

export interface ImportValidationResult {
  rows: ValidatedImportRow[];
  totalCount: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  skippedCount: number;
}

export interface ImportBatchSummary {
  id: string;
  originalFilePath: string;
  rowCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  warningCount: number;
  errorCount: number;
  warnings: string[];
  errors: string[];
  actorId: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  rolledBackAt: Date | null;
  rolledBackByName?: string | null;
  createdAt: Date;
}

export const IMPORT_COLUMN_KEYS: ImportColumnKey[] = [
  "unitCode",
  "unitNumber",
  "floor",
  "block",
  "category",
  "netAreaSqft",
  "grossAreaSqft",
  "ratePerSqftPkr",
  "status",
  "buyer",
  "subOwner",
  "soldPricePkr",
  "notes",
];

export const EMPTY_COLUMN_MAPPING: ColumnMapping = {
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
  subOwner: null,
  soldPricePkr: null,
  notes: null,
};

export const IMPORT_CHUNK_SIZE = 250;
export const IMPORT_MAX_FILE_BYTES = 10 * 1024 * 1024;
