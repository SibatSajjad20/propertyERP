/* eslint-disable react/no-unescaped-entities */
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { SARDARS_MALL_MARK_DATA_URL } from "./logo-base64";
import { formatPkr } from "@/lib/money";
import { COMPANY_LEGAL_NAME } from "../booking-form-content";
import {
  EXCESS_NOTE,
  RECEIPT_FOOTER_NOTE,
  paymentModeLabel,
  paymentReference,
  type ReceiptPayment,
} from "../receipt-math";
import { BRAND, INK, LINE, MUTED, pdfStyles } from "./styles";

export type DownPaymentReceiptProps = {
  receiptNo: string;
  printDate: string;
  serialNo: number | string;
  applicationFormNo: string;
  registrationNo: string;
  unitCode: string;
  floorName: string;
  unitType: string;
  netAreaSqft: string;
  ratePerSqftPkr: string;
  totalPrice: string;
  installmentType: string;
  perInstallment: string;
  bookingNo: string;
  bookingDate: string;
  bookingOffice: string;
  salesAgent: string;
  clientName: string;
  relationPrefix: string;
  relationName: string;
  clientCnic: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  bankName: string;
  accountTitle: string;
  iban: string;
  downPaymentLabel: string;
  downPaymentRequired: string;
  totalReceived: string;
  balance: string;
  payments: ReceiptPayment[];
  showExcessNote: boolean;
  signatoryName: string;
  signatoryDesignation: string;
};

function money(value: string) {
  return formatPkr(value);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 3 }}>
      <Text style={{ width: 118, fontSize: 8, color: MUTED }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 8, color: INK }}>{value || "—"}</Text>
    </View>
  );
}

export function receiptPdfPlainText(props: DownPaymentReceiptProps) {
  const paymentLines = props.payments.map((payment, index) =>
    [
      String(index + 1),
      paymentModeLabel(payment.method),
      payment.bank?.trim() || "—",
      paymentReference(payment),
      money(payment.amount),
    ].join(" "),
  );
  return [
    "Sardar's Mall",
    COMPANY_LEGAL_NAME,
    "DOWN PAYMENT RECEIPT",
    props.receiptNo,
    String(props.serialNo),
    props.applicationFormNo,
    props.registrationNo,
    props.unitCode,
    props.clientName,
    props.relationPrefix,
    props.relationName,
    props.clientCnic,
    props.downPaymentLabel,
    money(props.downPaymentRequired),
    money(props.totalReceived),
    money(props.balance),
    ...paymentLines,
    money(props.totalReceived),
    props.signatoryName,
    props.signatoryDesignation,
    ...(props.showExcessNote ? [EXCESS_NOTE] : []),
    RECEIPT_FOOTER_NOTE,
    COMPANY_LEGAL_NAME,
  ].join("\n");
}

