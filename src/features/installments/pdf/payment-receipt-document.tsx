import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatPkr } from "@/lib/money";
import { SARDARS_MALL_MARK_DATA_URL } from "@/features/documents/pdf/logo-base64";

export interface PaymentReceiptPdfData {
  receiptNo: string;
  paidAt: Date | string;
  amountPkr: string;
  method: string;
  chequeNo?: string | null;
  bank?: string | null;
  reference?: string | null;
  notes?: string | null;
  category?: string | null;
  allocationLabel: string;
  client: {
    fullName: string;
    cnic: string;
    phone: string;
    relationPrefix?: string | null;
    relationName?: string | null;
    homeAddress?: string | null;
  };
  booking: {
    bookingNo: string;
    serialNo?: number | string | null;
    applicationFormNo?: string | null;
    registrationNo?: string | null;
    netPrice?: string | null;
    downPayment?: string | null;
    paidTotal?: string | null;
  };
  unit: {
    unitCode: string;
    floorName: string;
    categoryName?: string | null;
  };
  receivedByName?: string | null;
  company?: {
    name?: string;
    legalName?: string;
    address?: string;
    bankName?: string;
    accountTitle?: string;
    iban?: string;
  };
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 32,
    paddingHorizontal: 36,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  headerBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#0B558B",
    paddingBottom: 8,
    marginBottom: 10,
  },
  brandLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandLogo: {
    width: 38,
    height: 44,
    objectFit: "contain",
    marginRight: 10,
  },
  brandTextGroup: {
    flexDirection: "column",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  receiptHeading: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    letterSpacing: 0.4,
  },
  receiptBadgeBox: {
    alignItems: "flex-end",
  },
  receiptNumberPill: {
    backgroundColor: "#EAF1F7",
    borderWidth: 1,
    borderColor: "#0B558B",
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  receiptNumberText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
  },
  receiptDateText: {
    fontSize: 8,
    color: "#64748B",
  },

  /* Amount Callout */
  amountCallout: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1F7A4D",
    lineHeight: 1.2,
    marginBottom: 6,
  },
  amountSubline: {
    fontSize: 8.5,
    color: "#334155",
    textAlign: "center",
  },

  /* Allocation Callout */
  allocationStrip: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  allocationLabelText: {
    fontSize: 8.5,
    color: "#475569",
    fontFamily: "Helvetica-Bold",
  },
  allocationTargetText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
  },

  /* Two Column Grid */
  twoColGrid: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 6,
  },
  cardPanel: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#FFFFFF",
  },
  panelTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0B558B",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 4,
    marginBottom: 6,
  },
  defRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2.5,
  },
  defLabel: {
    fontSize: 8,
    color: "#64748B",
    width: "38%",
  },
  defValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    width: "62%",
    textAlign: "right",
  },

  /* Notes */
  notesBox: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 8,
    marginVertical: 6,
    backgroundColor: "#FAFBFC",
  },
  notesTitle: {
    fontSize: 7.5,
    color: "#64748B",
    fontFamily: "Helvetica-Bold",
  },
  notesContent: {
    fontSize: 8,
    color: "#334155",
    fontStyle: "italic",
    marginTop: 2,
  },

  /* Signatures & Footer */
  footerSection: {
    marginTop: "auto",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  signatureBlock: {
    width: 145,
    alignItems: "center",
  },
  signatureSpace: {
    height: 28,
  },
  signatureLine: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#0F172A",
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    textAlign: "center",
  },
  signatureSub: {
    fontSize: 7.5,
    color: "#64748B",
    textAlign: "center",
    marginTop: 1,
  },
  verifiedBadgeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  verifiedBadge: {
    borderWidth: 1,
    borderColor: "#1F7A4D",
    backgroundColor: "#E9F4EE",
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  verifiedBadgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1F7A4D",
    letterSpacing: 0.6,
  },
  legalDisclaimer: {
    fontSize: 7,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 1.3,
    marginBottom: 8,
  },
  footerAddress: {
    fontSize: 7,
    color: "#64748B",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#F1F5F9",
    paddingTop: 5,
  },
});

