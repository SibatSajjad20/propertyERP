import ExcelJS from "exceljs";
import { parseDecimal } from "@/lib/money";
import type {
  BookedUnitsReportData,
  ClientLedgerReportData,
  InstallmentsReportData,
  ReservedUnitsReportData,
  SoldUnitsReportData,
  SummaryReportData,
} from "./queries";

const PKR_NUMBER_FORMAT = '"Rs "#,##0;[Red]-"Rs "#,##0;"Rs "0';
const INT_NUMBER_FORMAT = "#,##0";
const PCT_NUMBER_FORMAT = "0.0%";

function applyBrandHeader(
  worksheet: ExcelJS.Worksheet,
  title: string,
  filterDesc: string,
  columnCount: number,
) {
  // Title row
  const titleRow = worksheet.getRow(1);
  titleRow.height = 28;
  worksheet.mergeCells(1, 1, 1, columnCount);
  const titleCell = worksheet.getCell("A1");
  titleCell.value = `Sardar's Mall ERP — ${title}`;
  titleCell.font = {
    name: "Segoe UI",
    size: 14,
    bold: true,
    color: { argb: "FF0E3A5B" },
  };
  titleCell.alignment = { vertical: "middle" };

  // Filter description row
  const filterRow = worksheet.getRow(2);
  filterRow.height = 18;
  worksheet.mergeCells(2, 1, 2, columnCount);
  const filterCell = worksheet.getCell("A2");
  filterCell.value = filterDesc;
  filterCell.font = {
    name: "Segoe UI",
    size: 9,
    italic: true,
    color: { argb: "FF64748B" },
  };
  filterCell.alignment = { vertical: "middle" };

  // Empty separator row
  worksheet.getRow(3).height = 8;
}

function applyTableHeaderStyles(row: ExcelJS.Row) {
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = {
      name: "Segoe UI",
      size: 10,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0B558B" }, // #0B558B Primary
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FF9A7B4F" } }, // Brass Hallmark
    };
  });
}

function applyDataRowStyles(row: ExcelJS.Row) {
  row.height = 20;
  row.eachCell((cell) => {
    cell.font = { name: "Segoe UI", size: 9 };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
  });
}

