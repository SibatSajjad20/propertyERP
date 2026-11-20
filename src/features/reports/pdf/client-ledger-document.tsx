import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatPkr } from "@/lib/money";
import type { ClientLedgerReportData } from "../queries";

export interface ClientLedgerPdfProps {
  data: ClientLedgerReportData;
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
  brandTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
    letterSpacing: 0.5,
  },
  brandAddress: {
    fontSize: 7.2,
    color: "#475569",
    marginTop: 1,
    fontFamily: "Helvetica-Bold",
  },
  allotmentTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginTop: 3,
    letterSpacing: 0.2,
  },
  rightStampBox: {
    alignItems: "flex-end",
  },
  statementDate: {
    fontSize: 7.5,
    color: "#475569",
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
  },
  boxCard: {
    borderWidth: 0.8,
    borderColor: "#CBD5E1",
    padding: 6,
    marginBottom: 7,
    backgroundColor: "#FFFFFF",
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
    width: "4%",
    padding: 2.5,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColItem: {
    width: "22%",
    padding: 2.5,
    paddingLeft: 4,
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColDueDate: {
    width: "9.5%",
    padding: 2.5,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColDueAmt: {
    width: "11%",
    padding: 2.5,
    paddingRight: 4,
    textAlign: "right",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColPaidDate: {
    width: "9.5%",
    padding: 2.5,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColPaidAmt: {
    width: "11%",
    padding: 2.5,
    paddingRight: 4,
    textAlign: "right",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColReceipt: {
    width: "12.5%",
    padding: 2.5,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColSurcharge: {
    width: "9.5%",
    padding: 2.5,
    paddingRight: 4,
    textAlign: "right",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColStatus: {
    width: "11%",
    padding: 2.5,
    textAlign: "center",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 18,
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
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 20,
  },
  sigBox: {
    alignItems: "center",
    width: 140,
  },
  sigLine: {
    width: "100%",
    borderTopWidth: 0.8,
    borderTopColor: "#475569",
    marginBottom: 3,
  },
  sigLabel: {
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
  },
  printedByText: {
    fontSize: 6.8,
    color: "#64748B",
    fontFamily: "Helvetica-Oblique",
    marginTop: 4,
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

export function ClientLedgerPdf({ data }: ClientLedgerPdfProps) {
  const { client, nextOfKin, selectedUnitDetails, financials, scheduleRows, statement } =
    data;
  const now = new Date();

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
        {/* Top Header matching reference document */}
        <View style={styles.headerBanner}>
          <View>
            <Text style={styles.brandTitle}>SARDAR&apos;S MALL</Text>
            <Text style={styles.brandAddress}>
              Plot no. 13/N, 2nd Floor, F-7 Markaz, Islamabad
            </Text>
            <Text style={styles.allotmentTitle}>
              Allotment Details ({unitCodeDisplay})
            </Text>
          </View>
          <View style={styles.rightStampBox}>
            <Text style={styles.statementDate}>Date: {formatDate(now)}</Text>
            <Text style={styles.badgeText}>Form #: {formNoDisplay}</Text>
          </View>
        </View>

        {/* Customer Details Box matching reference image */}
        <View style={styles.boxCard}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {/* Left Column */}
            <View style={{ flex: 1 }}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Name :</Text>
                <Text style={styles.dataValue}>{clientDisplayName}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Phone No :</Text>
                <Text style={styles.dataValue}>{client.phone}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Cnic :</Text>
                <Text style={styles.dataValue}>{client.cnic}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Present Address :</Text>
                <Text style={[styles.dataValue, { fontSize: 6.8 }]}>
                  {client.homeAddress || "N/A"}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Nominee :</Text>
                <Text style={styles.dataValue}>{nextOfKin?.name || "N/A"}</Text>
              </View>
            </View>

            {/* Right Column */}
            <View style={{ flex: 1 }}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>So/Do/Wo Name :</Text>
                <Text style={styles.dataValue}>{soDoWoName}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Email :</Text>
                <Text style={styles.dataValue}>{client.email || "N/A"}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Year of Birth :</Text>
                <Text style={styles.dataValue}>N/A</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Permanent Address :</Text>
                <Text style={[styles.dataValue, { fontSize: 6.8 }]}>
                  {client.postalAddress || client.homeAddress || "N/A"}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Nominee CNIC :</Text>
                <Text style={styles.dataValue}>{nextOfKin?.cnic || "N/A"}</Text>
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
                  {selectedUnitDetails?.grossAreaSqft || "—"} Sq Ft
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
                    : "0.00"}
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
          {scheduleRows && scheduleRows.length > 0
            ? scheduleRows.map((row) => {
                const isPaid = row.status?.toUpperCase() === "PAID";
                const isOverdue = row.status?.toUpperCase() === "OVERDUE";
                const hasPaidAmt = row.paidAmountPkr && Number(row.paidAmountPkr) > 0;
                const paidAmtStr = hasPaidAmt
                  ? formatPkr(row.paidAmountPkr!)
                  : isPaid
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
                      <Text style={hasPaidAmt || isPaid ? styles.bold : undefined}>
                        {paidAmtStr}
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
                            color: isPaid ? "#166534" : isOverdue ? "#991B1B" : "#475569",
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
              statement.entries.map((entry, idx) => (
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
        </View>

        {/* Printed By Info */}
        <Text style={styles.printedByText}>
          Printed By: Administrator || Date: {formatDateTime(now)}
        </Text>

        {/* Signatures matching reference image */}
        <View style={styles.signatureSection} wrap={false}>
          <View style={styles.sigBox}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>Prepared By</Text>
          </View>
          <View style={styles.sigBox}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>Checked By</Text>
          </View>
        </View>

        {/* Page Footer */}
        <View style={styles.footer} fixed>
          <Text>
            Sardar&apos;s Mall ERP • Official Client Statement &amp; Allotment Schedule
          </Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