function formatReference(
  method: string,
  chequeNo?: string | null,
  reference?: string | null,
): string {
  const raw = (chequeNo || reference || "").trim();
  if (!raw) return "";
  const cleaned = raw.replace(/^(cheque|chq|trx|ref)[\s#:]*/i, "");
  if (method === "CHEQUE") {
    return `Cheque #${cleaned || raw}`;
  }
  return `Trx / Ref #${cleaned || raw}`;
}

export function PaymentReceiptPdf({ data }: { data: PaymentReceiptPdfData }) {
  const paidDateFormatted =
    data.paidAt instanceof Date
      ? data.paidAt.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : new Date(data.paidAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

  const refFormatted = formatReference(data.method, data.chequeNo, data.reference);
  const companyAddress =
    data.company?.address || "54-C Iran Road, Block C, near Chandni Chowk, Rawalpindi";
  const companyName = data.company?.name || "Sardar's Mall";

  return (
    <Document title={`Payment-Receipt-${data.receiptNo}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBanner}>
          <View style={styles.brandLeft}>
            <Image src={SARDARS_MALL_MARK_DATA_URL} style={styles.brandLogo} />
            <View style={styles.brandTextGroup}>
              <Text style={styles.brandTitle}>{companyName}</Text>
              <Text style={styles.receiptHeading}>OFFICIAL PAYMENT RECEIPT</Text>
            </View>
          </View>
          <View style={styles.receiptBadgeBox}>
            <View style={styles.receiptNumberPill}>
              <Text style={styles.receiptNumberText}>{data.receiptNo}</Text>
            </View>
            <Text style={styles.receiptDateText}>Date: {paidDateFormatted}</Text>
          </View>
        </View>

        {/* Amount Received Callout */}
        <View style={styles.amountCallout}>
          <Text style={styles.amountLabel}>Total Amount Received</Text>
          <Text style={styles.amountValue}>{formatPkr(data.amountPkr)}</Text>
          <Text style={styles.amountSubline}>
            Method: {data.method.replaceAll("_", " ")}
            {data.bank ? ` • Bank: ${data.bank}` : ""}
            {refFormatted ? ` (${refFormatted})` : ""}
          </Text>
        </View>

        {/* Payment Allocation Strip (What was paid) */}
        <View style={styles.allocationStrip}>
          <Text style={styles.allocationLabelText}>Payment Allocated To:</Text>
          <Text style={styles.allocationTargetText}>{data.allocationLabel}</Text>
        </View>

        {/* Two-Column Details */}
        <View style={styles.twoColGrid}>
          {/* Client Details */}
          <View style={styles.cardPanel}>
            <Text style={styles.panelTitle}>Customer Credentials</Text>
            <View style={styles.defRow}>
              <Text style={styles.defLabel}>Full Name:</Text>
              <Text style={styles.defValue}>{data.client.fullName}</Text>
            </View>
            {data.client.relationName && (
              <View style={styles.defRow}>
                <Text style={styles.defLabel}>
                  {data.client.relationPrefix
                    ? `${data.client.relationPrefix}:`
                    : "Relation:"}
                </Text>
                <Text style={styles.defValue}>{data.client.relationName}</Text>
              </View>
            )}
            <View style={styles.defRow}>
              <Text style={styles.defLabel}>CNIC No:</Text>
              <Text style={styles.defValue}>{data.client.cnic}</Text>
            </View>
            <View style={styles.defRow}>
              <Text style={styles.defLabel}>Phone:</Text>
              <Text style={styles.defValue}>{data.client.phone}</Text>
            </View>
            {data.client.homeAddress && (
              <View style={styles.defRow}>
                <Text style={styles.defLabel}>Address:</Text>
                <Text style={styles.defValue}>{data.client.homeAddress}</Text>
              </View>
            )}
          </View>

          {/* Unit & Allotment Details */}
          <View style={styles.cardPanel}>
            <Text style={styles.panelTitle}>Unit &amp; Booking Details</Text>
            <View style={styles.defRow}>
              <Text style={styles.defLabel}>Unit Code:</Text>
              <Text style={styles.defValue}>{data.unit.unitCode}</Text>
            </View>
            <View style={styles.defRow}>
              <Text style={styles.defLabel}>Floor / Block:</Text>
              <Text style={styles.defValue}>{data.unit.floorName}</Text>
            </View>
            {data.unit.categoryName && (
              <View style={styles.defRow}>
                <Text style={styles.defLabel}>Category:</Text>
                <Text style={styles.defValue}>{data.unit.categoryName}</Text>
              </View>
            )}
            <View style={styles.defRow}>
              <Text style={styles.defLabel}>Booking No:</Text>
              <Text style={styles.defValue}>{data.booking.bookingNo}</Text>
            </View>
            {data.booking.applicationFormNo && (
              <View style={styles.defRow}>
                <Text style={styles.defLabel}>Form No:</Text>
                <Text style={styles.defValue}>{data.booking.applicationFormNo}</Text>
              </View>
            )}
            {data.booking.netPrice && (
              <View style={styles.defRow}>
                <Text style={styles.defLabel}>Contract Price:</Text>
                <Text style={styles.defValue}>{formatPkr(data.booking.netPrice)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes (if any) */}
        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Remarks / Narration:</Text>
            <Text style={styles.notesContent}>{data.notes}</Text>
          </View>
        )}

        {/* Footer & Signature Section */}
        <View style={styles.footerSection}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureSpace} />
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>
                {data.receivedByName
                  ? `Officer: ${data.receivedByName}`
                  : "Accounts Officer"}
              </Text>
              <Text style={styles.signatureSub}>Prepared / Received By</Text>
            </View>

            <View style={styles.verifiedBadgeContainer}>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>VERIFIED PAYMENT RECEIPT</Text>
              </View>
            </View>

            <View style={styles.signatureBlock}>
              <View style={styles.signatureSpace} />
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Authorized Signatory</Text>
              <Text style={styles.signatureSub}>{"Sardar's Mall Accounts Dept."}</Text>
            </View>
          </View>

          <Text style={styles.legalDisclaimer}>
            This is a computer-generated official receipt issued by Sardar&apos;s Mall
            ERP. Payment is subject to realization of cheque / online transfer where
            applicable. Retain this receipt as valid proof of payment for your property
            allotment record.
          </Text>

          <Text style={styles.footerAddress}>
            {companyName} • {companyAddress}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
