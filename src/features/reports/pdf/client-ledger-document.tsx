import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatPkr } from "@/lib/money";
import type { ClientLedgerReportData } from "../queries";

export interface ClientLedgerPdfProps {
  data: ClientLedgerReportData;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontSize: 8,
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
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 7,
    color: "#64748B",
    marginTop: 1,
  },
  statementDate: {
    fontSize: 8,
    color: "#64748B",
  },
  docTitleBlock: {
    marginBottom: 8,
  },
  docTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  docSubtitle: {
    fontSize: 7.5,
    color: "#64748B",
    marginTop: 1,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  infoCard: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#CBD5E1",
    borderRadius: 4,
    padding: 7,
    backgroundColor: "#F8FAFC",
  },
  infoCardHeader: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2.5,
  },
  infoLabel: {
    fontSize: 7,
    color: "#64748B",
  },
  infoValue: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },
  unitsSection: {
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
    borderRadius: 4,
    padding: 6,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  unitsHeader: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  unitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  unitChip: {
    borderWidth: 0.5,
    borderColor: "#CBD5E1",
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 5,
    backgroundColor: "#F1F5F9",
    flexDirection: "row",
    gap: 4,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  kpiTile: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
    borderRadius: 4,
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
    marginTop: 2,
  },
  table: {
    borderWidth: 0.5,
    borderColor: "#CBD5E1",
    borderRadius: 3,
    overflow: "hidden",
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
  colDate: {
    width: "14%",
    textAlign: "center",
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#E2E8F0",
  },
  colDesc: {
    width: "32%",
    padding: 3,
    paddingLeft: 5,
    borderRightWidth: 0.5,
    borderRightColor: "#E2E8F0",
  },
  colReceipt: {
    width: "14%",
    textAlign: "center",
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#E2E8F0",
  },
  colDebit: {
    width: "13%",
    textAlign: "right",
    padding: 3,
    paddingRight: 5,
    borderRightWidth: 0.5,
    borderRightColor: "#E2E8F0",
  },
  colCredit: {
    width: "13%",
    textAlign: "right",
    padding: 3,
    paddingRight: 5,
    borderRightWidth: 0.5,
    borderRightColor: "#E2E8F0",
  },
  colBalance: {
    width: "14%",
    textAlign: "right",
    padding: 3,
    paddingRight: 5,
  },
  bold: {
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
    marginTop: 18,
    marginBottom: 8,
  },
  sigLine: {
    width: 150,
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

export function ClientLedgerPdf({ data }: ClientLedgerPdfProps) {
  const { client, nextOfKin, units, statement } = data;

  return (
    <Document title={`Client-Ledger-${client.fullName}-${statement.period.endDate}`}>
      <Page size="A4" style={styles.page}>
        {/* Top Brand Banner */}
        <View style={styles.headerBanner}>
          <View>
            <Text style={styles.brandTitle}>SARDAR&apos;S MALL</Text>
            <Text style={styles.brandSub}>PROPERTY ERP • CLIENT ACCOUNT STATEMENT</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.statementDate}>
              Statement Date: {formatDate(new Date())}
            </Text>
            <Text style={styles.brandSub}>
              Period: {statement.period.startDate} to {statement.period.endDate}
            </Text>
          </View>
        </View>

        {/* Client & Next of Kin Information Cards */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardHeader}>Client Credentials</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name:</Text>
              <Text style={styles.infoValue}>{client.fullName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>CNIC:</Text>
              <Text style={styles.infoValue}>{client.cnic}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{client.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{client.email || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={[styles.infoValue, { maxWidth: 160 }]}>
                {client.homeAddress || "-"}
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardHeader}>Next of Kin Details</Text>
            {nextOfKin ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{nextOfKin.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Relation:</Text>
                  <Text style={styles.infoValue}>{nextOfKin.relation}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>CNIC:</Text>
                  <Text style={styles.infoValue}>{nextOfKin.cnic || "-"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{nextOfKin.phone || "-"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={[styles.infoValue, { maxWidth: 160 }]}>
                    {nextOfKin.address || "-"}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={{ fontSize: 7, color: "#64748B", marginTop: 4 }}>
                No next of kin recorded.
              </Text>
            )}
          </View>
        </View>

        {/* Associated Units */}
        {units.length > 0 && (
          <View style={styles.unitsSection}>
            <Text style={styles.unitsHeader}>Associated Units ({units.length})</Text>
            <View style={styles.unitsGrid}>
              {units.map((u, i) => (
                <View key={i} style={styles.unitChip}>
                  <Text style={{ fontFamily: "Helvetica-Bold", color: "#0F172A" }}>
                    {u.unitCode}
                  </Text>
                  <Text style={{ color: "#64748B" }}>({u.floorName})</Text>
                  <Text style={{ color: "#0B558B", fontFamily: "Helvetica-Bold" }}>
                    {formatPkr(u.amountPkr)}
                  </Text>
                  <Text style={{ color: "#475569" }}>[{u.relationType}]</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Financial Balance Summary Tiles */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiLabel}>Unit Value (Debits)</Text>
            <Text style={[styles.kpiValue, { color: "#991B1B" }]}>
              {formatPkr(statement.totalDebitsPkr)}
            </Text>
          </View>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiLabel}>Amount Received (Credits)</Text>
            <Text style={[styles.kpiValue, { color: "#166534" }]}>
              {formatPkr(statement.totalCreditsPkr)}
            </Text>
          </View>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiLabel}>Closing Balance</Text>
            <Text style={[styles.kpiValue, { color: "#0B558B" }]}>
              {formatPkr(statement.closingBalancePkr)}
            </Text>
          </View>
        </View>

        {/* Running Ledger Statement Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]} wrap={false}>
            <View style={[styles.colDate, styles.headerCell]}>
              <Text>Date</Text>
            </View>
            <View style={[styles.colDesc, styles.headerCell]}>
              <Text>Description</Text>
            </View>
            <View style={[styles.colReceipt, styles.headerCell]}>
              <Text>Receipt #</Text>
            </View>
            <View style={[styles.colDebit, styles.headerCell]}>
              <Text>Debit (Amount Due)</Text>
            </View>
            <View style={[styles.colCredit, styles.headerCell]}>
              <Text>Credit (Payment)</Text>
            </View>
            <View style={[styles.colBalance, styles.headerCell]}>
              <Text>Running Balance</Text>
            </View>
          </View>

          {/* Opening Balance Row */}
          <View style={[styles.tableRow, { backgroundColor: "#F8FAFC" }]} wrap={false}>
            <View style={styles.colDate}>
              <Text style={{ color: "#64748B" }}>{statement.period.startDate}</Text>
            </View>
            <View
              style={[
                styles.colDesc,
                { width: "59%", borderRightWidth: 0.5, borderRightColor: "#E2E8F0" },
              ]}
            >
              <Text style={{ fontStyle: "italic", color: "#64748B" }}>
                Opening Balance Brought Forward
              </Text>
            </View>
            <View style={styles.colBalance}>
              <Text style={styles.bold}>{formatPkr(statement.openingBalancePkr)}</Text>
            </View>
          </View>

          {/* Statement Entries */}
          {statement.entries.length === 0 ? (
            <View style={[styles.tableRow, { justifyContent: "center", minHeight: 28 }]}>
              <Text style={{ color: "#64748B", fontStyle: "italic" }}>
                No transactions recorded in this period.
              </Text>
            </View>
          ) : (
            statement.entries.map((entry, idx) => {
              const debitNum = Number(entry.debitPkr) || 0;
              const creditNum = Number(entry.creditPkr) || 0;

              return (
                <View key={idx} style={styles.tableRow} wrap={false}>
                  <View style={styles.colDate}>
                    <Text>{formatDate(entry.date)}</Text>
                  </View>
                  <View style={styles.colDesc}>
                    <Text>{entry.description}</Text>
                  </View>
                  <View style={styles.colReceipt}>
                    <Text style={{ fontSize: 6.8 }}>{entry.receiptNo || "—"}</Text>
                  </View>
                  <View
                    style={[
                      styles.colDebit,
                      debitNum === 0
                        ? { textAlign: "center", paddingRight: 0 }
                        : { color: "#991B1B" },
                    ]}
                  >
                    <Text>{debitNum > 0 ? formatPkr(entry.debitPkr) : "—"}</Text>
                  </View>
                  <View
                    style={[
                      styles.colCredit,
                      creditNum === 0
                        ? { textAlign: "center", paddingRight: 0 }
                        : { color: "#166534" },
                    ]}
                  >
                    <Text>{creditNum > 0 ? formatPkr(entry.creditPkr) : "—"}</Text>
                  </View>
                  <View style={styles.colBalance}>
                    <Text style={styles.bold}>{formatPkr(entry.runningBalancePkr)}</Text>
                  </View>
                </View>
              );
            })
          )}

          {/* Closing Balance Row */}
          <View style={[styles.tableRow, styles.tableHeader]} wrap={false}>
            <View style={styles.colDate}>
              <Text>{statement.period.endDate}</Text>
            </View>
            <View
              style={[
                styles.colDesc,
                { width: "46%", borderRightWidth: 0.5, borderRightColor: "#E2E8F0" },
              ]}
            >
              <Text style={styles.bold}>Closing Balance Carried Forward</Text>
            </View>
            <View style={styles.colDebit}>
              <Text style={[styles.bold, { color: "#991B1B" }]}>
                {formatPkr(statement.totalDebitsPkr)}
              </Text>
            </View>
            <View style={styles.colCredit}>
              <Text style={[styles.bold, { color: "#166534" }]}>
                {formatPkr(statement.totalCreditsPkr)}
              </Text>
            </View>
            <View style={styles.colBalance}>
              <Text style={[styles.bold, { color: "#0B558B" }]}>
                {formatPkr(statement.closingBalancePkr)}
              </Text>
            </View>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureBlock} wrap={false}>
          <View>
            <View style={styles.sigLine}>
              <Text>Prepared By</Text>
            </View>
          </View>
          <View>
            <View style={styles.sigLine}>
              <Text>Accounts Officer</Text>
            </View>
          </View>
          <View>
            <View style={styles.sigLine}>
              <Text>Client Acceptance</Text>
            </View>
          </View>
        </View>

        {/* Page Footer */}
        <View style={styles.footer} fixed>
          <Text>Sardar&apos;s Mall ERP • Official Client Statement of Account</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
