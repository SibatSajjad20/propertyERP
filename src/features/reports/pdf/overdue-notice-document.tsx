import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { SARDARS_MALL_MARK_DATA_URL } from "@/features/documents/pdf/logo-base64";

export interface OverdueNoticePdfData {
  noticeNo?: string;
  issueDate?: Date | string;
  client: {
    title?: string | null;
    fullName: string;
    relationPrefix?: string | null;
    relationName?: string | null;
    cnic?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  unit: {
    unitCode: string;
    floorName: string;
    categoryName?: string | null;
    grossAreaSqft?: string | null;
    netAreaSqft?: string | null;
    bookingNo?: string | null;
    applicationFormNo?: string | null;
  };
  installment: {
    seq?: number;
    label: string;
    milestoneName?: string; // e.g. "first installment", "1st installment"
    dueDate?: Date | string | null;
    dueAmountPkr: string;
    pendingAmountPkr: string;
    surchargePkr?: string | null;
    daysOverdue?: number;
  };
  issuedBy: {
    name: string;
    designation?: string;
  };
  company?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

export interface OverdueNoticePdfProps {
  data: OverdueNoticePdfData;
  mode?: "print" | "download";
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 44,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: "#0F172A",
    lineHeight: 1.5,
    backgroundColor: "#FFFFFF",
  },
  headerBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#0B558B",
    paddingBottom: 8,
    marginBottom: 16,
  },
  brandLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandLogo: {
    width: 36,
    height: 42,
    objectFit: "contain",
    marginRight: 10,
  },
  brandTitleGroup: {
    flexDirection: "column",
  },
  brandTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  brandSubtitle: {
    fontSize: 7.5,
    color: "#64748B",
  },
  headerMeta: {
    alignItems: "flex-end",
  },
  metaRef: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginBottom: 2,
  },
  metaDate: {
    fontSize: 8,
    color: "#64748B",
  },

  /* Recipient Details Section */
  recipientSection: {
    marginBottom: 18,
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 0.8,
    borderColor: "#E2E8F0",
    borderRadius: 3,
  },
  recipientHeader: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  recipientRow: {
    flexDirection: "row",
    marginBottom: 2.5,
  },
  recipientLabel: {
    width: 90,
    fontSize: 8.5,
    color: "#64748B",
    fontFamily: "Helvetica",
  },
  recipientValue: {
    flex: 1,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },

  /* Notice Main Title */
  titleBox: {
    marginTop: 6,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    paddingBottom: 6,
  },
  noticeTitle: {
    fontSize: 12.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  /* Salutation */
  salutation: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginBottom: 12,
  },

  /* Body Paragraphs */
  paragraph: {
    fontSize: 9.5,
    lineHeight: 1.55,
    color: "#1E293B",
    marginBottom: 12,
    textAlign: "justify",
  },
  paragraphBold: {
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },

  /* Key Highlight Box */
  calloutBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 3,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  calloutItem: {
    flexDirection: "column",
  },
  calloutLabel: {
    fontSize: 7.5,
    color: "#92400E",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  calloutValue: {
    fontSize: 9.5,
    color: "#78350F",
    fontFamily: "Helvetica-Bold",
  },

  /* Sign-off */
  signoffGroup: {
    marginTop: 22,
    paddingTop: 10,
  },
  regardsText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginBottom: 14,
  },
  issuerName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
    marginBottom: 2,
  },
  issuerDesignation: {
    fontSize: 8.5,
    color: "#475569",
    fontFamily: "Helvetica",
    marginBottom: 2,
  },
  companyName: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    borderTopWidth: 0.8,
    borderTopColor: "#E2E8F0",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: "#94A3B8",
  },
});

