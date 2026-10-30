import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import type { ParsedSpreadsheet, ValidatedImportRow } from "./types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateFileSize(size: number): void {
  if (size > MAX_FILE_SIZE) {
    throw new Error(
      `File size (${(size / (1024 * 1024)).toFixed(2)} MB) exceeds 5 MB limit.`,
    );
  }
}

/**
 * Parses an Excel (.xlsx/.xls) or CSV buffer server-side into structured JSON rows.
 */
export function parseSpreadsheetBuffer(
  buffer: Buffer,
  fileName: string,
): ParsedSpreadsheet {
  validateFileSize(buffer.length);

  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    raw: false, // Return formatted strings for display fidelity
  });

  if (workbook.SheetNames.length === 0) {
    throw new Error("Spreadsheet contains no sheets.");
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("No sheet found in workbook.");
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" could not be read.`);
  }

  // Parse worksheet into array-of-arrays first to detect header row
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (rows.length === 0) {
    throw new Error("Spreadsheet contains no data rows.");
  }

  // Find header row: first non-empty row with at least 2 string values
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const stringCells = row.filter((c) => typeof c === "string" && c.trim().length > 0);
    if (stringCells.length >= 2) {
      headerRowIndex = i;
      break;
    }
  }

  const headerRowCells = rows[headerRowIndex] as unknown[] | undefined;
  if (!headerRowCells) {
    throw new Error("Header row could not be extracted.");
  }

  const rawHeaders = headerRowCells.map((h, idx) =>
    h !== undefined && h !== null && String(h).trim() !== ""
      ? String(h).trim()
      : `Column_${idx + 1}`,
  );

  // De-duplicate headers if identical column names exist
  const headers: string[] = [];
  const headerCounts = new Map<string, number>();
  for (const h of rawHeaders) {
    const count = (headerCounts.get(h) ?? 0) + 1;
    headerCounts.set(h, count);
    if (count > 1) {
      headers.push(`${h}_${count}`);
    } else {
      headers.push(h);
    }
  }

  // Extract data rows
  const rawRows: Record<string, unknown>[] = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    // Check if entire row is empty
    const hasValues = row.some(
      (c) => c !== undefined && c !== null && String(c).trim() !== "",
    );
    if (!hasValues) continue;

    const rowObj: Record<string, unknown> = {};
    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];
      if (!header) continue;
      const val = row[c];
      rowObj[header] = val !== undefined && val !== null ? String(val).trim() : "";
    }
    rawRows.push(rowObj);
  }

  return {
    fileName,
    sheetName,
    headers,
    rawRows,
    totalRows: rawRows.length,
  };
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

  // Columns: Original headers + "Validation Errors" + "Validation Warnings"
  const columns = [
    ...headers.map((h) => ({ header: h, key: h, width: Math.max(h.length + 4, 14) })),
    { header: "Validation Errors", key: "_errors", width: 40 },
    { header: "Validation Warnings", key: "_warnings", width: 35 },
  ];
  worksheet.columns = columns;

  // Header styling: subtle fill, navy text, bold
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FF0E3A5B" }, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1EEE7" },
  };

  for (const errRow of errorRows) {
    const rowValues: Record<string, unknown> = {
      ...errRow.raw,
      _errors: errRow.errors.join("; "),
      _warnings: errRow.warnings.join("; "),
    };
    const row = worksheet.addRow(rowValues);

    // Highlight error cells in light reddish tint
    if (errRow.errors.length > 0) {
      const errorCell = row.getCell("_errors");
      errorCell.font = { color: { argb: "FF7A2E2A" }, bold: true };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
