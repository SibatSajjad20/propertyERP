import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getClientLedgerReport } from "@/features/reports/queries";
import {
  OverdueNoticePdf,
  type OverdueNoticePdfData,
} from "@/features/reports/pdf/overdue-notice-document";
import { reportFiltersSchema } from "@/features/reports/schema";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { errorMessage } from "@/lib/errors";

export const maxDuration = 60;

function formatMoney(val: number | string): string {
  const n = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession({ redirect: false });
    assertCan(session.user.role, "reports.read");

    const { id } = await context.params;

    const raw: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((val, key) => {
      raw[key] = val;
    });

    const parsedFilters = reportFiltersSchema.parse(raw);
    const data = await getClientLedgerReport(id, parsedFilters);

    if (!data) {
      return new NextResponse("Client statement data not found", { status: 404 });
    }

    // Resolve selected unit or first unit
    const unitId =
      request.nextUrl.searchParams.get("unitId") ||
      data.selectedUnitId ||
      data.units[0]?.unitId;
    let selectedUnit = data.selectedUnitDetails;
    if (!selectedUnit && data.units.length > 0) {
      const u = data.units.find((x) => x.unitId === unitId) || data.units[0]!;
      selectedUnit = {
        unitId: u.unitId,
        unitCode: u.unitCode,
        floorName: u.floorName,
        categoryName: u.categoryName || "Property Unit",
        grossAreaSqft: u.grossAreaSqft || "—",
        netAreaSqft: u.netAreaSqft || "—",
        bookingNo: u.bookingId || null,
        applicationFormNo: null,
        plan: null,
        status: u.relationType,
      };
    }

    if (!selectedUnit) {
      return new NextResponse("No property unit found for this client", { status: 400 });
    }

    // Resolve installment details
    const seqParam = request.nextUrl.searchParams.get("seq");
    const scheduleRows = data.scheduleRows || [];

    // Find requested row or first overdue row or first unpaid row
    let targetRow =
      seqParam && seqParam !== "all"
        ? scheduleRows.find((r) => String(r.seq) === seqParam)
        : null;

    if (!targetRow) {
      targetRow =
        scheduleRows.find((r) => r.status?.toUpperCase() === "OVERDUE") ||
        scheduleRows.find((r) => r.status?.toUpperCase() !== "PAID" && r.seq > 0) ||
        scheduleRows[0];
    }

    // Check if combined all overdue requested
    const isAllOverdue = seqParam === "all";
    let pendingAmountStr = request.nextUrl.searchParams.get("amount") || "";
    let label = targetRow?.label || "Installment Payment";
    const dueDate = targetRow?.dueDate || null;
    const surchargePkr = targetRow?.surchargePkr || null;
    const seq = targetRow?.seq;

    if (isAllOverdue) {
      const overdueRows = scheduleRows.filter(
        (r) =>
          r.status?.toUpperCase() === "OVERDUE" ||
          (r.status?.toUpperCase() !== "PAID" && r.seq > 0),
      );
      const totalOverdue = overdueRows.reduce((acc, r) => {
        const amt = Number(r.amountPkr) || 0;
        const paid = Number(r.paidAmountPkr) || 0;
        return acc + Math.max(0, amt - paid);
      }, 0);
      pendingAmountStr = formatMoney(totalOverdue);
      label = `Overdue Installments (${overdueRows.map((r) => r.label).join(", ") || "Outstanding"})`;
    } else if (!pendingAmountStr && targetRow) {
      const dueAmt = Number(targetRow.amountPkr) || 0;
      const paidAmt = Number(targetRow.paidAmountPkr) || 0;
      const balance = Math.max(0, dueAmt - paidAmt);
      pendingAmountStr = formatMoney(balance > 0 ? balance : dueAmt);
    }

    if (!pendingAmountStr) {
      pendingAmountStr = "0";
    }

    const companyInfo = {
      name: "SARDAR'S MALL",
      address: "54-C Iran Road, Block C, near Chandni Chowk, Rawalpindi",
      phone: "+92 51 111-727-327",
      email: "info@sardarsmall.com",
    };

    // Read issuer from query param or fallback to current logged-in user
    const issuerName =
      request.nextUrl.searchParams.get("issuer")?.trim() ||
      session.user.name ||
      "Management";
    const issuerDesignation =
      request.nextUrl.searchParams.get("designation")?.trim() ||
      "Recovery & Accounts Management";

    const noticeData: OverdueNoticePdfData = {
      noticeNo: `SM/NOT-${selectedUnit.unitCode.replace(/[^a-zA-Z0-9]/g, "")}/${new Date().getFullYear()}`,
      issueDate: new Date(),
      client: {
        title: data.client.title || "Mr",
        fullName: data.client.fullName,
        relationPrefix: data.client.relationPrefix || "S/O",
        relationName: data.client.relationName || "",
        cnic: data.client.cnic,
        phone: data.client.phone,
        address: data.client.homeAddress || data.client.postalAddress,
      },
      unit: {
        unitCode: selectedUnit.unitCode,
        floorName: selectedUnit.floorName,
        categoryName: selectedUnit.categoryName,
        grossAreaSqft: selectedUnit.grossAreaSqft,
        netAreaSqft: selectedUnit.netAreaSqft,
        bookingNo: selectedUnit.bookingNo,
        applicationFormNo: selectedUnit.applicationFormNo,
      },
      installment: {
        seq,
        label,
        milestoneName: request.nextUrl.searchParams.get("milestone") || undefined,
        dueDate,
        dueAmountPkr: pendingAmountStr,
        pendingAmountPkr: pendingAmountStr,
        surchargePkr,
      },
      issuedBy: {
        name: issuerName,
        designation: issuerDesignation,
      },
      company: companyInfo,
    };

    const download = request.nextUrl.searchParams.get("download") === "1";
    const mode =
      request.nextUrl.searchParams.get("mode") === "print" ? "print" : "download";
    const disposition = download ? "attachment" : "inline";

    const pdfBuffer = await renderToBuffer(OverdueNoticePdf({ data: noticeData, mode }));
    const stamp = new Date().toISOString().slice(0, 10);
    const sanitizedName = data.client.fullName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `sardars-mall-overdue-notice-${sanitizedName}-${selectedUnit.unitCode}-${stamp}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "frame-ancestors 'self'",
      },
    });
  } catch (error) {
    console.error("Overdue notice PDF export error:", error);
    return new NextResponse(errorMessage(error), { status: 500 });
  }
}
