import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatPkr } from "@/lib/money";

export interface ReportColumn {
  key: string;
  label: string;
  width: string;
  align?: "left" | "center" | "right";
  isMoney?: boolean;
}

export interface ReportStat {
  label: string;
  value: string;
  subtext?: string;
}

export interface ReportPdfProps {
  title: string;
  subtitle: string;
  filterDesc: string;
  stats?: ReportStat[];
  columns: ReportColumn[];
  rows: Array<Record<string, unknown>>;
  totals?: Record<string, string>;
  orientation?: "portrait" | "landscape";
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 32,
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: "#0F172A",
    lineHeight: 1.35,
  },
  headerBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#0B558B",
    paddingBottom: 6,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 7,
    color: "#64748B",
    marginTop: 1,
  },
  dateText: {
    fontSize: 7.5,
    color: "#64748B",
  },
  titleBlock: {
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 7.5,
    color: "#64748B",
    marginTop: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  statTile: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
    padding: 5,
    backgroundColor: "#F8FAFC",
  },
  statLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  statValue: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginTop: 2,
  },
  table: {
    borderWidth: 0.5,
    borderColor: "#CBD5E1",
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
    minHeight: 16,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#F1F5F9",
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    fontSize: 6.8,
  },
  headerCell: {
    textAlign: "center",
    justifyContent: "center",
    padding: 3,
  },
  cell: {
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#E2E8F0",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#E2E8F0",
    paddingTop: 4,
    fontSize: 7,
    color: "#64748B",
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

export function ReportPdfDocument(props: ReportPdfProps) {
  const orientation = props.orientation || "landscape";

  return (
    <Document title={props.title}>
      <Page size="A4" orientation={orientation} style={styles.page}>
        {/* Header */}
        <View style={styles.headerBanner}>
          <View>
            <Text style={styles.brandTitle}>SARDAR&apos;S MALL</Text>
            <Text style={styles.brandSub}>PROPERTY MANAGEMENT &amp; ERP SYSTEM</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.dateText}>Print Date: {formatDate(new Date())}</Text>
            <Text style={styles.brandSub}>{props.filterDesc}</Text>
          </View>
        </View>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{props.title}</Text>
          <Text style={styles.subtitle}>{props.subtitle}</Text>
        </View>

        {/* KPI Stats Tiles */}
        {props.stats && props.stats.length > 0 && (
          <View style={styles.statsRow}>
            {props.stats.map((s, idx) => (
              <View key={idx} style={styles.statTile}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Data Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.tableRow, styles.tableHeader]} wrap={false}>
            {props.columns.map((col, idx) => (
              <View
                key={idx}
                style={[
                  styles.cell,
                  styles.headerCell,
                  { width: col.width },
                  idx === props.columns.length - 1 ? { borderRightWidth: 0 } : undefined,
                ]}
              >
                <Text>{col.label}</Text>
              </View>
            ))}
          </View>

          {/* Rows */}
          {props.rows.length === 0 ? (
            <View style={[styles.tableRow, { justifyContent: "center", minHeight: 24 }]}>
              <Text style={{ color: "#64748B", fontStyle: "italic" }}>
                No records found matching the current reporting criteria.
              </Text>
            </View>
          ) : (
            props.rows.map((row, rIdx) => (
              <View
                key={rIdx}
                style={[
                  styles.tableRow,
                  rIdx % 2 === 1 ? { backgroundColor: "#F8FAFC" } : undefined,
                ]}
                wrap={false}
              >
                {props.columns.map((col, cIdx) => {
                  const val = row[col.key];
                  const displayVal =
                    val === null || val === undefined || val === ""
                      ? "—"
                      : col.isMoney
                        ? formatPkr(String(val))
                        : String(val);

                  const isDash = displayVal === "—";
                  const align = isDash
                    ? "center"
                    : col.align || (col.isMoney ? "right" : "left");

                  return (
                    <View
                      key={cIdx}
                      style={[
                        styles.cell,
                        { width: col.width, textAlign: align },
                        align === "right" ? { paddingRight: 5 } : undefined,
                        align === "left" ? { paddingLeft: 4 } : undefined,
                        cIdx === props.columns.length - 1
                          ? { borderRightWidth: 0 }
                          : undefined,
                      ]}
                    >
                      <Text>{displayVal}</Text>
                    </View>
                  );
                })}
              </View>
            ))
          )}

          {/* Totals Row */}
          {props.totals && (
            <View style={[styles.tableRow, styles.tableHeader]} wrap={false}>
              {props.columns.map((col, idx) => {
                const totalVal = props.totals![col.key];
                return (
                  <View
                    key={idx}
                    style={[
                      styles.cell,
                      {
                        width: col.width,
                        textAlign: totalVal
                          ? col.isMoney
                            ? "right"
                            : "center"
                          : "center",
                      },
                      col.isMoney && totalVal ? { paddingRight: 5 } : undefined,
                      idx === props.columns.length - 1
                        ? { borderRightWidth: 0 }
                        : undefined,
                    ]}
                  >
                    <Text style={styles.bold}>
                      {totalVal || (idx === 0 ? "TOTAL" : "—")}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Sardar&apos;s Mall ERP • Official Report Document</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
