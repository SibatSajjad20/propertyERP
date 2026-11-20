import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatPkr } from "@/lib/money";

export interface InstallmentSchedulePdfProps {
  bookingNo: string;
  applicationFormNo: string;
  bookingDate: Date | string;
  plan: string;
  client: {
    title?: string;
    fullName: string;
    cnic: string;
    phone: string;
    address: string;
  };
  unit: {
    unitCode: string;
    floorName: string;
    categoryName: string;
    grossAreaSqft?: string | null;
  };
  financials: {
    listPrice: string;
    discountValue?: string | null;
    netPrice: string;
    downPayment: string;
    paidTotal: string;
    balance: string;
  };
  installments: Array<{
    seq: number;
    label?: string | null;
    type?: string;
    dueDate: Date | string;
    amount: string;
    paidAmount?: string | null;
    status: string;
    receiptNo?: string | null;
  }>;
  payments: Array<{
    receiptNo: string;
    paidAt: Date | string;
    method: string;
    amount: string;
    surchargeAmount?: string | null;
    reference?: string | null;
    isVoided?: boolean;
  }>;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#0F172A",
    lineHeight: 1.4,
  },
  headerBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#0B558B",
    paddingBottom: 8,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
    letterSpacing: 0.5,
  },
  statementDate: {
    fontSize: 8,
    color: "#64748B",
  },
  docTitleBlock: {
    marginBottom: 10,
  },
  docTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  docSubtitle: {
    fontSize: 8,
    color: "#64748B",
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  infoCard: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#CBD5E1",
    padding: 8,
    backgroundColor: "#F8FAFC",
  },
  infoCardHeader: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 7.5,
    color: "#64748B",
  },
  infoValue: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  kpiTile: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
    padding: 6,
    backgroundColor: "#FFFFFF",
  },
  kpiLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginTop: 2,
  },
  table: {
    borderWidth: 0.5,
    borderColor: "#CBD5E1",
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
    minHeight: 18,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#F1F5F9",
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    fontSize: 7.2,
  },
  headerCell: {
    textAlign: "center",
    justifyContent: "center",
    padding: 3,
  },
  colSeq: {
    width: "6%",
    textAlign: "center",
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#E2E8F0",
  },
  colDueDate: {
    width: "16%",
    textAlign: "center",
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#E2E8F0",
  },
  colAmount: {
    width: "17%",
    textAlign: "right",
    padding: 3,
    paddingRight: 6,
    borderRightWidth: 0.5,
    borderRightColor: "#E2E8F0",
  },
  colPaid: {
    width: "17%",
    textAlign: "right",
    padding: 3,
    paddingRight: 6,
    borderRightWidth: 0.5,
    borderRightColor: "#E2E8F0",
  },
  colBalance: {
    width: "17%",
    textAlign: "right",
    padding: 3,
    paddingRight: 6,
    borderRightWidth: 0.5,
    borderRightColor: "#E2E8F0",
  },
  colReceipt: {
    width: "15%",
    textAlign: "center",
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#E2E8F0",
  },
  colStatus: {
    width: "12%",
    textAlign: "center",
    padding: 3,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  statusPaid: {
    color: "#166534",
    fontFamily: "Helvetica-Bold",
  },
  statusPending: {
    color: "#475569",
    fontFamily: "Helvetica-Bold",
  },
  statusOverdue: {
    color: "#991B1B",
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#E2E8F0",
    paddingTop: 6,
    fontSize: 7.5,
    color: "#64748B",
  },
  signatureBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
  },
  sigLine: {
    width: 160,
    borderTopWidth: 1,
    borderTopColor: "#94A3B8",
    paddingTop: 4,
    textAlign: "center",
    fontSize: 7.5,
    color: "#475569",
  },
});

