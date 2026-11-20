/* eslint-disable react/no-unescaped-entities */
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatUnitDisplayCode } from "@/lib/area";
import { formatPkr } from "@/lib/money";
import { AGREEMENT_CLAUSES, AGREEMENT_DEFINITIONS } from "../template";

export interface AgreementPdfScheduleRow {
  seq: number;
  label: string;
  type: string;
  dueDate: Date | string;
  amountPkr: string;
  paidDate?: Date | string | null;
  paidAmountPkr?: string | null;
  receiptNo?: string | null;
  surchargePkr?: string | null;
  status: string;
}

export interface AgreementPdfProps {
  agreementNo: string;
  agreementDate: Date | string;
  sellerName: string;
  anticipatedCompletionDate: string;
  buyer: {
    title?: string;
    fullName: string;
    relationPrefix: string;
    relationName: string;
    cnic: string;
    nationality: string;
    address: string;
    phone: string;
    email: string;
  };
  nominee: {
    name: string;
    relationPrefix?: string;
    relationName?: string;
    relation?: string;
    cnic: string;
    nationality: string;
    address: string;
    phone?: string;
  } | null;
  unit: {
    unitCode: string;
    categoryName: string;
    floorName: string;
    grossAreaSqft: string;
  };
  financials: {
    totalPricePkr: string;
    bookingAmountPkr: string;
    possessionAmountPkr?: string;
    balloonTotalAmountPkr?: string;
    tokenAdjustedAmountPkr?: string;
    plan?: string;
    downPaymentReceiptNo?: string | null;
    downPaymentPaidAt?: Date | string | null;
    downPaymentPaidAmountPkr?: string | null;
  };
  witness1Name?: string | null;
  witness2Name?: string | null;
  scheduleRows: AgreementPdfScheduleRow[];
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 52,
    paddingHorizontal: 44,
    fontSize: 9.2,
    lineHeight: 1.48,
    color: "#111827",
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    letterSpacing: 0.8,
    marginBottom: 10,
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 9,
    textAlign: "center",
    color: "#475569",
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 5,
    color: "#0F172A",
    paddingBottom: 2,
  },
  paragraph: {
    marginBottom: 6,
    textAlign: "justify",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  table: {
    marginTop: 6,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#CBD5E1",
    borderLeftWidth: 0.5,
    borderLeftColor: "#CBD5E1",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  tableHeader: {
    backgroundColor: "#F1F5F9",
    fontFamily: "Helvetica-Bold",
    borderTopWidth: 0.5,
    borderTopColor: "#CBD5E1",
  },
  defTermCell: {
    width: "26%",
    padding: 5,
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
  },
  defBodyCell: {
    width: "74%",
    padding: 5,
    fontSize: 8.5,
  },
  schedLabelCell: {
    width: "32%",
    padding: 5,
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#F8FAFC",
    fontSize: 8.8,
  },
  schedValCell: {
    width: "68%",
    padding: 5,
    fontSize: 8.8,
  },
  schedGroupHeader: {
    backgroundColor: "#0F172A",
    color: "#FFFFFF",
    padding: 5,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  sigGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 14,
  },
  sigCol: {
    width: "46%",
  },
  sigLineBox: {
    marginTop: 22,
    paddingTop: 4,
  },
  sigRule: {
    height: 0.8,
    backgroundColor: "#334155",
    marginBottom: 4,
  },
  sigLineText: {
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    fontSize: 7.5,
    color: "#64748B",
  },
  payColSeq: {
    width: "4%",
    padding: 3,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColItem: {
    width: "20%",
    padding: 3,
    paddingLeft: 4,
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColDueDate: {
    width: "9.5%",
    padding: 3,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColDueAmt: {
    width: "11%",
    padding: 3,
    paddingRight: 4,
    textAlign: "right",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColPaidDate: {
    width: "9.5%",
    padding: 3,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColPaidAmt: {
    width: "11%",
    padding: 3,
    paddingRight: 4,
    textAlign: "right",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColReceipt: {
    width: "14.5%",
    padding: 3,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColSurcharge: {
    width: "9.5%",
    padding: 3,
    paddingRight: 4,
    textAlign: "right",
    borderRightWidth: 0.5,
    borderRightColor: "#CBD5E1",
  },
  payColStatus: {
    width: "11%",
    padding: 3,
    textAlign: "center",
  },
  payHeaderCell: {
    textAlign: "center",
    justifyContent: "center",
  },
});

function formatDateParts(date: Date | string) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return { day: "__", month: "____", year: "2026", short: String(date) };
  }
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: d.toLocaleString("en-GB", { month: "short" }),
    year: String(d.getFullYear()),
    short: d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
}

function relationLong(prefix: string): string {
  switch (prefix.toUpperCase()) {
    case "W/O":
      return "wife of";
    case "D/O":
      return "daughter of";
    default:
      return "son of";
  }
}

function SignatureBlock({
  sellerName,
  buyerName,
  witness1Name,
  witness2Name,
}: {
  sellerName: string;
  buyerName: string;
  witness1Name?: string | null;
  witness2Name?: string | null;
}) {
  return (
    <View wrap={false}>
      <View style={styles.sigGrid}>
        <View style={styles.sigCol}>
          <View style={styles.sigLineBox}>
            <View style={styles.sigRule} />
            <Text style={styles.sigLineText}>
              <Text style={styles.bold}>Name: </Text>
              {sellerName}
            </Text>
          </View>
          <Text style={{ fontSize: 8.5, color: "#475569" }}>The Seller / Vendor</Text>
        </View>
        <View style={styles.sigCol}>
          <View style={styles.sigLineBox}>
            <View style={styles.sigRule} />
            <Text style={styles.sigLineText}>
              <Text style={styles.bold}>Name: </Text>
              {buyerName}
            </Text>
          </View>
          <Text style={{ fontSize: 8.5, color: "#475569" }}>The Buyer / Vendee</Text>
        </View>
      </View>
      <Text style={[styles.bold, { fontSize: 9, marginTop: 4 }]}>WITNESSES</Text>
      <View style={[styles.sigGrid, { marginTop: 6 }]}>
        <View style={styles.sigCol}>
          <View style={styles.sigLineBox}>
            <View style={styles.sigRule} />
            <Text style={styles.sigLineText}>
              1. Name: {witness1Name?.trim() || "___________________________"}
            </Text>
          </View>
        </View>
        <View style={styles.sigCol}>
          <View style={styles.sigLineBox}>
            <View style={styles.sigRule} />
            <Text style={styles.sigLineText}>
              2. Name: {witness2Name?.trim() || "___________________________"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function AgreementFooter({
  agreementNo,
  unitDisplay,
}: {
  agreementNo: string;
  unitDisplay: string;
}) {
  return (
    <View style={styles.footer} fixed>
      <Text>{`Agreement # ${agreementNo} • ${unitDisplay} • SARDAR'S MALL`}</Text>
      <Text
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

export function SalePurchaseAgreementPdf(props: AgreementPdfProps) {
  const dt = formatDateParts(props.agreementDate);
  const unitDisplay = formatUnitDisplayCode(props.unit.unitCode, props.unit.categoryName);
  const buyerTitle = props.buyer.title
    ? `${props.buyer.title.replace(/\.?$/, "")}. `
    : "";
  const buyerDisplayName = `${buyerTitle}${props.buyer.fullName}`;
  const isFemale =
    props.buyer.title === "Mrs" ||
    props.buyer.title === "Ms" ||
    props.buyer.relationPrefix === "W/O" ||
    props.buyer.relationPrefix === "D/O";

  return (
    <Document
      title={`Sale and Purchase Agreement - ${props.agreementNo}`}
      author="M/s ASSH Developers (Private) Limited"
    >
      {/* Pages 1+: Main Agreement Body & Clauses */}
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>SALE AND PURCHASE AGREEMENT</Text>
        <Text style={styles.subtitle}>
          Agreement No. {props.agreementNo} • SARDAR'S MALL • Plot # 54-C, Satellite Town,
          Rawalpindi
        </Text>

        <Text style={styles.paragraph}>
          This Agreement is made at Rawalpindi on this{" "}
          <Text style={styles.bold}>{dt.day}</Text> day of{" "}
          <Text style={styles.bold}>
            {dt.month} {dt.year}
          </Text>
        </Text>

        <Text style={[styles.bold, { marginTop: 4, marginBottom: 4 }]}>BETWEEN:</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>{props.sellerName}</Text> (hereinafter referred to as
          the "Seller/ Vendor" which expression shall, where the context so admits, means
          and include his nominees, successors, successors-in-title, administrators, or
          assignees) The party of the First Part
        </Text>

        <Text style={[styles.bold, { marginBottom: 4 }]}>AND</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>{buyerDisplayName}</Text>{" "}
          {relationLong(props.buyer.relationPrefix)}{" "}
          <Text style={styles.bold}>{props.buyer.relationName}</Text> having CNIC No.{" "}
          <Text style={styles.bold}>{props.buyer.cnic}</Text> Resident of{" "}
          <Text style={styles.bold}>{props.buyer.address}</Text> (hereinafter referred to
          as the "Buyer / Vendee" which expression shall, where the context so admits,
          means and include {isFemale ? "her" : "his"} nominees, successors,
          successors-in-title) and further detailed as mentioned in the Schedule-A. The
          party of the Second Part
        </Text>

        <Text style={[styles.bold, { marginTop: 6, marginBottom: 4 }]}>WHEREAS</Text>
        <Text style={styles.paragraph}>
          (i) The Seller/Vendor being the absolute owner is developing/constructing a
          multistory commercial, residential apartment / office building/complex known as
          M/s ASSH DEVELOPERS (PRIVATE) LIMITED Building on the Plot # 54-C located in
          Satellite Town, Rawalpindi (hereinafter referred to as the "PROJECT"), where the
          PROJECT being developed by the Seller/Vendor is known as the SARDAR'S MALL.
        </Text>
        <Text style={styles.paragraph}>
          (ii) The Buyer/Vendee has seen the plan for the PROJECT and desires to acquire
          and purchase from the Seller/Vendor the{" "}
          <Text style={styles.bold}>{unitDisplay}</Text> Located at{" "}
          <Text style={styles.bold}>{props.unit.floorName}</Text> (Gross Area:{" "}
          <Text style={styles.bold}>{props.unit.grossAreaSqft} sq-ft</Text>) (hereinafter
          referred to as the "Unit") as detailed in the Schedule-B.
        </Text>
        <Text style={styles.paragraph}>
          (iii) The Seller/Vendor has agreed to sell and the Buyer/Vendee has agreed to
          buy the Unit, at the under-construction PROJECT against the agreed consideration
          in installments as detailed in the Schedule-B.
        </Text>
        <Text style={styles.paragraph}>
          NOW, THEREFORE, the Parties, intending to be legally bound, agree to the
          following terms and conditions of this Agreement along with two Schedules
          appended hereto, which shall form an integral part of this Agreement:
        </Text>

        <SignatureBlock
          sellerName={props.sellerName}
          buyerName={props.buyer.fullName}
          witness1Name={props.witness1Name}
          witness2Name={props.witness2Name}
        />

        <AgreementFooter agreementNo={props.agreementNo} unitDisplay={unitDisplay} />
      </Page>

      {/* Definitions & Interpretation */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>DEFINITIONS AND INTERPRETATION</Text>
        <Text style={styles.paragraph}>
          Unless the context otherwise requires, capitalized terms used in this Agreement
          of Sale and Purchase shall have the meanings set out below:
        </Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]} wrap={false}>
            <View style={styles.defTermCell}>
              <Text>Term</Text>
            </View>
            <View style={styles.defBodyCell}>
              <Text>Definition</Text>
            </View>
          </View>
          {AGREEMENT_DEFINITIONS.map((row) => (
            <View key={row.term} style={styles.tableRow} wrap={false}>
              <View style={styles.defTermCell}>
                <Text>{row.term}</Text>
              </View>
              <View style={styles.defBodyCell}>
                <Text>{row.definition}</Text>
              </View>
            </View>
          ))}
        </View>

        <AgreementFooter agreementNo={props.agreementNo} unitDisplay={unitDisplay} />
      </Page>

      {/* All 22 Clauses */}
      <Page size="A4" style={styles.page}>
        {AGREEMENT_CLAUSES.map((clause) => (
          <View key={clause.number}>
            <Text style={styles.sectionHeading}>
              {clause.number}. {clause.title}
            </Text>
            {clause.paragraphs.map((p, idx) => (
              <Text key={`${clause.number}-${idx}`} style={styles.paragraph}>
                {p}
              </Text>
            ))}
          </View>
        ))}

        <Text style={[styles.paragraph, { marginTop: 10 }]}>
          IN WITNESSES THEREOF the Parties above mentioned have signed this agreement in
          token of acceptance of terms thereto in presence of the witnesses.
        </Text>
        <SignatureBlock
          sellerName={props.sellerName}
          buyerName={props.buyer.fullName}
          witness1Name={props.witness1Name}
          witness2Name={props.witness2Name}
        />

        <AgreementFooter agreementNo={props.agreementNo} unitDisplay={unitDisplay} />
      </Page>

      {/* Schedule-A: Owner Details */}
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>SCHEDULE-A</Text>
        <Text style={styles.subtitle}>OWNER &amp; UNIT DETAILS</Text>

        <View style={styles.table}>
          <View style={styles.schedGroupHeader}>
            <Text>BUYER</Text>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={styles.schedLabelCell}>
              <Text>NAME</Text>
            </View>
            <View style={styles.schedValCell}>
              <Text>{buyerDisplayName}</Text>
            </View>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={styles.schedLabelCell}>
              <Text>NATIONALITY</Text>
            </View>
            <View style={styles.schedValCell}>
              <Text>{props.buyer.nationality}</Text>
            </View>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={styles.schedLabelCell}>
              <Text>CNIC NO.</Text>
            </View>
            <View style={styles.schedValCell}>
              <Text>{props.buyer.cnic}</Text>
            </View>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={styles.schedLabelCell}>
              <Text>PRESENT ADDRESS</Text>
            </View>
            <View style={styles.schedValCell}>
              <Text>{props.buyer.address}</Text>
            </View>
          </View>

          <View style={styles.schedGroupHeader}>
            <Text>NOMINEE</Text>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={styles.schedLabelCell}>
              <Text>NAME</Text>
            </View>
            <View style={styles.schedValCell}>
              <Text>{props.nominee?.name || "—"}</Text>
            </View>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={styles.schedLabelCell}>
              <Text>NATIONALITY</Text>
            </View>
            <View style={styles.schedValCell}>
              <Text>{props.nominee?.nationality || "Pakistani"}</Text>
            </View>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={styles.schedLabelCell}>
              <Text>CNIC NO.</Text>
            </View>
            <View style={styles.schedValCell}>
              <Text>{props.nominee?.cnic || "—"}</Text>
            </View>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={styles.schedLabelCell}>
              <Text>PRESENT ADDRESS</Text>
            </View>
            <View style={styles.schedValCell}>
              <Text>{props.nominee?.address || props.buyer.address}</Text>
            </View>
          </View>

          <View style={styles.schedGroupHeader}>
            <Text>CONTACT &amp; UNIT PARTICULARS</Text>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={styles.schedLabelCell}>
              <Text>MOBILE</Text>
            </View>
            <View style={styles.schedValCell}>
              <Text>{props.buyer.phone}</Text>
            </View>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={styles.schedLabelCell}>
              <Text>E-MAIL</Text>
            </View>
            <View style={styles.schedValCell}>
              <Text>{props.buyer.email || "—"}</Text>
            </View>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={styles.schedLabelCell}>
              <Text>COMPLETION DATE</Text>
            </View>
            <View style={styles.schedValCell}>
              <Text>{props.anticipatedCompletionDate}</Text>
            </View>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={styles.schedLabelCell}>
              <Text>UNIT DETAILS</Text>
            </View>
            <View style={styles.schedValCell}>
              <Text>
                {`${unitDisplay}, ${props.unit.categoryName}, ${props.unit.floorName}, Unit Size# ${props.unit.grossAreaSqft} sq-ft`}
              </Text>
            </View>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={styles.schedLabelCell}>
              <Text>TOTAL UNIT PRICE</Text>
            </View>
            <View style={styles.schedValCell}>
              <Text style={styles.bold}>
                {formatPkr(props.financials.totalPricePkr)}/- Total Unit Price
              </Text>
            </View>
          </View>
          <View style={styles.tableRow} wrap={false}>
            <View style={styles.schedLabelCell}>
              <Text>BOOKING / DOWN PAYMENT</Text>
            </View>
            <View style={styles.schedValCell}>
              <Text style={styles.bold}>
                {formatPkr(props.financials.bookingAmountPkr)}/- Booking Amount
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.paragraph, { marginTop: 10 }]}>
          That I{" "}
          <Text style={styles.bold}>
            {buyerDisplayName}, {props.buyer.relationPrefix} {props.buyer.relationName}
          </Text>{" "}
          have read and understood the terms contained herein, and my understanding as to
          the meaning and implication of the terms is clear and unambiguous, and that this
          Agreement, along with all accompanying documents mentioned herein and forming
          part hereof as the case may be, shall be read together as a composite document
          and I do hereby agree to be bound by the same.
        </Text>

        <SignatureBlock
          sellerName={props.sellerName}
          buyerName={buyerDisplayName}
          witness1Name={props.witness1Name}
          witness2Name={props.witness2Name}
        />

        <AgreementFooter agreementNo={props.agreementNo} unitDisplay={unitDisplay} />
      </Page>

      {/* Schedule-B: Payment Plan Schedule */}
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>SCHEDULE-B</Text>
        <Text style={styles.subtitle}>
          PAYMENT PLAN SCHEDULE • {unitDisplay} • {buyerDisplayName}
        </Text>

        <View style={styles.table}>
          <View
            style={[styles.tableRow, styles.tableHeader, { fontSize: 6.8 }]}
            wrap={false}
          >
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

          {/* Booking / Down Payment Row */}
          <View style={[styles.tableRow, { fontSize: 6.5 }]} wrap={false}>
            <View style={styles.payColSeq}>
              <Text>0</Text>
            </View>
            <View style={styles.payColItem}>
              <Text style={styles.bold}>Down Payment / Booking Amount</Text>
            </View>
            <View style={styles.payColDueDate}>
              <Text>{dt.short}</Text>
            </View>
            <View style={styles.payColDueAmt}>
              <Text style={styles.bold}>
                {formatPkr(props.financials.bookingAmountPkr)}
              </Text>
            </View>
            <View style={styles.payColPaidDate}>
              <Text>
                {props.financials.downPaymentPaidAt
                  ? formatDateParts(props.financials.downPaymentPaidAt).short
                  : dt.short}
              </Text>
            </View>
            <View style={styles.payColPaidAmt}>
              <Text style={styles.bold}>
                {formatPkr(
                  props.financials.downPaymentPaidAmountPkr ||
                    props.financials.bookingAmountPkr,
                )}
              </Text>
            </View>
            <View style={styles.payColReceipt}>
              <Text style={{ fontSize: 6.2 }}>
                {props.financials.downPaymentReceiptNo || "—"}
              </Text>
            </View>
            <View
              style={[styles.payColSurcharge, { textAlign: "center", paddingRight: 0 }]}
            >
              <Text>—</Text>
            </View>
            <View style={styles.payColStatus}>
              <Text style={[styles.bold, { color: "#166534" }]}>PAID</Text>
            </View>
          </View>

          {props.scheduleRows.map((row) => {
            const isPaid = row.status?.toUpperCase() === "PAID";
            const paidDateStr = row.paidDate ? formatDateParts(row.paidDate).short : "—";
            const hasPaidAmt = row.paidAmountPkr && Number(row.paidAmountPkr) > 0;
            const paidAmtStr = hasPaidAmt
              ? formatPkr(row.paidAmountPkr!)
              : isPaid
                ? formatPkr(row.amountPkr)
                : "—";
            const hasSurcharge = row.surchargePkr && Number(row.surchargePkr) > 0;
            const surchargeStr = hasSurcharge ? formatPkr(row.surchargePkr!) : "—";

            return (
              <View
                key={row.seq}
                style={[styles.tableRow, { fontSize: 6.5 }]}
                wrap={false}
              >
                <View style={styles.payColSeq}>
                  <Text>{row.seq}</Text>
                </View>
                <View style={styles.payColItem}>
                  <Text>{row.label}</Text>
                </View>
                <View style={styles.payColDueDate}>
                  <Text>{formatDateParts(row.dueDate).short}</Text>
                </View>
                <View style={styles.payColDueAmt}>
                  <Text>{formatPkr(row.amountPkr)}</Text>
                </View>
                <View style={styles.payColPaidDate}>
                  <Text>{paidDateStr}</Text>
                </View>
                <View
                  style={[
                    styles.payColPaidAmt,
                    paidAmtStr === "—"
                      ? { textAlign: "center", paddingRight: 0 }
                      : undefined,
                  ]}
                >
                  <Text>{paidAmtStr}</Text>
                </View>
                <View style={styles.payColReceipt}>
                  <Text style={{ fontSize: 6.2 }}>{row.receiptNo || "—"}</Text>
                </View>
                <View
                  style={[
                    styles.payColSurcharge,
                    surchargeStr === "—"
                      ? { textAlign: "center", paddingRight: 0 }
                      : undefined,
                  ]}
                >
                  <Text>{surchargeStr}</Text>
                </View>
                <View style={styles.payColStatus}>
                  <Text
                    style={
                      isPaid
                        ? [styles.bold, { color: "#166534" }]
                        : row.status?.toUpperCase() === "OVERDUE"
                          ? [styles.bold, { color: "#991B1B" }]
                          : undefined
                    }
                  >
                    {row.status}
                  </Text>
                </View>
              </View>
            );
          })}

          <View
            style={[styles.tableRow, styles.tableHeader, { fontSize: 6.8 }]}
            wrap={false}
          >
            <View style={styles.payColSeq}>
              <Text>—</Text>
            </View>
            <View style={styles.payColItem}>
              <Text style={styles.bold}>TOTAL PURCHASE PRICE</Text>
            </View>
            <View style={styles.payColDueDate}>
              <Text>—</Text>
            </View>
            <View style={styles.payColDueAmt}>
              <Text style={styles.bold}>{formatPkr(props.financials.totalPricePkr)}</Text>
            </View>
            <View style={styles.payColPaidDate}>
              <Text>—</Text>
            </View>
            <View
              style={[styles.payColPaidAmt, { textAlign: "center", paddingRight: 0 }]}
            >
              <Text>—</Text>
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

        <SignatureBlock
          sellerName={props.sellerName}
          buyerName={buyerDisplayName}
          witness1Name={props.witness1Name}
          witness2Name={props.witness2Name}
        />

        <AgreementFooter agreementNo={props.agreementNo} unitDisplay={unitDisplay} />
      </Page>
    </Document>
  );
}