export function DownPaymentReceiptPdf(props: DownPaymentReceiptProps) {
  return (
    <Document
      title={`Down payment receipt ${props.receiptNo}`}
      author={COMPANY_LEGAL_NAME}
    >
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerRow}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image src={SARDARS_MALL_MARK_DATA_URL} style={pdfStyles.brandLogo} />
              <View>
                <Text style={pdfStyles.company}>Sardar's Mall</Text>
                <Text style={pdfStyles.subtitle}>{COMPANY_LEGAL_NAME}</Text>
              </View>
            </View>
            <Text style={pdfStyles.title}>DOWN PAYMENT RECEIPT</Text>
          </View>
          <View style={pdfStyles.metaBlock}>
            <Text style={pdfStyles.metaLabel}>Print date</Text>
            <Text style={pdfStyles.metaValue}>{props.printDate}</Text>
            <Text style={pdfStyles.metaLabel}>Receipt #</Text>
            <Text style={pdfStyles.metaValue}>{props.receiptNo}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={pdfStyles.sectionTitle}>INVESTMENT DETAILS</Text>
            <View style={{ borderTopWidth: 0.5, borderTopColor: LINE, paddingTop: 6 }}>
              <Row label="Serial No." value={String(props.serialNo)} />
              <Row label="Application Form No" value={props.applicationFormNo} />
              <Row label="Registration No" value={props.registrationNo} />
              <Row label="Unique Unit No" value={props.unitCode} />
              <Row label="Floor" value={props.floorName} />
              <Row label="Unit Type" value={props.unitType} />
              <Row label="Size (sft)" value={props.netAreaSqft} />
              <Row label="Per sft rate" value={money(props.ratePerSqftPkr)} />
              <Row label="Total unit price PKR" value={money(props.totalPrice)} />
              <Row label="Installment type" value={props.installmentType} />
              <Row label="Per installment" value={money(props.perInstallment)} />
              <Row label="Booking ID" value={props.bookingNo} />
              <Row label="Booking date" value={props.bookingDate} />
              <Row label="Booking office" value={props.bookingOffice} />
              <Row label="Sales agent" value={props.salesAgent} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={pdfStyles.sectionTitle}>CUSTOMER INFO</Text>
            <View style={{ borderTopWidth: 0.5, borderTopColor: LINE, paddingTop: 6 }}>
              <Row label="Name" value={props.clientName} />
              <Row label={props.relationPrefix || "S/O"} value={props.relationName} />
              <Row label="CNIC" value={props.clientCnic} />
              <Row label="Email" value={props.clientEmail} />
              <Row label="Contact #" value={props.clientPhone} />
              <Row label="Address" value={props.clientAddress} />
              <View style={{ height: 8 }} />
              <Row label="Bank name" value={props.bankName} />
              <Row label="Account title" value={props.accountTitle} />
              <Row label="IBAN" value={props.iban} />
              <View style={{ height: 8 }} />
              <Row label="Down payment %" value={props.downPaymentLabel} />
              <Row
                label="Down payment required"
                value={money(props.downPaymentRequired)}
              />
              <Row label="Total amount received PKR" value={money(props.totalReceived)} />
              <Row label="Balance amount" value={money(props.balance)} />
            </View>
          </View>
        </View>

        <Text style={pdfStyles.sectionTitle}>PAYMENTS</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.th, { width: "6%" }]}>#</Text>
            <Text style={[pdfStyles.th, { width: "14%" }]}>Date</Text>
            <Text style={[pdfStyles.th, { width: "16%" }]}>Payment mode</Text>
            <Text style={[pdfStyles.th, { width: "22%" }]}>Bank/Branch/Other</Text>
            <Text style={[pdfStyles.th, { width: "22%" }]}>Reference #</Text>
            <Text style={[pdfStyles.th, { width: "20%", textAlign: "right" }]}>
              Amount PKR
            </Text>
          </View>
          {props.payments.map((payment, index) => (
            <View key={`${payment.paidAt}-${index}`} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.td, { width: "6%" }]}>{index + 1}</Text>
              <Text style={[pdfStyles.td, { width: "14%" }]}>
                {new Date(payment.paidAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
              <Text style={[pdfStyles.td, { width: "16%" }]}>
                {paymentModeLabel(payment.method)}
              </Text>
              <Text style={[pdfStyles.td, { width: "22%" }]}>
                {payment.bank?.trim() || "—"}
              </Text>
              <Text style={[pdfStyles.td, { width: "22%" }]}>
                {paymentReference(payment)}
              </Text>
              <Text
                style={[
                  pdfStyles.td,
                  { width: "20%", textAlign: "right", fontFamily: "Geist" },
                ]}
              >
                {money(payment.amount)}
              </Text>
            </View>
          ))}
          <View style={pdfStyles.tableRow}>
            <Text
              style={[
                pdfStyles.td,
                { width: "80%", fontFamily: "Geist", fontWeight: 700 },
              ]}
            >
              Total
            </Text>
            <Text
              style={[
                pdfStyles.td,
                {
                  width: "20%",
                  textAlign: "right",
                  fontFamily: "Geist",
                  fontWeight: 700,
                },
              ]}
            >
              {money(props.totalReceived)}
            </Text>
          </View>
        </View>

        {props.showExcessNote ? (
          <Text style={[pdfStyles.note, { marginTop: 10 }]}>{EXCESS_NOTE}</Text>
        ) : null}

        <View
          style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 28 }}
        >
          <View style={{ width: "30%" }}>
            <View style={{ borderTopWidth: 1, borderTopColor: INK, paddingTop: 6 }}>
              <Text style={pdfStyles.signLabel}>Customer</Text>
              <Text style={pdfStyles.signSub}>{props.clientName}</Text>
              <Text style={pdfStyles.signSub}>{props.clientCnic}</Text>
            </View>
          </View>
          <View style={{ width: "30%" }}>
            <View style={{ borderTopWidth: 1, borderTopColor: INK, paddingTop: 6 }}>
              <Text style={pdfStyles.signLabel}>Authorized</Text>
              <Text style={pdfStyles.signSub}>{props.signatoryName}</Text>
              <Text style={pdfStyles.signSub}>{props.signatoryDesignation}</Text>
            </View>
          </View>
          <View style={{ width: "30%" }}>
            <View style={{ borderTopWidth: 1, borderTopColor: INK, paddingTop: 6 }}>
              <Text style={pdfStyles.signLabel}>Advisor</Text>
              <Text style={pdfStyles.signSub}>{props.salesAgent || "—"}</Text>
            </View>
          </View>
        </View>

        <Text style={[pdfStyles.note, { marginTop: 20, color: BRAND }]}>
          {RECEIPT_FOOTER_NOTE}
        </Text>

        <View style={pdfStyles.footer} fixed>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
          <Text>{props.receiptNo}</Text>
        </View>
      </Page>
    </Document>
  );
}