function formatDate(date: Date | string | null | undefined): string {
  if (!date)
    return new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatArea(grossArea?: string | null, netArea?: string | null): string {
  if (grossArea && grossArea !== "—" && grossArea !== "0") {
    const n = parseFloat(grossArea);
    return isNaN(n) ? grossArea : n.toLocaleString("en-US");
  }
  if (netArea && netArea !== "—" && netArea !== "0") {
    const n = parseFloat(netArea);
    return isNaN(n) ? netArea : n.toLocaleString("en-US");
  }
  return "—";
}

function resolveMilestoneWord(label: string, seq?: number): string {
  const l = (label || "").trim().toLowerCase();
  if (l.includes("down") || l.includes("booking")) return "down payment";
  if (seq === 1 || l.startsWith("1st") || l.includes("first")) return "first installment";
  if (seq === 2 || l.startsWith("2nd") || l.includes("second"))
    return "second installment";
  if (seq === 3 || l.startsWith("3rd") || l.includes("third")) return "third installment";
  if (seq === 4 || l.startsWith("4th") || l.includes("fourth"))
    return "fourth installment";
  if (seq === 5 || l.startsWith("5th") || l.includes("fifth")) return "fifth installment";
  if (seq === 6 || l.startsWith("6th") || l.includes("sixth")) return "sixth installment";
  if (seq === 7 || l.startsWith("7th") || l.includes("seventh"))
    return "seventh installment";
  if (seq === 8 || l.startsWith("8th") || l.includes("eighth"))
    return "eighth installment";
  if (seq === 9 || l.startsWith("9th") || l.includes("ninth")) return "ninth installment";
  if (seq === 10 || l.startsWith("10th") || l.includes("tenth"))
    return "tenth installment";
  return label.toLowerCase() || "installment";
}

export function OverdueNoticePdf({ data }: OverdueNoticePdfProps) {
  const { client, unit, installment, issuedBy, company } = data;

  const dateStr = formatDate(data.issueDate || new Date());
  const refNo =
    data.noticeNo ||
    `SM/REM-${unit.unitCode.replace(/[^a-zA-Z0-9]/g, "")}/${new Date().getFullYear()}`;

  const areaStr = formatArea(unit.grossAreaSqft, unit.netAreaSqft);
  const milestoneText =
    installment.milestoneName || resolveMilestoneWord(installment.label, installment.seq);

  // Client name & relation formatting
  const clientTitle = client.title ? `${client.title} ` : "";
  const clientFullName = client.fullName || "Valued Client";
  const relationPrefix = client.relationPrefix || "S/O";
  const relationPart = client.relationName
    ? `${relationPrefix} ${client.relationName}`
    : "";

  // Formal Salutation
  const salutationText = client.relationName
    ? `Dear ${clientTitle}${clientFullName} (${relationPart}),`
    : `Dear ${clientTitle}${clientFullName},`;

  return (
    <Document
      title={`Notice - Installment Reminder - ${client.fullName} - ${unit.unitCode}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Header with branding */}
        <View style={styles.headerBanner}>
          <View style={styles.brandLeft}>
            <Image src={SARDARS_MALL_MARK_DATA_URL} style={styles.brandLogo} />
            <View style={styles.brandTitleGroup}>
              <Text style={styles.brandTitle}>{company?.name || "SARDAR'S MALL"}</Text>
              <Text style={styles.brandSubtitle}>
                {company?.address ||
                  "54-C Iran Road, Block C, near Chandni Chowk, Rawalpindi"}
              </Text>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.metaRef}>Notice Ref: {refNo}</Text>
            <Text style={styles.metaDate}>Date: {dateStr}</Text>
          </View>
        </View>

        {/* Recipient Details Block */}
        <View style={styles.recipientSection}>
          <Text style={styles.recipientHeader}>Client &amp; Allotment Credentials</Text>
          <View style={styles.recipientRow}>
            <Text style={styles.recipientLabel}>Client Name:</Text>
            <Text style={styles.recipientValue}>
              {clientTitle}
              {clientFullName}
            </Text>
          </View>
          {client.relationName ? (
            <View style={styles.recipientRow}>
              <Text style={styles.recipientLabel}>Relation:</Text>
              <Text style={styles.recipientValue}>{relationPart}</Text>
            </View>
          ) : null}
          <View style={styles.recipientRow}>
            <Text style={styles.recipientLabel}>CNIC No:</Text>
            <Text style={styles.recipientValue}>{client.cnic || "—"}</Text>
          </View>
          <View style={styles.recipientRow}>
            <Text style={styles.recipientLabel}>Contact Phone:</Text>
            <Text style={styles.recipientValue}>{client.phone || "—"}</Text>
          </View>
          {client.address ? (
            <View style={styles.recipientRow}>
              <Text style={styles.recipientLabel}>Address:</Text>
              <Text style={styles.recipientValue}>{client.address}</Text>
            </View>
          ) : null}
        </View>

        {/* Notice Heading */}
        <View style={styles.titleBox}>
          <Text style={styles.noticeTitle}>NOTICE – INSTALLMENT PAYMENT REMINDER</Text>
        </View>

        {/* Salutation */}
        <Text style={styles.salutation}>{salutationText}</Text>

        {/* Intro */}
        <Text style={styles.paragraph}>We hope you are doing well.</Text>

        {/* Main Reminder Paragraph */}
        <Text style={styles.paragraph}>
          With due respect, we would like to remind you of your pending{" "}
          <Text style={styles.paragraphBold}>{milestoneText}</Text> of{" "}
          <Text style={styles.paragraphBold}>PKR {installment.pendingAmountPkr}</Text> for{" "}
          <Text style={styles.paragraphBold}>{unit.floorName}</Text>,{" "}
          <Text style={styles.paragraphBold}>Unit No. {unit.unitCode}</Text>
          {areaStr !== "—" ? (
            <>
              , measuring <Text style={styles.paragraphBold}>{areaStr} sq. ft.</Text>
            </>
          ) : (
            ""
          )}
          .
        </Text>

        {/* Installment Summary Callout */}
        <View style={styles.calloutBox}>
          <View style={styles.calloutItem}>
            <Text style={styles.calloutLabel}>Installment</Text>
            <Text style={styles.calloutValue}>{installment.label}</Text>
          </View>
          {installment.dueDate ? (
            <View style={styles.calloutItem}>
              <Text style={styles.calloutLabel}>Due Date</Text>
              <Text style={styles.calloutValue}>{formatDate(installment.dueDate)}</Text>
            </View>
          ) : null}
          <View style={styles.calloutItem}>
            <Text style={styles.calloutLabel}>Pending Amount</Text>
            <Text style={styles.calloutValue}>PKR {installment.pendingAmountPkr}</Text>
          </View>
          {installment.surchargePkr && Number(installment.surchargePkr) > 0 ? (
            <View style={styles.calloutItem}>
              <Text style={styles.calloutLabel}>Surcharge</Text>
              <Text style={styles.calloutValue}>PKR {installment.surchargePkr}</Text>
            </View>
          ) : null}
        </View>

        {/* Body Paragraphs matching user's template */}
        <Text style={styles.paragraph}>
          We humbly request you to kindly arrange payment of your outstanding installment
          at your earliest convenience. Your timely payments play a vital role in
          maintaining continuous construction activities and ensuring the smooth and
          timely progress of the project construction .
        </Text>

        <Text style={styles.paragraph}>
          Our management and construction teams are making every possible effort to
          complete the project within the committed timeline and deliver your property as
          promised. Your cooperation and timely payments will greatly support us in
          continuing construction work without interruption and achieving our project
          delivery commitments.
        </Text>

        <Text style={styles.paragraph}>
          We sincerely value your trust and confidence in our project. Your continued
          support and cooperation are highly appreciated.
        </Text>

        <Text style={styles.paragraphBold}>
          Thank you for being a valued part of our project.
        </Text>

        {/* Sign-off */}
        <View style={styles.signoffGroup}>
          <Text style={styles.regardsText}>Best Regards,</Text>
          <Text style={styles.issuerName}>{issuedBy.name || "Management"}</Text>
          <Text style={styles.issuerDesignation}>
            {issuedBy.designation || "Recovery & Accounts Management"}
          </Text>
          <Text style={styles.companyName}>{company?.name || "Sardar's Mall"}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Official Payment Reminder Notice • Confidential</Text>
          <Text>
            {unit.unitCode} • Form #{unit.applicationFormNo || unit.bookingNo || "—"}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
