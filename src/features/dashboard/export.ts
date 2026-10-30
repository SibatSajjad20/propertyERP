import ExcelJS from "exceljs";
import type {
  FloorSummaryExportRow,
  InventoryExportRow,
  SoldUnitsExportRow,
} from "./queries";

export function formatExportDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getExportFilename(
  type: "inventory" | "sold" | "floors",
  format: "xlsx" | "csv",
  date: Date = new Date(),
): string {
  const dateStr = formatExportDate(date);
  const baseNames: Record<typeof type, string> = {
    inventory: "inventory",
    sold: "sold-units-report",
    floors: "floor-summary",
  };
  return `${baseNames[type]}-${dateStr}.${format}`;
}

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvString(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(",")).join("\r\n");
}

const PKR_NUMBER_FORMAT = '"Rs "#,##0;[Red]-"Rs "#,##0;"Rs "0';
const AREA_NUMBER_FORMAT = "#,##0.00";
const INT_NUMBER_FORMAT = "#,##0";
const PCT_NUMBER_FORMAT = "0.0%";

function applyHeaderStyles(worksheet: ExcelJS.Worksheet) {
  const headerRow = worksheet.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: "Segoe UI",
      size: 10,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0E3A5B" }, // #0E3A5B primary
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FF9A7B4F" } }, // brass hallmark border
    };
  });
}

function applyDataRowStyles(row: ExcelJS.Row) {
  row.height = 20;
  row.eachCell((cell) => {
    cell.font = { name: "Segoe UI", size: 9 };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFE4E0D6" } }, // hairline
    };
  });
}

