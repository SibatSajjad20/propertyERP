import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatPkr } from "@/lib/money";
import { SARDARS_MALL_MARK_DATA_URL } from "@/features/documents/pdf/logo-base64";
import type { ClientLedgerReportData } from "../queries";

export interface ClientLedgerPdfProps {
  data: ClientLedgerReportData;
  mode?: "print" | "download";
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 42,
    paddingHorizontal: 36,
    fontSize: 7.8,
    fontFamily: "Helvetica",
    color: "#0F172A",
    lineHeight: 1.35,
  },
  headerBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: "#0B558B",
    paddingBottom: 6,
    marginBottom: 8,
  },
  brandLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandLogo: {
    width: 34,
    height: 40,
    objectFit: "contain",
    marginRight: 8,
  },
  brandTextGroup: {
    flexDirection: "column",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
    letterSpacing: 0.5,
    lineHeight: 1.25,
    marginBottom: 2,
  },
  allotmentTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    letterSpacing: 0.2,
    lineHeight: 1.25,
  },
  rightStampBox: {
    alignItems: "flex-end",
    paddingTop: 2,
  },
  statementDate: {
    fontSize: 7.5,
    color: "#475569",
    lineHeight: 1.3,
  },
  badgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
    backgroundColor: "#F0F9FF",
    borderWidth: 0.5,
    borderColor: "#BAE6FD",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginTop: 3,
    lineHeight: 1.2,
  },
  twoColGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 7,
  },
  sectionBanner: {
    backgroundColor: "#1E293B",
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    fontSize: 7.8,
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  detailsBox: {
    flex: 1,
    borderWidth: 0.8,
    borderColor: "#CBD5E1",
  },
  detailsBody: {
    padding: 5,
    backgroundColor: "#FFFFFF",
  },
  dataRow: {
    flexDirection: "row",
    marginBottom: 2.5,
    alignItems: "center",
  },
  dataLabel: {
    width: "42%",
    fontSize: 7.2,
    color: "#475569",
    fontFamily: "Helvetica",
  },
  dataValue: {
    width: "58%",
    fontSize: 7.2,
    color: "#0F172A",
    fontFamily: "Helvetica-Bold",
  },
  table: {
    borderWidth: 0.8,
    borderColor: "#CBD5E1",
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#CBD5E1",
    minHeight: 16,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#F1F5F9",
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 1,
    borderBottomColor: "#94A3B8",
    fontSize: 6.5,
  },
  payHeaderCell: {
    fontFamily: "Helvetica-Bold",
    color: "#1E293B",
    textAlign: "center",
  },
  payColSeq: {
    width: "3.5%",
    padding: 2.5,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColItem: {
    width: "19%",
    padding: 2.5,
    paddingLeft: 4,
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColDueDate: {
    width: "8.5%",
    padding: 2.5,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColDueAmt: {
    width: "10.5%",
    padding: 2.5,
    paddingRight: 4,
    textAlign: "right",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColPaidDate: {
    width: "8.5%",
    padding: 2.5,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColPaidAmt: {
    width: "10.5%",
    padding: 2.5,
    paddingRight: 4,
    textAlign: "right",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColBalanceDue: {
    width: "10.5%",
    padding: 2.5,
    paddingRight: 4,
    textAlign: "right",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColReceipt: {
    width: "10.5%",
    padding: 2.5,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColSurcharge: {
    width: "8.5%",
    padding: 2.5,
    paddingRight: 4,
    textAlign: "right",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColStatus: {
    width: "10%",
    padding: 2.5,
    textAlign: "center",
  },
  payTotalLabelCol: {
    width: "31%",
    padding: 2.5,
    paddingRight: 6,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    color: "#1E293B",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  tableFooterRow: {
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#94A3B8",
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
  },
  totalDueCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderWidth: 0.8,
    borderColor: "#BAE6FD",
    borderRadius: 3,
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    marginBottom: 5,
  },
  totalDueCardLeft: {
    flexDirection: "column",
  },
  totalDueCardTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  totalDueCardSub: {
    fontSize: 6,
    color: "#64748B",
    fontFamily: "Helvetica",
    marginTop: 1,
  },
  totalDueCardRight: {
    alignItems: "flex-end",
  },
  totalDueCardValue: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#CBD5E1",
    paddingTop: 4,
    fontSize: 6.8,
    color: "#64748B",
  },
  footerAddress: {
    fontSize: 6.8,
    color: "#475569",
    fontFamily: "Helvetica",
  },
  footerPageNumber: {
    fontSize: 6.8,
    color: "#64748B",
    fontFamily: "Helvetica",
  },
  printedByText: {
    fontSize: 6.8,
    color: "#64748B",
    fontFamily: "Helvetica-Oblique",
    marginTop: 4,
  },
  termsBox: {
    borderWidth: 0.8,
    borderColor: "#CBD5E1",
    marginTop: 6,
    marginBottom: 4,
    backgroundColor: "#FFFFFF",
  },
  termsBanner: {
    backgroundColor: "#1E293B",
    paddingVertical: 3,
    paddingHorizontal: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  termsBannerTitle: {
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  termsBannerSub: {
    color: "#94A3B8",
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    letterSpacing: 0.3,
  },
  termsContent: {
    flexDirection: "row",
    gap: 8,
    padding: 5,
  },
  termsLeftCol: {
    flex: 1.5,
  },
  termsRightCol: {
    flex: 1,
  },
  termItem: {
    flexDirection: "row",
    marginBottom: 2,
    alignItems: "flex-start",
  },
  termBullet: {
    width: 7,
    fontSize: 6,
    color: "#0B558B",
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.25,
  },
  termText: {
    flex: 1,
    fontSize: 6,
    color: "#334155",
    lineHeight: 1.25,
  },
  bankCard: {
    borderWidth: 0.8,
    borderColor: "#BAE6FD",
    backgroundColor: "#F0F9FF",
  },
  bankCardHeader: {
    backgroundColor: "#0B558B",
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    paddingVertical: 2,
    paddingHorizontal: 4,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  bankCardBody: {
    padding: 4,
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 1.8,
    alignItems: "center",
  },
  bankLabel: {
    width: "40%",
    fontSize: 5.8,
    color: "#475569",
    fontFamily: "Helvetica-Bold",
  },
  bankValue: {
    width: "60%",
    fontSize: 5.8,
    color: "#0F172A",
    fontFamily: "Helvetica-Bold",
  },
  termsFooterNote: {
    borderTopWidth: 0.5,
    borderTopColor: "#E2E8F0",
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
  },
  systemGenText: {
    fontSize: 6,
    color: "#64748B",
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
  },
  signatureBlock: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  signatureCol: {
    flex: 1,
  },
  sigBox: {
    borderWidth: 0.8,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    padding: 6,
  },
  sigRole: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
    color: "#0B558B",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    borderBottomWidth: 0.8,
    borderBottomColor: "#0B558B",
    paddingBottom: 2,
    marginBottom: 5,
  },
  sigLineGroup: {
    gap: 4,
  },
  sigFieldRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  sigFieldLabel: {
    width: 48,
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
  },
  sigDottedLine: {
    flex: 1,
    borderBottomWidth: 0.8,
    borderBottomColor: "#94A3B8",
    height: 10,
  },
});

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: Date) {
  const d = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const t = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${d} ${t}`;
}

function computeScheduleRowsWithBalance(
  scheduleRows: NonNullable<ClientLedgerReportData["scheduleRows"]>,
) {
  let totalDue = 0;
  let totalPaid = 0;
  let runningBal = 0;

  const rows = scheduleRows.map((row) => {
    const dueAmt = Number(row.amountPkr) || 0;
    const isPaid = row.status?.toUpperCase() === "PAID";
    const hasPaidAmt = row.paidAmountPkr && Number(row.paidAmountPkr) > 0;
    const paidAmt = hasPaidAmt ? Number(row.paidAmountPkr) : isPaid ? dueAmt : 0;

    totalDue += dueAmt;
    totalPaid += paidAmt;
    runningBal = Math.max(0, runningBal + (dueAmt - paidAmt));

    return {
      ...row,
      dueAmt,
      paidAmt,
      hasPaidAmt,
      isPaid,
      balanceDue: runningBal,
    };
  });

  return {
    rows,
    totalDue,
    totalPaid,
    totalBalanceDue: Math.max(0, totalDue - totalPaid),
  };
}

function computeFallbackEntriesWithBalance(
  entries: ClientLedgerReportData["statement"]["entries"],
) {
  let totalDue = 0;
  let totalPaid = 0;
  let runningBal = 0;

  const rows = entries.map((entry) => {
    const dueAmt = Number(entry.debitPkr) || 0;
    const paidAmt = Number(entry.creditPkr) || 0;

    totalDue += dueAmt;
    totalPaid += paidAmt;
    runningBal = Math.max(0, runningBal + (dueAmt - paidAmt));

    return {
      ...entry,
      dueAmt,
      paidAmt,
      balanceDue: runningBal,
    };
  });

  return {
    rows,
    totalDue,
    totalPaid,
    totalBalanceDue: Math.max(0, totalDue - totalPaid),
  };
}

export function ClientLedgerPdf({ data, mode = "download" }: ClientLedgerPdfProps) {
  const isPrint = mode === "print";
  const { client, nextOfKin, selectedUnitDetails, financials, scheduleRows, statement } =
    data;
  const now = new Date();

  // Compute running balance due and totals for Schedule B
  const scheduleData =
    scheduleRows && scheduleRows.length > 0
      ? computeScheduleRowsWithBalance(scheduleRows)
      : null;
  const fallbackData = !scheduleData
    ? computeFallbackEntriesWithBalance(statement.entries)
    : null;

  const rowsWithBalance = scheduleData?.rows ?? [];
  const fallbackEntriesWithBalance = fallbackData?.rows ?? [];
  const finalTotalDue = scheduleData?.totalDue ?? fallbackData?.totalDue ?? 0;
  const finalTotalPaid = scheduleData?.totalPaid ?? fallbackData?.totalPaid ?? 0;
  const finalTotalBalanceDue =
    scheduleData?.totalBalanceDue ?? fallbackData?.totalBalanceDue ?? 0;

  const titlePrefix = client.title ? `${client.title} ` : "";
  const clientDisplayName = `${titlePrefix}${client.fullName}`.trim();
  const soDoWoName =
    client.relationPrefix && client.relationName
      ? `${client.relationPrefix} ${client.relationName}`
      : client.relationName || "N/A";

  const unitCodeDisplay =
    selectedUnitDetails?.unitCode || (data.units[0]?.unitCode ?? "All Units");
  const formNoDisplay =
    selectedUnitDetails?.applicationFormNo || selectedUnitDetails?.bookingNo || "N/A";

  return (
    <Document title={`Allotment-Details-${unitCodeDisplay}-${client.fullName}`}>
      <Page size="A4" style={styles.page} wrap>
        {/* Top Header matching reference document - repeated on every page */}
        <View style={styles.headerBanner} fixed>
          <View style={styles.brandLeft}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={SARDARS_MALL_MARK_DATA_URL} style={styles.brandLogo} />
            <View style={styles.brandTextGroup}>
              <Text style={styles.brandTitle}>SARDAR&apos;S MALL</Text>
              <Text style={styles.allotmentTitle}>
                Allotment Details ({unitCodeDisplay})
              </Text>
            </View>
          </View>
          <View style={styles.rightStampBox}>
            <Text style={styles.statementDate}>Date: {formatDate(now)}</Text>
            <Text style={styles.badgeText}>Form #: {formNoDisplay}</Text>
          </View>
        </View>

        {/* Page Footer - fixed on all pages */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerAddress}>
            Sardar&apos;s Mall • 54-C Iran Road, Block C, near Chandni Chowk, Rawalpindi
          </Text>
          <Text
            style={styles.footerPageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>

        {/* Client Details & Nominee Details (side-by-side) */}
        <View style={styles.twoColGrid}>
          {/* Client Details */}
          <View style={styles.detailsBox}>
            <Text style={styles.sectionBanner}>Client Details</Text>
            <View style={styles.detailsBody}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Name :</Text>
                <Text style={styles.dataValue}>{clientDisplayName}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>So/Do/Wo Name :</Text>
                <Text style={styles.dataValue}>{soDoWoName}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>CNIC :</Text>
                <Text style={styles.dataValue}>{client.cnic}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Phone No :</Text>
                <Text style={styles.dataValue}>{client.phone}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Email :</Text>
                <Text style={styles.dataValue}>{client.email || "N/A"}</Text>
              </View>
              <View style={[styles.dataRow, { alignItems: "flex-start" }]}>
                <Text style={styles.dataLabel}>Present Address :</Text>
                <Text style={[styles.dataValue, { fontSize: 6.8 }]}>
                  {client.homeAddress || "N/A"}
                </Text>
              </View>
              <View style={[styles.dataRow, { alignItems: "flex-start" }]}>
                <Text style={styles.dataLabel}>Permanent Address :</Text>
                <Text style={[styles.dataValue, { fontSize: 6.8 }]}>
                  {client.postalAddress || client.homeAddress || "N/A"}
                </Text>
              </View>
            </View>
          </View>

          {/* Nominee Details */}
          <View style={styles.detailsBox}>
            <Text style={styles.sectionBanner}>Nominee Details</Text>
            <View style={styles.detailsBody}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Nominee Name :</Text>
                <Text style={styles.dataValue}>{nextOfKin?.name || "N/A"}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Relationship :</Text>
                <Text style={styles.dataValue}>{nextOfKin?.relation || "N/A"}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Nominee CNIC :</Text>
                <Text style={styles.dataValue}>{nextOfKin?.cnic || "N/A"}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Phone No :</Text>
                <Text style={styles.dataValue}>{nextOfKin?.phone || "N/A"}</Text>
              </View>
              <View style={[styles.dataRow, { alignItems: "flex-start" }]}>
                <Text style={styles.dataLabel}>Address :</Text>
                <Text style={[styles.dataValue, { fontSize: 6.8 }]}>
                  {nextOfKin?.address || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* File Details & Financial Details (side-by-side) */}
        <View style={styles.twoColGrid}>
          {/* File Details */}
          <View style={styles.detailsBox}>
            <Text style={styles.sectionBanner}>File Details</Text>
            <View style={styles.detailsBody}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Project Name :</Text>
                <Text style={styles.dataValue}>Sardar&apos;s Mall</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Provisional Sector :</Text>
                <Text style={styles.dataValue}>Commercial</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Floor / Unit :</Text>
                <Text style={styles.dataValue}>
                  {selectedUnitDetails?.floorName
                    ? `${selectedUnitDetails.floorName} (${selectedUnitDetails.unitCode})`
                    : unitCodeDisplay}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Category :</Text>
                <Text style={styles.dataValue}>
                  {selectedUnitDetails?.categoryName || "Office / Retail"}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Size :</Text>
                <Text style={styles.dataValue}>
                  {selectedUnitDetails?.grossAreaSqft &&
                  selectedUnitDetails.grossAreaSqft !== "—"
                    ? `${selectedUnitDetails.grossAreaSqft} Sq Ft`
                    : selectedUnitDetails?.netAreaSqft &&
                        selectedUnitDetails.netAreaSqft !== "—"
                      ? `${selectedUnitDetails.netAreaSqft} Sq Ft`
                      : "—"}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Form No :</Text>
                <Text style={styles.dataValue}>{formNoDisplay}</Text>
              </View>
            </View>
          </View>

          {/* Financial Details */}
          <View style={styles.detailsBox}>
            <Text style={styles.sectionBanner}>Financial Details</Text>
            <View style={styles.detailsBody}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Price :</Text>
                <Text style={styles.dataValue}>
                  {formatPkr(financials?.listPrice || statement.totalDebitsPkr)}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Discount :</Text>
                <Text style={styles.dataValue}>
                  {financials?.discountValue && Number(financials.discountValue) > 0
                    ? formatPkr(financials.discountValue)
                    : "Rs 0"}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Net Price :</Text>
                <Text style={styles.dataValue}>
                  {formatPkr(financials?.netPrice || statement.totalDebitsPkr)}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Paid Amount :</Text>
                <Text style={[styles.dataValue, { color: "#166534" }]}>
                  {formatPkr(financials?.paidTotal || statement.totalCreditsPkr)}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Surcharge :</Text>
                <Text
                  style={[
                    styles.dataValue,
                    financials?.surchargeAmount && Number(financials.surchargeAmount) > 0
                      ? { color: "#B91C1C" }
                      : {},
                  ]}
                >
                  {formatPkr(financials?.surchargeAmount || "0.00")}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Govt Charges :</Text>
                <Text style={styles.dataValue}>
                  {formatPkr(financials?.govtCharges || "0.00")}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Outstanding Balance :</Text>
                <Text style={[styles.dataValue, { color: "#0B558B" }]}>
                  {formatPkr(financials?.remainingAmount || statement.closingBalancePkr)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Installment Details (Schedule B) Header */}
        <View style={{ marginBottom: 4 }}>
          <Text style={[styles.sectionBanner, { borderRadius: 3 }]}>
            Installment Details (Payment Schedule - Schedule B)
          </Text>
        </View>

        {/* Total Due Card on top of Schedule B Table */}
        <View style={styles.totalDueCard}>
          <View style={styles.totalDueCardLeft}>
            <Text style={styles.totalDueCardTitle}>Total Due Amount</Text>
            <Text style={styles.totalDueCardSub}>
              Total scheduled payment obligations across all milestones
            </Text>
          </View>
          <View style={styles.totalDueCardRight}>
            <Text style={styles.totalDueCardValue}>
              {formatPkr(finalTotalDue.toFixed(2))}
            </Text>
          </View>
        </View>

        {/* Schedule B Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]} wrap={false}>
            <View style={[styles.payColSeq, styles.payHeaderCell]}>
              <Text>Sr #</Text>
            </View>
            <View style={[styles.payColItem, styles.payHeaderCell]}>
              <Text>Payment Milestone / Installment</Text>
            </View>
            <View style={[styles.payColDueDate, styles.payHeaderCell]}>
              <Text>Due Date</Text>
            </View>
            <View style={[styles.payColDueAmt, styles.payHeaderCell]}>
              <Text>Due Amount</Text>
            </View>
            <View style={[styles.payColPaidDate, styles.payHeaderCell]}>
              <Text>Paid Date</Text>
            </View>
            <View style={[styles.payColPaidAmt, styles.payHeaderCell]}>
              <Text>Paid Amount</Text>
            </View>
            <View style={[styles.payColBalanceDue, styles.payHeaderCell]}>
              <Text>Balance Due</Text>
            </View>
            <View style={[styles.payColReceipt, styles.payHeaderCell]}>
              <Text>Receipt No</Text>
            </View>
            <View style={[styles.payColSurcharge, styles.payHeaderCell]}>
              <Text>Surcharge</Text>
            </View>
            <View style={[styles.payColStatus, styles.payHeaderCell]}>
              <Text>Status</Text>
            </View>
          </View>

          {/* Rows */}
          {rowsWithBalance && rowsWithBalance.length > 0
            ? rowsWithBalance.map((row) => {
                const paidAmtStr = row.hasPaidAmt
                  ? formatPkr(row.paidAmountPkr!)
                  : row.isPaid
                    ? formatPkr(row.amountPkr)
                    : "—";
                const paidDateStr = row.paidDate ? formatDate(row.paidDate) : "—";
                const hasSurcharge =
                  row.surchargePkr &&
                  row.surchargePkr !== "—" &&
                  Number(row.surchargePkr) > 0;
                const surchargeStr = hasSurcharge ? formatPkr(row.surchargePkr!) : "—";

                return (
                  <View
                    key={row.seq}
                    style={[
                      styles.tableRow,
                      { fontSize: 6.5 },
                      row.seq === 0 ? { backgroundColor: "#F8FAFC" } : {},
                    ]}
                    wrap={false}
                  >
                    <View style={styles.payColSeq}>
                      <Text>{row.seq}</Text>
                    </View>
                    <View style={styles.payColItem}>
                      <Text style={row.seq === 0 ? styles.bold : undefined}>
                        {row.seq === 0 ? "Down Payment" : row.label}
                      </Text>
                    </View>
                    <View style={styles.payColDueDate}>
                      <Text>{formatDate(row.dueDate)}</Text>
                    </View>
                    <View style={styles.payColDueAmt}>
                      <Text style={styles.bold}>{formatPkr(row.amountPkr)}</Text>
                    </View>
                    <View style={styles.payColPaidDate}>
                      <Text>{paidDateStr}</Text>
                    </View>
                    <View style={styles.payColPaidAmt}>
                      <Text
                        style={row.hasPaidAmt || row.isPaid ? styles.bold : undefined}
                      >
                        {paidAmtStr}
                      </Text>
                    </View>
                    <View style={styles.payColBalanceDue}>
                      <Text
                        style={[
                          styles.bold,
                          {
                            color: row.balanceDue > 0 ? "#0B558B" : "#475569",
                          },
                        ]}
                      >
                        {formatPkr(row.balanceDue.toFixed(2))}
                      </Text>
                    </View>
                    <View style={styles.payColReceipt}>
                      <Text style={{ fontSize: 6.2 }}>{row.receiptNo || "—"}</Text>
                    </View>
                    <View
                      style={[
                        styles.payColSurcharge,
                        !hasSurcharge
                          ? { textAlign: "center", paddingRight: 0 }
                          : undefined,
                      ]}
                    >
                      <Text>{surchargeStr}</Text>
                    </View>
                    <View style={styles.payColStatus}>
                      <Text
                        style={[
                          styles.bold,
                          {
                            color: row.isPaid
                              ? "#166534"
                              : row.status?.toUpperCase() === "OVERDUE"
                                ? "#991B1B"
                                : "#475569",
                          },
                        ]}
                      >
                        {row.status?.toUpperCase() || "PENDING"}
                      </Text>
                    </View>
                  </View>
                );
              })
            : /* Fallback to statement entries if scheduleRows is empty */
              fallbackEntriesWithBalance.map((entry, idx) => (
                <View key={idx} style={[styles.tableRow, { fontSize: 6.5 }]} wrap={false}>
                  <View style={styles.payColSeq}>
                    <Text>{idx + 1}</Text>
                  </View>
                  <View style={styles.payColItem}>
                    <Text>{entry.description}</Text>
                  </View>
                  <View style={styles.payColDueDate}>
                    <Text>{formatDate(entry.date)}</Text>
                  </View>
                  <View style={styles.payColDueAmt}>
                    <Text>{formatPkr(entry.debitPkr)}</Text>
                  </View>
                  <View style={styles.payColPaidDate}>
                    <Text>{formatDate(entry.date)}</Text>
                  </View>
                  <View style={styles.payColPaidAmt}>
                    <Text>{formatPkr(entry.creditPkr)}</Text>
                  </View>
                  <View style={styles.payColBalanceDue}>
                    <Text style={styles.bold}>
                      {formatPkr(entry.balanceDue.toFixed(2))}
                    </Text>
                  </View>
                  <View style={styles.payColReceipt}>
                    <Text>{entry.receiptNo || "—"}</Text>
                  </View>
                  <View
                    style={[
                      styles.payColSurcharge,
                      { textAlign: "center", paddingRight: 0 },
                    ]}
                  >
                    <Text>—</Text>
                  </View>
                  <View style={styles.payColStatus}>
                    <Text style={[styles.bold, { color: "#166534" }]}>RECORDED</Text>
                  </View>
                </View>
              ))}

          {/* Schedule B Table Totals Row */}
          <View style={[styles.tableRow, styles.tableFooterRow]} wrap={false}>
            <View style={styles.payTotalLabelCol}>
              <Text>TOTAL</Text>
            </View>
            <View style={styles.payColDueAmt}>
              <Text style={styles.bold}>{formatPkr(finalTotalDue.toFixed(2))}</Text>
            </View>
            <View style={styles.payColPaidDate}>
              <Text>—</Text>
            </View>
            <View style={styles.payColPaidAmt}>
              <Text style={[styles.bold, { color: "#166534" }]}>
                {formatPkr(finalTotalPaid.toFixed(2))}
              </Text>
            </View>
            <View style={styles.payColBalanceDue}>
              <Text style={[styles.bold, { color: "#0B558B" }]}>
                {formatPkr(finalTotalBalanceDue.toFixed(2))}
              </Text>
            </View>
            <View style={styles.payColReceipt}>
              <Text>—</Text>
            </View>
            <View
              style={[styles.payColSurcharge, { textAlign: "center", paddingRight: 0 }]}
            >
              <Text>—</Text>
            </View>
            <View style={styles.payColStatus}>
              <Text>—</Text>
            </View>
          </View>
        </View>

        {/* Important Notes — Terms & Conditions */}
        <View style={styles.termsBox} wrap={false}>
          <View style={styles.termsBanner}>
            <Text style={styles.termsBannerTitle}>
              IMPORTANT NOTES – TERMS &amp; CONDITIONS
            </Text>
            <Text style={styles.termsBannerSub}>SARDAR MALL</Text>
          </View>
          <View style={styles.termsContent}>
            {/* Left Column: Terms & Policies */}
            <View style={styles.termsLeftCol}>
              <View style={styles.termItem}>
                <Text style={styles.termBullet}>•</Text>
                <Text style={styles.termText}>
                  <Text style={styles.bold}>Down Payment: </Text>
                  Must be paid exclusively through a Pay Order in favour of Sardar Mall.
                  No other payment method shall be accepted.
                </Text>
              </View>

              <View style={styles.termItem}>
                <Text style={styles.termBullet}>•</Text>
                <Text style={styles.termText}>
                  <Text style={styles.bold}>Installment Payments: </Text>
                  Shall be made through cash deposits, online banking, ATM transfers, or
                  electronic fund transfers from any bank within Pakistan into the
                  Company&apos;s designated UBL account.
                </Text>
              </View>

              <View style={styles.termItem}>
                <Text style={styles.termBullet}>•</Text>
                <Text style={styles.termText}>
                  <Text style={styles.bold}>Payment Deadline: </Text>
                  Installments must be paid within 15 days of their respective due dates.
                  Late payments shall attract a surcharge of 0.05% per day on the overdue
                  amount.
                </Text>
              </View>

              <View style={styles.termItem}>
                <Text style={styles.termBullet}>•</Text>
                <Text style={styles.termText}>
                  <Text style={styles.bold}>Payment Verification: </Text>
                  Customers must retain all payment receipts as proof of payment for
                  future verification, rectification of discrepancies, and account
                  reconciliation.
                </Text>
              </View>

              <View style={styles.termItem}>
                <Text style={styles.termBullet}>•</Text>
                <Text style={styles.termText}>
                  <Text style={styles.bold}>Account Reconciliation: </Text>
                  Customers should review their account statements and promptly report any
                  discrepancies to the Accounts Department with supporting evidence.
                </Text>
              </View>

              <View style={styles.termItem}>
                <Text style={styles.termBullet}>•</Text>
                <Text style={styles.termText}>
                  <Text style={styles.bold}>Taxes &amp; Charges: </Text>
                  All applicable government taxes, statutory duties, and other legally
                  imposed charges shall be payable as applicable.
                </Text>
              </View>

              <View style={styles.termItem}>
                <Text style={styles.termBullet}>•</Text>
                <Text style={styles.termText}>
                  <Text style={styles.bold}>Customer Information: </Text>
                  Any change in contact number, mailing address, or other particulars must
                  be promptly communicated to Sardar Mall.
                </Text>
              </View>

              <View style={styles.termItem}>
                <Text style={styles.termBullet}>•</Text>
                <Text style={styles.termText}>
                  <Text style={styles.bold}>Statement Disclaimer: </Text>
                  This statement is for information and reconciliation purposes only and
                  does not constitute proof of ownership or transfer of title.
                </Text>
              </View>
            </View>

            {/* Right Column: Designated Bank Account Details Card */}
            <View style={styles.termsRightCol}>
              <View style={styles.bankCard}>
                <Text style={styles.bankCardHeader}>Designated Bank Details</Text>
                <View style={styles.bankCardBody}>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Bank:</Text>
                    <Text style={styles.bankValue}>United Bank Limited (UBL)</Text>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Title:</Text>
                    <Text style={styles.bankValue}>ASSH Developers (Pvt.) Ltd.</Text>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Account #:</Text>
                    <Text style={styles.bankValue}>299201412</Text>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Branch Code:</Text>
                    <Text style={styles.bankValue}>0372</Text>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Branch:</Text>
                    <Text style={styles.bankValue}>Satellite Town, Rawalpindi</Text>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>IBAN:</Text>
                    <Text style={[styles.bankValue, { fontSize: 5 }]}>
                      PK35UNIL0109000299201412
                    </Text>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>SWIFT:</Text>
                    <Text style={styles.bankValue}>UNILPKKA741</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* System Generated Statement Note for Download Mode */}
          {!isPrint ? (
            <View style={styles.termsFooterNote}>
              <Text style={styles.systemGenText}>
                This is a system-generated statement and does not require a signature.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Signature Fields for Print Mode */}
        {isPrint ? (
          <View style={styles.signatureBlock} wrap={false}>
            <View style={styles.signatureCol}>
              <View style={styles.sigBox}>
                <Text style={styles.sigRole}>Prepared By</Text>
                <View style={styles.sigLineGroup}>
                  <View style={styles.sigFieldRow}>
                    <Text style={styles.sigFieldLabel}>Name:</Text>
                    <View style={styles.sigDottedLine} />
                  </View>
                  <View style={styles.sigFieldRow}>
                    <Text style={styles.sigFieldLabel}>Signature:</Text>
                    <View style={styles.sigDottedLine} />
                  </View>
                  <View style={styles.sigFieldRow}>
                    <Text style={styles.sigFieldLabel}>Date:</Text>
                    <View style={styles.sigDottedLine} />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.signatureCol}>
              <View style={styles.sigBox}>
                <Text style={styles.sigRole}>Approved By</Text>
                <View style={styles.sigLineGroup}>
                  <View style={styles.sigFieldRow}>
                    <Text style={styles.sigFieldLabel}>Name:</Text>
                    <View style={styles.sigDottedLine} />
                  </View>
                  <View style={styles.sigFieldRow}>
                    <Text style={styles.sigFieldLabel}>Signature:</Text>
                    <View style={styles.sigDottedLine} />
                  </View>
                  <View style={styles.sigFieldRow}>
                    <Text style={styles.sigFieldLabel}>Date:</Text>
                    <View style={styles.sigDottedLine} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Printed By Info */}
        <Text style={styles.printedByText}>
          Printed By: Administrator || Date: {formatDateTime(now)}
        </Text>
      </Page>
    </Document>
  );
}
