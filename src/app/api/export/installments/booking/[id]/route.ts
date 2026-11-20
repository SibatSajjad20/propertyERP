import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getBookingDetail } from "@/features/sales/queries";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { errorMessage } from "@/lib/errors";
import { parseDecimal } from "@/lib/money";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession({ redirect: false });
    assertCan(session.user.role, "installments.read");

    const { id } = await context.params;
    const detail = await getBookingDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = "Sardar's Mall ERP";
    wb.created = new Date();

    const ws = wb.addWorksheet("Installment Schedule", {
      views: [{ state: "frozen", xSplit: 0, ySplit: 7, activeCell: "A8" }],
    });

    // Brand Header
    ws.mergeCells("A1:H1");
    ws.getCell("A1").value = "Sardar's Mall ERP — Installment Schedule Statement";
    ws.getCell("A1").font = {
      name: "Segoe UI",
      size: 14,
      bold: true,
      color: { argb: "FF0B558B" },
    };

    ws.getCell("A2").value =
      `Client: ${detail.booking.clientName} (CNIC: ${detail.booking.clientCnic}) | Phone: ${detail.booking.clientPhone}`;
    ws.getCell("A2").font = { name: "Segoe UI", size: 10, bold: true };

    ws.getCell("A3").value =
      `Unit: ${detail.booking.unitCode} (${detail.booking.floorName}) | Booking #: ${detail.booking.bookingNo} | Plan: ${detail.booking.plan}`;
    ws.getCell("A3").font = { name: "Segoe UI", size: 9, color: { argb: "FF64748B" } };

    ws.getCell("A4").value =
      `Net Contract Price: Rs ${detail.booking.netPrice} | Total Paid: Rs ${detail.booking.paidTotal} | Balance: Rs ${detail.booking.remainingBalancePkr}`;
    ws.getCell("A4").font = {
      name: "Segoe UI",
      size: 10,
      bold: true,
      color: { argb: "FF0B558B" },
    };

    ws.getCell("A5").value = `Generated: ${new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
    ws.getCell("A5").font = {
      name: "Segoe UI",
      size: 9,
      italic: true,
      color: { argb: "FF64748B" },
    };

    const headerRow = ws.getRow(7);
    headerRow.values = [
      "Sr #",
      "Milestone / Description",
      "Due Date",
      "Due Amount (PKR)",
      "Paid Amount (PKR)",
      "Status",
      "Paid Date",
      "Receipt #",
    ];
    headerRow.font = {
      name: "Segoe UI",
      size: 10,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0B558B" },
    };

    ws.columns = [
      { key: "seq", width: 8 },
      { key: "label", width: 28 },
      { key: "dueDate", width: 14 },
      { key: "amount", width: 18 },
      { key: "paidAmount", width: 18 },
      { key: "status", width: 14 },
      { key: "paidDate", width: 14 },
      { key: "receiptNo", width: 24 },
    ];

    for (const inst of detail.installments) {
      const row = ws.addRow({
        seq: inst.seq,
        label: inst.label || `Installment #${inst.seq}`,
        dueDate: new Date(inst.dueDate).toISOString().split("T")[0],
        amount: Number(parseDecimal(inst.amount)) / 100,
        paidAmount: Number(parseDecimal(inst.paidAmount)) / 100,
        status: inst.status,
        paidDate: inst.paidAt ? new Date(inst.paidAt).toISOString().split("T")[0] : "-",
        receiptNo: inst.receiptNos || "-",
      });
      row.getCell(4).numFmt = '"Rs "#,##0;[Red]-"Rs "#,##0;"Rs "0';
      row.getCell(5).numFmt = '"Rs "#,##0;[Red]-"Rs "#,##0;"Rs "0';
    }

    // Sheet 2: Payment Receipts
    const ws2 = wb.addWorksheet("Payment Receipts");
    ws2.mergeCells("A1:F1");
    ws2.getCell("A1").value =
      `Sardar's Mall ERP — Payment Receipts for Booking #${detail.booking.bookingNo}`;
    ws2.getCell("A1").font = {
      name: "Segoe UI",
      size: 13,
      bold: true,
      color: { argb: "FF0B558B" },
    };

    const h2 = ws2.getRow(3);
    h2.values = [
      "Receipt #",
      "Date",
      "Category",
      "Method",
      "Amount (PKR)",
      "Surcharge (PKR)",
    ];
    h2.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    h2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B558B" } };

    ws2.columns = [
      { key: "receiptNo", width: 20 },
      { key: "date", width: 14 },
      { key: "category", width: 16 },
      { key: "method", width: 16 },
      { key: "amount", width: 18 },
      { key: "surcharge", width: 16 },
    ];

    for (const p of detail.payments.filter((x) => !x.isVoided)) {
      const r = ws2.addRow({
        receiptNo: p.receiptNo,
        date: new Date(p.paidAt).toISOString().split("T")[0],
        category: p.category,
        method: p.method,
        amount: Number(parseDecimal(p.amount)) / 100,
        surcharge: Number(parseDecimal(p.surchargeAmount || "0")) / 100,
      });
      r.getCell(5).numFmt = '"Rs "#,##0;[Red]-"Rs "#,##0;"Rs "0';
      r.getCell(6).numFmt = '"Rs "#,##0;[Red]-"Rs "#,##0;"Rs "0';
    }

    const buffer = await wb.xlsx.writeBuffer();
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `sardars-mall-booking-${detail.booking.bookingNo}-schedule-${stamp}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
