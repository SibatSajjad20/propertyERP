import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { isSummaryOrBlankRow } from "./cleaning";
import { IMPORT_MAX_FILE_BYTES } from "./types";
import type { ParsedSpreadsheet, ValidatedImportRow } from "./types";
import { scoreHeaderRow } from "./validation";

export function validateFileSize(size: number): void {
  if (size > IMPORT_MAX_FILE_BYTES) {
    throw new Error(
      `File size (${(size / (1024 * 1024)).toFixed(2)} MB) exceeds 10 MB limit.`,
    );
  }
}

function cellToPlainText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value).trim();
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "object") {
    const obj = value as {
      richText?: Array<{ t?: string; text?: string }>;
      text?: string;
      v?: unknown;
      w?: unknown;
      result?: unknown;
    };
    if (Array.isArray(obj.richText)) {
      return obj.richText
        .map((part) => part.t ?? part.text ?? "")
        .join("")
        .trim();
    }
    if (obj.w !== undefined && obj.w !== null) return String(obj.w).trim();
    if (obj.result !== undefined && obj.result !== null) {
      return cellToPlainText(obj.result);
    }
    if (obj.v !== undefined && obj.v !== null) return cellToPlainText(obj.v);
    if (obj.text) return String(obj.text).trim();
  }
  return String(value).trim();
}

function sheetToMatrix(worksheet: XLSX.WorkSheet): unknown[][] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    blankrows: true,
    raw: false,
  });
  return rows.map((row) =>
    (Array.isArray(row) ? row : []).map((cell) => cellToPlainText(cell)),
  );
}

function pickHeaderRow(rows: unknown[][]): { index: number; score: number } {
  let best = { index: 0, score: -1 };
  const scan = Math.min(rows.length, 25);
  for (let i = 0; i < scan; i++) {
    const row = rows[i];
    if (!row) continue;
    const score = scoreHeaderRow(row);
    if (score > best.score) {
      best = { index: i, score };
    }
  }
  if (best.score < 3) {
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i];
      if (!Array.isArray(row)) continue;
      const stringCells = row.filter((c) => String(c).trim().length > 0);
      if (stringCells.length >= 2) {
        return { index: i, score: 1 };
      }
    }
  }
  return best.score >= 0 ? best : { index: 0, score: 0 };
}

function uniqueHeaders(rawHeaders: string[]): string[] {
  const headers: string[] = [];
  const headerCounts = new Map<string, number>();
  for (const h of rawHeaders) {
    const count = (headerCounts.get(h) ?? 0) + 1;
    headerCounts.set(h, count);
    headers.push(count > 1 ? `${h}_${count}` : h);
  }
  return headers;
}

export function parseSheetMatrix(
  rows: unknown[][],
  fileName: string,
  sheetName: string,
  sheetNames: string[],
): ParsedSpreadsheet {
  if (rows.length === 0) {
    throw new Error("Spreadsheet contains no data rows.");
  }

  const headerPick = pickHeaderRow(rows);
  const headerRowCells = (rows[headerPick.index] ?? []) as unknown[];
  const rawHeaders = headerRowCells.map((h, idx) => {
    const text = cellToPlainText(h);
    return text !== "" ? text : `Column_${idx + 1}`;
  });
  const headers = uniqueHeaders(rawHeaders);

  const rawRows: Record<string, unknown>[] = [];
  let blankSkipped = 0;
  let summarySkipped = 0;

  for (let i = headerPick.index + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) {
      blankSkipped += 1;
      continue;
    }
    const hasValues = row.some((c) => cellToPlainText(c) !== "");
    if (!hasValues) {
      blankSkipped += 1;
      continue;
    }

    const rowObj: Record<string, unknown> = {};
    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];
      if (!header) continue;
      rowObj[header] = cellToPlainText(row[c]);
    }

    if (isSummaryOrBlankRow(rowObj)) {
      summarySkipped += 1;
    }
    rawRows.push(rowObj);
  }

  return {
    fileName,
    sheetName,
    sheetNames,
    headers,
    rawRows,
    totalRows: rawRows.length,
    headerRow: headerPick.index + 1,
    dataRows: rawRows.length,
    blankSkipped,
    summarySkipped,
  };
}

function sheetPreferenceBonus(name: string): number {
  const lower = name.toLowerCase();
  if (lower.includes("inventory list")) return 40;
  if (lower.includes("inventory")) return 25;
  return 0;
}

export function chooseBestSheet(workbook: XLSX.WorkBook, preferredName?: string): string {
  const names = workbook.SheetNames;
  if (names.length === 0) {
    throw new Error("Spreadsheet contains no sheets.");
  }
  if (preferredName && names.includes(preferredName)) {
    return preferredName;
  }

  let bestName = names[0]!;
  let bestScore = -1;
  for (const name of names) {
    const worksheet = workbook.Sheets[name];
    if (!worksheet) continue;
    const matrix = sheetToMatrix(worksheet);
    const header = pickHeaderRow(matrix);
    const score = header.score + sheetPreferenceBonus(name);
    if (score > bestScore) {
      bestScore = score;
      bestName = name;
    }
  }
  return bestName;
}

export function parseSpreadsheetBuffer(
  buffer: Buffer,
  fileName: string,
  options: { sheetName?: string } = {},
): ParsedSpreadsheet {
  validateFileSize(buffer.length);

  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    cellFormula: true,
    raw: false,
  });

  if (workbook.SheetNames.length === 0) {
    throw new Error("Spreadsheet contains no sheets.");
  }

  const sheetName = chooseBestSheet(workbook, options.sheetName);
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" could not be read.`);
  }

  return parseSheetMatrix(
    sheetToMatrix(worksheet),
    fileName,
    sheetName,
    workbook.SheetNames,
  );
}

/**
 * Generates an Excel (.xlsx) workbook containing only the error rows with an inline error reason column.
 * Uses exceljs for formatting.
 */
export async function generateErrorRowsWorkbook(
  headers: string[],
  errorRows: ValidatedImportRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sardar's Mall ERP";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Import Errors");

  const columns = [
    ...headers.map((h) => ({ header: h, key: h, width: Math.max(h.length + 4, 14) })),
    { header: "Validation Errors", key: "_errors", width: 40 },
    { header: "Validation Warnings", key: "_warnings", width: 35 },
  ];
  worksheet.columns = columns;

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FF0B558B" }, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8F0F7" },
  };

  for (const errRow of errorRows) {
    const rowValues: Record<string, unknown> = {
      ...errRow.raw,
      _errors: errRow.errors.join("; "),
      _warnings: errRow.warnings.join("; "),
    };
    const row = worksheet.addRow(rowValues);

    if (errRow.errors.length > 0) {
      const errorCell = row.getCell("_errors");
      errorCell.font = { color: { argb: "FF7A2E2A" }, bold: true };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