function formatDate(date: Date | string) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function InstallmentSchedulePdf(props: InstallmentSchedulePdfProps) {
  const clientDisplayName = props.client.title
    ? `${props.client.title}. ${props.client.fullName}`
    : props.client.fullName;

  const validPayments = props.payments.filter((p) => !p.isVoided);

  // Compute total due, paid, balance
  let totalDue = 0;
  let totalPaid = 0;
  let totalBal = 0;

  for (const inst of props.installments) {
    const due = Number(inst.amount) || 0;
    const paid = Number(inst.paidAmount) || 0;
    totalDue += due;
    totalPaid += paid;
    totalBal += Math.max(0, due - paid);
  }

  return (
    <Document title={`Installment-Schedule-${props.bookingNo}`}>
      <Page size="A4" style={styles.page}>
        {/* Brand Banner */}
        <View style={styles.headerBanner}>
          <View>
            <Text style={styles.brandTitle}>SARDAR&apos;S MALL</Text>
            <Text style={{ fontSize: 7, color: "#64748B", marginTop: 1 }}>
              PROPERTY ERP • CLIENT INSTALLMENT SCHEDULE
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.statementDate}>Print Date: {formatDate(new Date())}</Text>
            <Text style={{ fontSize: 7, color: "#64748B", marginTop: 1 }}>
              Booking: #{props.bookingNo}
            </Text>
          </View>
        </View>

        {/* Customer & Unit Details */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardHeader}>Customer Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{clientDisplayName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>CNIC:</Text>
              <Text style={styles.infoValue}>{props.client.cnic}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{props.client.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={[styles.infoValue, { maxWidth: 160 }]}>
                {props.client.address || "-"}
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardHeader}>Unit &amp; Plan Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Unit Code:</Text>
              <Text style={styles.infoValue}>{props.unit.unitCode}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Floor / Category:</Text>
              <Text style={styles.infoValue}>
                {props.unit.floorName} • {props.unit.categoryName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Application #:</Text>
              <Text style={styles.infoValue}>{props.applicationFormNo}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Plan:</Text>
              <Text style={styles.infoValue}>{props.plan.replace(/_/g, " ")}</Text>
            </View>
          </View>
        </View>

        {/* Financial KPI Summary */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiLabel}>Net Price</Text>
            <Text style={[styles.kpiValue, { color: "#0F172A" }]}>
              {formatPkr(props.financials.netPrice)}
            </Text>
          </View>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiLabel}>Down Payment</Text>
            <Text style={[styles.kpiValue, { color: "#0B558B" }]}>
              {formatPkr(props.financials.downPayment)}
            </Text>
          </View>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiLabel}>Total Paid</Text>
            <Text style={[styles.kpiValue, { color: "#166534" }]}>
              {formatPkr(props.financials.paidTotal)}
            </Text>
          </View>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiLabel}>Current Balance</Text>
            <Text style={[styles.kpiValue, { color: "#991B1B" }]}>
              {formatPkr(props.financials.balance)}
            </Text>
          </View>
        </View>

        {/* Installment Schedule Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]} wrap={false}>
            <View style={[styles.colSeq, styles.headerCell]}>
              <Text>Seq</Text>
            </View>
            <View style={[styles.colDueDate, styles.headerCell]}>
              <Text>Due Date</Text>
            </View>
            <View style={[styles.colAmount, styles.headerCell]}>
              <Text>Due Amount</Text>
            </View>
            <View style={[styles.colPaid, styles.headerCell]}>
              <Text>Paid Amount</Text>
            </View>
            <View style={[styles.colBalance, styles.headerCell]}>
              <Text>Balance</Text>
            </View>
            <View style={[styles.colReceipt, styles.headerCell]}>
              <Text>Receipt #</Text>
            </View>
            <View style={[styles.colStatus, styles.headerCell]}>
              <Text>Status</Text>
            </View>
          </View>

          {props.installments.map((inst) => {
            const dueNum = Number(inst.amount) || 0;
            const paidNum = Number(inst.paidAmount) || 0;
            const balNum = Math.max(0, dueNum - paidNum);
            const isPaid = inst.status?.toUpperCase() === "PAID";
            const isOverdue = inst.status?.toUpperCase() === "OVERDUE";

            return (
              <View key={inst.seq} style={styles.tableRow} wrap={false}>
                <View style={styles.colSeq}>
                  <Text>#{inst.seq}</Text>
                </View>
                <View style={styles.colDueDate}>
                  <Text>{formatDate(inst.dueDate)}</Text>
                </View>
                <View style={styles.colAmount}>
                  <Text>{formatPkr(inst.amount)}</Text>
                </View>
                <View
                  style={[
                    styles.colPaid,
                    paidNum === 0 ? { textAlign: "center", paddingRight: 0 } : undefined,
                  ]}
                >
                  <Text>{paidNum > 0 ? formatPkr(String(paidNum)) : "—"}</Text>
                </View>
                <View
                  style={[
                    styles.colBalance,
                    balNum === 0 ? { textAlign: "center", paddingRight: 0 } : undefined,
                  ]}
                >
                  <Text>{balNum > 0 ? formatPkr(String(balNum)) : "—"}</Text>
                </View>
                <View style={styles.colReceipt}>
                  <Text style={{ fontSize: 6.8 }}>{inst.receiptNo || "—"}</Text>
                </View>
                <View style={styles.colStatus}>
                  <Text
                    style={
                      isPaid
                        ? styles.statusPaid
                        : isOverdue
                          ? styles.statusOverdue
                          : styles.statusPending
                    }
                  >
                    {inst.status}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Schedule Totals Row */}
          <View style={[styles.tableRow, styles.tableHeader]} wrap={false}>
            <View style={styles.colSeq}>
              <Text>—</Text>
            </View>
            <View style={[styles.colDueDate, { textAlign: "left", paddingLeft: 6 }]}>
              <Text style={styles.bold}>TOTAL DUE</Text>
            </View>
            <View style={styles.colAmount}>
              <Text style={styles.bold}>{formatPkr(String(totalDue))}</Text>
            </View>
            <View style={styles.colPaid}>
              <Text style={styles.bold}>{formatPkr(String(totalPaid))}</Text>
            </View>
            <View style={styles.colBalance}>
              <Text style={styles.bold}>{formatPkr(String(totalBal))}</Text>
            </View>
            <View style={styles.colReceipt}>
              <Text>—</Text>
            </View>
            <View style={styles.colStatus}>
              <Text>—</Text>
            </View>
          </View>
        </View>

        {/* Payment Receipts History Table (if payments exist) */}
        {validPayments.length > 0 && (
          <View style={{ marginTop: 6 }}>
            <Text
              style={{
                fontSize: 8.5,
                fontFamily: "Helvetica-Bold",
                color: "#0F172A",
                marginBottom: 4,
              }}
            >
              Payment Receipts History ({validPayments.length})
            </Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]} wrap={false}>
                <View style={[styles.colReceipt, styles.headerCell, { width: "22%" }]}>
                  <Text>Receipt #</Text>
                </View>
                <View style={[styles.colDueDate, styles.headerCell, { width: "18%" }]}>
                  <Text>Paid Date</Text>
                </View>
                <View style={[styles.colDueDate, styles.headerCell, { width: "18%" }]}>
                  <Text>Method</Text>
                </View>
                <View style={[styles.colAmount, styles.headerCell, { width: "22%" }]}>
                  <Text>Amount (PKR)</Text>
                </View>
                <View style={[styles.colBalance, styles.headerCell, { width: "20%" }]}>
                  <Text>Surcharge (PKR)</Text>
                </View>
              </View>

              {validPayments.map((p, idx) => (
                <View key={idx} style={styles.tableRow} wrap={false}>
                  <View style={[styles.colReceipt, { width: "22%" }]}>
                    <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold" }}>
                      {p.receiptNo}
                    </Text>
                  </View>
                  <View style={[styles.colDueDate, { width: "18%" }]}>
                    <Text>{formatDate(p.paidAt)}</Text>
                  </View>
                  <View style={[styles.colDueDate, { width: "18%" }]}>
                    <Text>{p.method.replace(/_/g, " ")}</Text>
                  </View>
                  <View style={[styles.colAmount, { width: "22%" }]}>
                    <Text style={styles.bold}>{formatPkr(p.amount)}</Text>
                  </View>
                  <View
                    style={[
                      styles.colBalance,
                      { width: "20%" },
                      Number(p.surchargeAmount || 0) === 0
                        ? { textAlign: "center", paddingRight: 0 }
                        : undefined,
                    ]}
                  >
                    <Text>
                      {Number(p.surchargeAmount || 0) > 0
                        ? formatPkr(p.surchargeAmount!)
                        : "—"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureBlock} wrap={false}>
          <View>
            <View style={styles.sigLine}>
              <Text>Prepared / Authorized By</Text>
            </View>
          </View>
          <View>
            <View style={styles.sigLine}>
              <Text>Customer Signature / Acceptance</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Sardar&apos;s Mall ERP • System-generated official schedule</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