// 1. INVENTORY EXPORT (.xlsx and .csv)
export async function generateInventoryExcel(
  data: InventoryExportRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sardar's Mall ERP";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Inventory", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1, activeCell: "A2" }],
  });

  worksheet.columns = [
    { header: "Unit Code", key: "unitCode", width: 14 },
    { header: "Floor", key: "floorName", width: 14 },
    { header: "Level", key: "level", width: 10 },
    { header: "Block", key: "blockName", width: 16 },
    { header: "Category", key: "categoryName", width: 16 },
    { header: "Status", key: "status", width: 14 },
    { header: "Net Area (sq ft)", key: "netAreaSqft", width: 16 },
    { header: "Gross Area (sq ft)", key: "grossAreaSqft", width: 18 },
    { header: "Rate / sq ft (PKR)", key: "ratePerSqftPkr", width: 18 },
    { header: "Adjustment (PKR)", key: "priceAdjustmentPkr", width: 18 },
    { header: "Total Price (PKR)", key: "totalPricePkr", width: 20 },
    { header: "Sellable", key: "isSellable", width: 12 },
    { header: "Ownership Group", key: "ownershipGroup", width: 22 },
    { header: "Booking Ref", key: "bookingRef", width: 16 },
  ];

  applyHeaderStyles(worksheet);

  for (const item of data) {
    const row = worksheet.addRow({
      unitCode: item.unitCode,
      floorName: item.floorName,
      level: item.level,
      blockName: item.blockName,
      categoryName: item.categoryName,
      status: item.status,
      netAreaSqft: Number(item.netAreaSqft),
      grossAreaSqft: item.grossAreaSqft ? Number(item.grossAreaSqft) : null,
      ratePerSqftPkr: Number(item.ratePerSqftPkr),
      priceAdjustmentPkr: Number(item.priceAdjustmentPkr),
      totalPricePkr: Number(item.totalPricePkr),
      isSellable: item.isSellable ? "Yes" : "No",
      ownershipGroup: item.ownershipGroup ?? "",
      bookingRef: item.bookingRef ?? "",
    });

    row.getCell("netAreaSqft").numFmt = AREA_NUMBER_FORMAT;
    if (item.grossAreaSqft) row.getCell("grossAreaSqft").numFmt = AREA_NUMBER_FORMAT;
    row.getCell("ratePerSqftPkr").numFmt = PKR_NUMBER_FORMAT;
    row.getCell("priceAdjustmentPkr").numFmt = PKR_NUMBER_FORMAT;
    row.getCell("totalPricePkr").numFmt = PKR_NUMBER_FORMAT;
    row.getCell("level").numFmt = INT_NUMBER_FORMAT;

    applyDataRowStyles(row);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function generateInventoryCsv(data: InventoryExportRow[]): string {
  const headers = [
    "Unit Code",
    "Floor",
    "Level",
    "Block",
    "Category",
    "Status",
    "Net Area (sq ft)",
    "Gross Area (sq ft)",
    "Rate / sq ft (PKR)",
    "Adjustment (PKR)",
    "Total Price (PKR)",
    "Sellable",
    "Ownership Group",
    "Booking Ref",
  ];
  const rows = data.map((r) => [
    r.unitCode,
    r.floorName,
    r.level,
    r.blockName,
    r.categoryName,
    r.status,
    r.netAreaSqft,
    r.grossAreaSqft ?? "",
    r.ratePerSqftPkr,
    r.priceAdjustmentPkr,
    r.totalPricePkr,
    r.isSellable ? "Yes" : "No",
    r.ownershipGroup ?? "",
    r.bookingRef ?? "",
  ]);
  return toCsvString([headers, ...rows]);
}

// 2. SOLD UNITS REPORT (.xlsx and .csv)
export async function generateSoldUnitsExcel(
  data: SoldUnitsExportRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sardar's Mall ERP";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Sold Units", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1, activeCell: "A2" }],
  });

  worksheet.columns = [
    { header: "Unit Code", key: "unitCode", width: 14 },
    { header: "Floor", key: "floorName", width: 14 },
    { header: "Level", key: "level", width: 10 },
    { header: "Block", key: "blockName", width: 16 },
    { header: "Category", key: "categoryName", width: 16 },
    { header: "Net Area (sq ft)", key: "netAreaSqft", width: 16 },
    { header: "Rate / sq ft (PKR)", key: "ratePerSqftPkr", width: 18 },
    { header: "Sold Price (PKR)", key: "soldPricePkr", width: 20 },
    { header: "Sold Date", key: "soldAt", width: 14 },
    { header: "Sold By", key: "soldByName", width: 18 },
    { header: "Booking Ref", key: "bookingRef", width: 16 },
    { header: "Ownership Group", key: "ownershipGroup", width: 22 },
  ];

  applyHeaderStyles(worksheet);

  for (const item of data) {
    const row = worksheet.addRow({
      unitCode: item.unitCode,
      floorName: item.floorName,
      level: item.level,
      blockName: item.blockName,
      categoryName: item.categoryName,
      netAreaSqft: Number(item.netAreaSqft),
      ratePerSqftPkr: Number(item.ratePerSqftPkr),
      soldPricePkr: Number(item.soldPricePkr),
      soldAt: item.soldAt ? formatExportDate(item.soldAt) : "",
      soldByName: item.soldByName ?? "",
      bookingRef: item.bookingRef ?? "",
      ownershipGroup: item.ownershipGroup ?? "",
    });

    row.getCell("netAreaSqft").numFmt = AREA_NUMBER_FORMAT;
    row.getCell("ratePerSqftPkr").numFmt = PKR_NUMBER_FORMAT;
    row.getCell("soldPricePkr").numFmt = PKR_NUMBER_FORMAT;
    row.getCell("level").numFmt = INT_NUMBER_FORMAT;

    applyDataRowStyles(row);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function generateSoldUnitsCsv(data: SoldUnitsExportRow[]): string {
  const headers = [
    "Unit Code",
    "Floor",
    "Level",
    "Block",
    "Category",
    "Net Area (sq ft)",
    "Rate / sq ft (PKR)",
    "Sold Price (PKR)",
    "Sold Date",
    "Sold By",
    "Booking Ref",
    "Ownership Group",
  ];
  const rows = data.map((r) => [
    r.unitCode,
    r.floorName,
    r.level,
    r.blockName,
    r.categoryName,
    r.netAreaSqft,
    r.ratePerSqftPkr,
    r.soldPricePkr,
    r.soldAt ? formatExportDate(r.soldAt) : "",
    r.soldByName ?? "",
    r.bookingRef ?? "",
    r.ownershipGroup ?? "",
  ]);
  return toCsvString([headers, ...rows]);
}

// 3. FLOOR SUMMARY REPORT (.xlsx and .csv)
export async function generateFloorSummaryExcel(
  data: FloorSummaryExportRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sardar's Mall ERP";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Floor Summary", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1, activeCell: "A2" }],
  });

  worksheet.columns = [
    { header: "Floor", key: "floorName", width: 16 },
    { header: "Level", key: "level", width: 10 },
    { header: "Block", key: "blockName", width: 18 },
    { header: "Total Units", key: "total", width: 14 },
    { header: "Available", key: "available", width: 14 },
    { header: "Sold", key: "sold", width: 14 },
    { header: "% Sold", key: "soldPercent", width: 12 },
    { header: "Available Value (PKR)", key: "availableValuePkr", width: 22 },
    { header: "Sold Value (PKR)", key: "soldValuePkr", width: 22 },
    { header: "Total Value (PKR)", key: "totalValuePkr", width: 22 },
  ];

  applyHeaderStyles(worksheet);

  for (const item of data) {
    const row = worksheet.addRow({
      floorName: item.floorName,
      level: item.level,
      blockName: item.blockName,
      total: item.total,
      available: item.available,
      sold: item.sold,
      soldPercent: item.soldPercent / 100, // Excel expects 0-1 for percentage
      availableValuePkr: Number(item.availableValuePkr),
      soldValuePkr: Number(item.soldValuePkr),
      totalValuePkr: Number(item.totalValuePkr),
    });

    row.getCell("total").numFmt = INT_NUMBER_FORMAT;
    row.getCell("available").numFmt = INT_NUMBER_FORMAT;
    row.getCell("sold").numFmt = INT_NUMBER_FORMAT;
    row.getCell("level").numFmt = INT_NUMBER_FORMAT;
    row.getCell("soldPercent").numFmt = PCT_NUMBER_FORMAT;
    row.getCell("availableValuePkr").numFmt = PKR_NUMBER_FORMAT;
    row.getCell("soldValuePkr").numFmt = PKR_NUMBER_FORMAT;
    row.getCell("totalValuePkr").numFmt = PKR_NUMBER_FORMAT;

    applyDataRowStyles(row);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function generateFloorSummaryCsv(data: FloorSummaryExportRow[]): string {
  const headers = [
    "Floor",
    "Level",
    "Block",
    "Total Units",
    "Available",
    "Sold",
    "% Sold",
    "Available Value (PKR)",
    "Sold Value (PKR)",
    "Total Value (PKR)",
  ];
  const rows = data.map((r) => [
    r.floorName,
    r.level,
    r.blockName,
    r.total,
    r.available,
    r.sold,
    `${r.soldPercent.toFixed(1)}%`,
    r.availableValuePkr,
    r.soldValuePkr,
    r.totalValuePkr,
  ]);
  return toCsvString([headers, ...rows]);
}
