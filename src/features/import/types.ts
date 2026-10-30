export type ImportMode = "CREATE_ONLY" | "CREATE_AND_UPDATE";

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
  | "soldPricePkr"
  | "notes";

export type ColumnMapping = Record<ImportColumnKey, string | null>;

export interface ParsedSpreadsheet {
  fileName: string;
  sheetName: string;
  headers: string[];
  rawRows: Record<string, unknown>[];
  totalRows: number;
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
  soldPricePkr: string | null;
  notes: string | null;
  isSellable: boolean;
  originalRow: Record<string, unknown>;
}

export type RowValidationStatus = "VALID" | "WARNING" | "ERROR";

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