// -------------------------------------------------------------
// 1. Sold Units Excel
// -------------------------------------------------------------
export async function generateSoldUnitsExcel(
  data: SoldUnitsReportData,
  filterDesc: string,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sardar's Mall ERP";
  wb.created = new Date();

  const ws = wb.addWorksheet("Sold Units", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 4, activeCell: "A5" }],
  });

  applyBrandHeader(ws, "Sold Units Report", filterDesc, 12);

  const headerRow = ws.getRow(4);
  headerRow.values = [
    "Unit Code",
    "Floor",
    "Category",
    "Area (sqft)",
    "Client Name",
    "Client CNIC",
    "List Price",
    "Discount",
    "Sale Price",
    "Sold Date",
    "Source",
    "Bought Back",
  ];
  applyTableHeaderStyles(headerRow);

  ws.columns = [
    { key: "unitCode", width: 14 },
    { key: "floorName", width: 14 },
    { key: "categoryName", width: 16 },
    { key: "netAreaSqft", width: 12 },
    { key: "clientName", width: 22 },
    { key: "clientCnic", width: 18 },
    { key: "listPrice", width: 16 },
    { key: "discount", width: 14 },
    { key: "salePrice", width: 16 },
    { key: "soldDate", width: 14 },
    { key: "source", width: 14 },
    { key: "isBoughtBack", width: 14 },
  ];

  for (const r of data.rows) {
    const row = ws.addRow({
      unitCode: r.unitCode,
      floorName: r.floorName,
      categoryName: r.categoryName,
      netAreaSqft: Number(r.netAreaSqft),
      clientName: r.clientName,
      clientCnic: r.clientCnic,
      listPrice: Number(parseDecimal(r.listPrice)) / 100,
      discount: Number(parseDecimal(r.discount)) / 100,
      salePrice: Number(parseDecimal(r.salePrice)) / 100,
      soldDate: new Date(r.soldDate).toISOString().split("T")[0],
      source: r.source,
      isBoughtBack: r.isBoughtBack ? "Yes" : "No",
    });

    applyDataRowStyles(row);
    row.getCell(4).numFmt = "#,##0.00";
    row.getCell(7).numFmt = PKR_NUMBER_FORMAT;
    row.getCell(8).numFmt = PKR_NUMBER_FORMAT;
    row.getCell(9).numFmt = PKR_NUMBER_FORMAT;
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// -------------------------------------------------------------
// 2. Booked Units Excel
// -------------------------------------------------------------
export async function generateBookedUnitsExcel(
  data: BookedUnitsReportData,
  filterDesc: string,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sardar's Mall ERP";
  wb.created = new Date();

  const ws = wb.addWorksheet("Booked Units", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 4, activeCell: "A5" }],
  });

  applyBrandHeader(ws, "Booked Units Report", filterDesc, 13);

  const headerRow = ws.getRow(4);
  headerRow.values = [
    "Booking No",
    "Unit Code",
    "Client Name",
    "Client CNIC",
    "Phone",
    "Net Price",
    "Paid Amount",
    "Remaining Balance",
    "% Paid",
    "Plan",
    "Next Due Date",
    "Overdue Amount",
    "Status",
  ];
  applyTableHeaderStyles(headerRow);

  ws.columns = [
    { key: "bookingNo", width: 16 },
    { key: "unitCode", width: 14 },
    { key: "clientName", width: 22 },
    { key: "clientCnic", width: 18 },
    { key: "clientPhone", width: 16 },
    { key: "netPrice", width: 16 },
    { key: "paid", width: 16 },
    { key: "balance", width: 16 },
    { key: "paidPercent", width: 10 },
    { key: "plan", width: 14 },
    { key: "nextDueDate", width: 14 },
    { key: "overdueAmount", width: 16 },
    { key: "status", width: 14 },
  ];

  for (const r of data.rows) {
    const row = ws.addRow({
      bookingNo: r.bookingNo,
      unitCode: r.unitCode,
      clientName: r.clientName,
      clientCnic: r.clientCnic,
      clientPhone: r.clientPhone,
      netPrice: Number(parseDecimal(r.netPrice)) / 100,
      paid: Number(parseDecimal(r.paid)) / 100,
      balance: Number(parseDecimal(r.balance)) / 100,
      paidPercent: r.paidPercent / 100,
      plan: r.plan,
      nextDueDate: r.nextDueDate
        ? new Date(r.nextDueDate).toISOString().split("T")[0]
        : "-",
      overdueAmount: Number(parseDecimal(r.overdueAmount)) / 100,
      status: r.status,
    });

    applyDataRowStyles(row);
    row.getCell(6).numFmt = PKR_NUMBER_FORMAT;
    row.getCell(7).numFmt = PKR_NUMBER_FORMAT;
    row.getCell(8).numFmt = PKR_NUMBER_FORMAT;
    row.getCell(9).numFmt = PCT_NUMBER_FORMAT;
    row.getCell(12).numFmt = PKR_NUMBER_FORMAT;
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// -------------------------------------------------------------
// 3. Reserved Units Excel
// -------------------------------------------------------------
export async function generateReservedUnitsExcel(
  data: ReservedUnitsReportData,
  filterDesc: string,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sardar's Mall ERP";
  wb.created = new Date();

  const ws = wb.addWorksheet("Reserved Units", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 4, activeCell: "A5" }],
  });

  applyBrandHeader(ws, "Reserved Units Report", filterDesc, 8);

  const headerRow = ws.getRow(4);
  headerRow.values = [
    "Unit Code",
    "Floor",
    "Client Name",
    "Phone",
    "Reserved On",
    "Expires At",
    "Time Left / Status",
    "Status",
  ];
  applyTableHeaderStyles(headerRow);

  ws.columns = [
    { key: "unitCode", width: 14 },
    { key: "floorName", width: 14 },
    { key: "clientName", width: 22 },
    { key: "clientPhone", width: 16 },
    { key: "reservedOn", width: 14 },
    { key: "expiresAt", width: 18 },
    { key: "timeLeft", width: 18 },
    { key: "status", width: 14 },
  ];

  for (const r of data.rows) {
    const row = ws.addRow({
      unitCode: r.unitCode,
      floorName: r.floorName,
      clientName: r.clientName,
      clientPhone: r.clientPhone,
      reservedOn: new Date(r.reservedOn).toISOString().split("T")[0],
      expiresAt: new Date(r.expiresAt).toLocaleString(),
      timeLeft: r.timeLeft,
      status: r.status,
    });
    applyDataRowStyles(row);
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// -------------------------------------------------------------
// 4. Installments Excel
// -------------------------------------------------------------
export async function generateInstallmentsExcel(
  data: InstallmentsReportData,
  filterDesc: string,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sardar's Mall ERP";
  wb.created = new Date();

  const ws = wb.addWorksheet("Installments", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 4, activeCell: "A5" }],
  });

  applyBrandHeader(ws, "Installments Schedule Report", filterDesc, 10);

  const headerRow = ws.getRow(4);
  headerRow.values = [
    "Booking No",
    "Client Name",
    "Unit Code",
    "Seq #",
    "Due Date",
    "Due Amount",
    "Paid Amount",
    "Balance",
    "Status",
    "Receipt Numbers",
  ];
  applyTableHeaderStyles(headerRow);

  ws.columns = [
    { key: "bookingNo", width: 16 },
    { key: "clientName", width: 22 },
    { key: "unitCode", width: 14 },
    { key: "seq", width: 8 },
    { key: "dueDate", width: 14 },
    { key: "amount", width: 16 },
    { key: "paid", width: 16 },
    { key: "balance", width: 16 },
    { key: "status", width: 14 },
    { key: "receiptNos", width: 24 },
  ];

  for (const r of data.rows) {
    const row = ws.addRow({
      bookingNo: r.bookingNo,
      clientName: r.clientName,
      unitCode: r.unitCode,
      seq: r.seq,
      dueDate: new Date(r.dueDate).toISOString().split("T")[0],
      amount: Number(parseDecimal(r.amount)) / 100,
      paid: Number(parseDecimal(r.paid)) / 100,
      balance: Number(parseDecimal(r.balance)) / 100,
      status: r.status,
      receiptNos: r.receiptNos || "-",
    });

    applyDataRowStyles(row);
    row.getCell(6).numFmt = PKR_NUMBER_FORMAT;
    row.getCell(7).numFmt = PKR_NUMBER_FORMAT;
    row.getCell(8).numFmt = PKR_NUMBER_FORMAT;
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// -------------------------------------------------------------
// 5. Client Ledger Statement Excel
// -------------------------------------------------------------
export async function generateClientLedgerExcel(
  data: ClientLedgerReportData,
  filterDesc: string,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sardar's Mall ERP";
  wb.created = new Date();

  const ws = wb.addWorksheet("Client Statement", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 7, activeCell: "A8" }],
  });

  // Client info header
  const titleRow = ws.getRow(1);
  titleRow.height = 24;
  ws.mergeCells("A1:F1");
  ws.getCell("A1").value = `Sardar's Mall ERP — Client Statement of Account`;
  ws.getCell("A1").font = {
    name: "Segoe UI",
    size: 14,
    bold: true,
    color: { argb: "FF0E3A5B" },
  };

  ws.getCell("A2").value = `Client: ${data.client.fullName} (CNIC: ${data.client.cnic})`;
  ws.getCell("A2").font = { name: "Segoe UI", size: 10, bold: true };
  ws.getCell("A3").value =
    `Phone: ${data.client.phone} | Address: ${data.client.homeAddress}`;
  ws.getCell("A3").font = { name: "Segoe UI", size: 9, color: { argb: "FF64748B" } };

  ws.getCell("A4").value =
    `Period: ${data.statement.period.startDate} to ${data.statement.period.endDate} | ${filterDesc}`;
  ws.getCell("A4").font = {
    name: "Segoe UI",
    size: 9,
    italic: true,
    color: { argb: "FF64748B" },
  };

  ws.getCell("A5").value =
    `Opening Balance: Rs ${data.statement.openingBalancePkr} | Closing Balance: Rs ${data.statement.closingBalancePkr}`;
  ws.getCell("A5").font = {
    name: "Segoe UI",
    size: 10,
    bold: true,
    color: { argb: "FF0E3A5B" },
  };

  ws.getRow(6).height = 8;

  const headerRow = ws.getRow(7);
  headerRow.values = [
    "Date",
    "Description",
    "Receipt #",
    "Debit (Amount Due)",
    "Credit (Paid / Refund)",
    "Running Balance",
  ];
  applyTableHeaderStyles(headerRow);

  ws.columns = [
    { key: "date", width: 14 },
    { key: "description", width: 44 },
    { key: "receiptNo", width: 18 },
    { key: "debit", width: 18 },
    { key: "credit", width: 18 },
    { key: "balance", width: 18 },
  ];

  // Opening balance row
  const openRow = ws.addRow({
    date: data.statement.period.startDate,
    description: "Opening Balance Brought Forward",
    receiptNo: "-",
    debit: 0,
    credit: 0,
    balance: Number(parseDecimal(data.statement.openingBalancePkr)) / 100,
  });
  applyDataRowStyles(openRow);
  openRow.font = { name: "Segoe UI", size: 9, italic: true };
  openRow.getCell(6).numFmt = PKR_NUMBER_FORMAT;

  for (const entry of data.statement.entries) {
    const row = ws.addRow({
      date: new Date(entry.date).toISOString().split("T")[0],
      description: entry.description,
      receiptNo: entry.receiptNo || "-",
      debit: Number(parseDecimal(entry.debitPkr)) / 100,
      credit: Number(parseDecimal(entry.creditPkr)) / 100,
      balance: Number(parseDecimal(entry.runningBalancePkr)) / 100,
    });

    applyDataRowStyles(row);
    row.getCell(4).numFmt = PKR_NUMBER_FORMAT;
    row.getCell(5).numFmt = PKR_NUMBER_FORMAT;
    row.getCell(6).numFmt = PKR_NUMBER_FORMAT;
  }

  // Summary row
  const closeRow = ws.addRow({
    date: data.statement.period.endDate,
    description: "Closing Balance Carried Forward",
    receiptNo: "-",
    debit: Number(parseDecimal(data.statement.totalDebitsPkr)) / 100,
    credit: Number(parseDecimal(data.statement.totalCreditsPkr)) / 100,
    balance: Number(parseDecimal(data.statement.closingBalancePkr)) / 100,
  });
  applyDataRowStyles(closeRow);
  closeRow.font = { name: "Segoe UI", size: 10, bold: true };
  closeRow.getCell(4).numFmt = PKR_NUMBER_FORMAT;
  closeRow.getCell(5).numFmt = PKR_NUMBER_FORMAT;
  closeRow.getCell(6).numFmt = PKR_NUMBER_FORMAT;

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// -------------------------------------------------------------
// 6. Summary Report Excel
// -------------------------------------------------------------
export async function generateSummaryExcel(
  data: SummaryReportData,
  filterDesc: string,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sardar's Mall ERP";
  wb.created = new Date();

  // Sheet 1: Executive Summary
  const ws = wb.addWorksheet("Summary", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 4, activeCell: "A5" }],
  });

  applyBrandHeader(ws, "Executive Summary Report", filterDesc, 5);

  const headerRow = ws.getRow(4);
  headerRow.values = ["Metric", "Count", "Value (PKR)", "Notes", "Status"];
  applyTableHeaderStyles(headerRow);

  ws.columns = [
    { key: "metric", width: 28 },
    { key: "count", width: 12 },
    { key: "value", width: 22 },
    { key: "notes", width: 30 },
    { key: "status", width: 14 },
  ];

  const metrics = [
    {
      metric: "Available Inventory",
      count: data.unitsByStatus.available.count,
      value: Number(parseDecimal(data.unitsByStatus.available.valuePkr)) / 100,
      notes: "Unsold & sellable units",
      status: "Available",
    },
    {
      metric: "Reserved Units",
      count: data.unitsByStatus.reserved.count,
      value: Number(parseDecimal(data.unitsByStatus.reserved.valuePkr)) / 100,
      notes: "Active holds on units",
      status: "Reserved",
    },
    {
      metric: "Booked Units",
      count: data.unitsByStatus.booked.count,
      value: Number(parseDecimal(data.unitsByStatus.booked.valuePkr)) / 100,
      notes: "Units under installment plan",
      status: "Booked",
    },
    {
      metric: "Sold Units",
      count: data.unitsByStatus.sold.count,
      value: Number(parseDecimal(data.unitsByStatus.sold.valuePkr)) / 100,
      notes: "100% paid / completed",
      status: "Sold",
    },
    {
      metric: "Period Sales Value",
      count: data.periodMetrics.salesCount,
      value: Number(parseDecimal(data.periodMetrics.salesValuePkr)) / 100,
      notes: "Sales closed during period",
      status: "Period Sales",
    },
    {
      metric: "Net Collections in Period",
      count: 0,
      value: Number(parseDecimal(data.periodMetrics.collectedPkr)) / 100,
      notes: "Gross collections minus refunds/buybacks",
      status: "Collected",
    },
    {
      metric: "Outstanding Receivables",
      count: 0,
      value: Number(parseDecimal(data.periodMetrics.outstandingReceivablesPkr)) / 100,
      notes: "Remaining balance on active bookings",
      status: "Receivable",
    },
    {
      metric: "Overdue Installments",
      count: data.periodMetrics.overdueCount,
      value: Number(parseDecimal(data.periodMetrics.overdueAmountPkr)) / 100,
      notes: "Past due installments",
      status: "Overdue",
    },
    {
      metric: "Discounts Authorized",
      count: data.periodMetrics.discountsCount,
      value: Number(parseDecimal(data.periodMetrics.discountsGivenPkr)) / 100,
      notes: "Discounts applied in period",
      status: "Discount",
    },
  ];

  for (const m of metrics) {
    const row = ws.addRow(m);
    applyDataRowStyles(row);
    row.getCell(2).numFmt = INT_NUMBER_FORMAT;
    row.getCell(3).numFmt = PKR_NUMBER_FORMAT;
  }

  // Sheet 2: Floor Breakdown
  const wsFloors = wb.addWorksheet("Floor Breakdown");
  const floorHeader = wsFloors.getRow(1);
  floorHeader.values = [
    "Floor",
    "Level",
    "Block",
    "Total Units",
    "Available",
    "Booked",
    "Sold",
    "Total Unit Value",
    "Total Sold Value",
  ];
  applyTableHeaderStyles(floorHeader);

  wsFloors.columns = [
    { key: "floorName", width: 14 },
    { key: "level", width: 8 },
    { key: "blockName", width: 14 },
    { key: "totalUnits", width: 12 },
    { key: "availableCount", width: 12 },
    { key: "bookedCount", width: 12 },
    { key: "soldCount", width: 12 },
    { key: "totalValue", width: 20 },
    { key: "soldValue", width: 20 },
  ];

  for (const f of data.floorBreakdown) {
    const row = wsFloors.addRow({
      floorName: f.floorName,
      level: f.level,
      blockName: f.blockName,
      totalUnits: f.totalUnits,
      availableCount: f.availableCount,
      bookedCount: f.bookedCount,
      soldCount: f.soldCount,
      totalValue: Number(parseDecimal(f.totalValuePkr)) / 100,
      soldValue: Number(parseDecimal(f.soldValuePkr)) / 100,
    });
    applyDataRowStyles(row);
    row.getCell(8).numFmt = PKR_NUMBER_FORMAT;
    row.getCell(9).numFmt = PKR_NUMBER_FORMAT;
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
