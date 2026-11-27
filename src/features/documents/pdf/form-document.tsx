/* eslint-disable jsx-a11y/alt-text, react/no-unescaped-entities */
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { formatPkr } from "@/lib/money";
import { formatUnitDisplayCode } from "@/lib/area";
import { BOOKING_FORM_CONTENT, COMPANY_LEGAL_NAME } from "../booking-form-content";
import { pdfStyles, BRAND, INK, MUTED, BG_LIGHT, BG_WHITE } from "./styles";
import { SARDARS_MALL_MARK_DATA_URL } from "./logo-base64";
import type { EmbeddedImage } from "./images";

export type PdfParty = {
  name: string;
  relationPrefix?: string;
  relationName?: string;
  cnic: string;
  phone: string;
  address: string;
  postalAddress?: string;
  residentialAddress?: string;
  phoneOffice?: string;
  phoneRes?: string;
  mobile2?: string;
  email?: string;
  relation?: string;
};

export type PdfUnit = {
  unitCode: string;
  floorName: string;
  categoryName: string;
  grossAreaSqft?: string;
  netAreaSqft?: string;
  ratePerSqftPkr: string;
};

export type PdfInstallment = {
  seq: number;
  dueDate: Date | string;
  amount: string;
  status: string;
  type?: string;
  label?: string;
  surchargeAmount?: string;
};

export type PdfEnclosure = {
  amount?: string;
  mode?: string;
  reference?: string;
  date?: string;
  bank?: string;
};

export type FormPdfProps = {
  kind: "booking" | "sale";
  serialNo: number | string;
  applicationFormNo: string;
  registrationNo: string;
  documentNo?: string;
  date: Date | string;
  printDate?: Date | string;
  generatedOn: string;
  unit: PdfUnit;
  client: PdfParty;
  nextOfKin: PdfParty | null;
  photo: EmbeddedImage | null;
  kinPhoto?: EmbeddedImage | null;
  payment: {
    listPrice?: string;
    netPrice: string;
    discount?: string;
    downPayment?: string;
    plan?: string;
    installmentCount?: number;
    balloonAmountPerYear?: string;
    balloonTotalAmount?: string;
    possessionAmount?: string;
    surchargeAmount?: string;
  };
  installments?: PdfInstallment[];
  enclosure?: PdfEnclosure;
  appendix: {
    include: boolean;
    clientFront?: EmbeddedImage | null;
    clientBack?: EmbeddedImage | null;
    kinFront?: EmbeddedImage | null;
    kinBack?: EmbeddedImage | null;
  };
};

function dateLabel(value: Date | string) {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value || "—");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fillBlank(value: string | undefined, width = 20) {
  const trimmed = value?.trim();
  if (trimmed) return trimmed;
  return "_".repeat(width);
}

export function enclosureLines(
  content: typeof BOOKING_FORM_CONTENT.enclosure,
  enclosure?: PdfEnclosure,
) {
  const rawAmount = enclosure?.amount?.trim();
  const amount = rawAmount
    ? rawAmount.startsWith("Rs")
      ? rawAmount.replace(/^Rs\.?\s*/, "")
      : rawAmount
    : fillBlank(undefined, 20);
  const mode = enclosure?.mode?.trim() || "Cash/Cheque/Pay Order";
  const reference = fillBlank(enclosure?.reference, 18);
  const dated = fillBlank(enclosure?.date, 18);
  const bank = fillBlank(enclosure?.bank, 18);
  return [
    content[0]
      .replace("Rs.___________________________", `Rs. ${amount}`)
      .replace(
        "Cash/Cheque/Pay Order No._______________________",
        `${mode} No. ${reference}`,
      ),
    content[1]
      .replace("Dated: ___________________________", `Dated: ${dated}`)
      .replace("drawn on ______________________", `drawn on ${bank}`),
  ];
}

export function legalPdfPlainText(props: {
  serialNo: number | string;
  applicationFormNo: string;
  registrationNo: string;
  enclosure?: PdfEnclosure;
}) {
  return [
    BOOKING_FORM_CONTENT.declarationTitle,
    ...BOOKING_FORM_CONTENT.declaration,
    ...enclosureLines(BOOKING_FORM_CONTENT.enclosure, props.enclosure),
    ...BOOKING_FORM_CONTENT.terms,
    BOOKING_FORM_CONTENT.note,
    BOOKING_FORM_CONTENT.finalDeclaration,
    COMPANY_LEGAL_NAME,
    String(props.serialNo),
    props.applicationFormNo,
    props.registrationNo,
  ].join("\n");
}

function PageFooter({
  applicationFormNo,
  unitCode,
  printDate,
}: {
  applicationFormNo: string;
  unitCode: string;
  printDate?: Date | string;
}) {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
      <Text>{`${applicationFormNo} • Unit ${unitCode}`}</Text>
      <Text>{`Print Date: ${dateLabel(printDate || new Date())}`}</Text>
      <Text>{COMPANY_LEGAL_NAME}</Text>
    </View>
  );
}

function PhotoBox({
  image,
  styleBox,
  styleImage,
  placeholder,
}: {
  image?: EmbeddedImage | null;
  styleBox: typeof pdfStyles.photoBox;
  styleImage: typeof pdfStyles.photo;
  placeholder?: string;
}) {
  return (
    <View style={styleBox}>
      {image ? (
        <Image src={image.dataUrl} style={styleImage} />
      ) : (
        <Text style={pdfStyles.photoPlaceholder}>{placeholder ?? "AFFIX PHOTO"}</Text>
      )}
    </View>
  );
}

function GridField({
  label,
  value,
  style,
  isPrice,
  isMono,
}: {
  label: string;
  value: string;
  style?: React.ComponentProps<typeof View>["style"];
  isPrice?: boolean;
  isMono?: boolean;
}) {
  return (
    <View style={[{ flex: 1, minWidth: "30%" }, style]}>
      <Text style={pdfStyles.fieldLabel}>{label}</Text>
      <Text
        style={
          isPrice
            ? pdfStyles.fieldValuePrice
            : isMono
              ? pdfStyles.fieldValueBold
              : pdfStyles.fieldValue
        }
      >
        {value || "—"}
      </Text>
    </View>
  );
}

function AppendixItem({ title, image }: { title: string; image?: EmbeddedImage | null }) {
  return (
    <View style={pdfStyles.appendixCard}>
      <View style={pdfStyles.appendixCardHeader}>
        <Text style={pdfStyles.appendixCardTitle}>{title}</Text>
        <Text style={pdfStyles.appendixCardBadge}>
          {image ? "VERIFIED" : "NOT ON FILE"}
        </Text>
      </View>
      <View style={pdfStyles.appendixImageWrap}>
        {image ? (
          <Image src={image.dataUrl} style={pdfStyles.appendixImage} />
        ) : (
          <Text style={pdfStyles.appendixPlaceholder}>No document uploaded on file</Text>
        )}
      </View>
    </View>
  );
}

export function FormalFormPdf(props: FormPdfProps) {
  const isBooking = props.kind === "booking";
  const title = isBooking ? "BOOKING APPLICATION FORM" : "SALE APPLICATION FORM";
  const filledEnclosure = enclosureLines(BOOKING_FORM_CONTENT.enclosure, props.enclosure);
  const relationLabel = props.client.relationPrefix || "S/O";
  const hasInstallments = Boolean(props.installments && props.installments.length > 0);

  const netPriceNum = parseFloat(props.payment.netPrice) || 0;
  const downPaymentNum = parseFloat(props.payment.downPayment || "0") || 0;
  const balanceNum = Math.max(0, netPriceNum - downPaymentNum);

  const totalScheduledInstallments = (props.installments ?? []).reduce(
    (sum, inst) => sum + (parseFloat(inst.amount) || 0),
    0,
  );

  return (
    <Document
      title={`${title} - ${props.applicationFormNo}`}
      author={COMPANY_LEGAL_NAME}
      subject={`Unit ${props.unit.unitCode} Allotment Application`}
    >
      {/* PAGE 1: MASTER APPLICATION & ALLOTMENT FORM */}
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.headerRow}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "flex-start",
              marginRight: 10,
            }}
          >
            <Image src={SARDARS_MALL_MARK_DATA_URL} style={pdfStyles.brandLogo} />
            <View style={{ flex: 1 }}>
              <Text style={pdfStyles.company}>SARDAR'S MALL</Text>
              <Text style={pdfStyles.subtitle}>
                A Premier Project by {COMPANY_LEGAL_NAME}
              </Text>
              <Text style={pdfStyles.title}>{title}</Text>
              <View style={pdfStyles.headerMetaBox}>
                <View style={pdfStyles.headerMetaItem}>
                  <Text style={pdfStyles.headerMetaLabel}>Serial No</Text>
                  <Text style={pdfStyles.headerMetaValue}>{String(props.serialNo)}</Text>
                </View>
                <View style={pdfStyles.headerMetaItem}>
                  <Text style={pdfStyles.headerMetaLabel}>Application Form No</Text>
                  <Text style={pdfStyles.headerMetaValue}>{props.applicationFormNo}</Text>
                </View>
                <View style={pdfStyles.headerMetaItem}>
                  <Text style={pdfStyles.headerMetaLabel}>Registration No</Text>
                  <Text style={pdfStyles.headerMetaValue}>{props.registrationNo}</Text>
                </View>
                <View style={pdfStyles.headerMetaItem}>
                  <Text style={pdfStyles.headerMetaLabel}>
                    {props.kind === "sale" ? "Sale Date" : "Booking Date"}
                  </Text>
                  <Text style={pdfStyles.headerMetaValue}>{dateLabel(props.date)}</Text>
                </View>
              </View>
            </View>
          </View>
          <PhotoBox
            image={props.photo}
            styleBox={pdfStyles.photoBox}
            styleImage={pdfStyles.photo}
            placeholder="AFFIX PASSPORT PHOTOGRAPH"
          />
        </View>

        {/* Section 1: Unit Specifications & Pricing */}
        <View style={pdfStyles.card}>
          <View style={pdfStyles.cardHeader}>
            <Text style={pdfStyles.cardHeaderTitle}>
              1. Unit Specifications & Pricing
            </Text>
            <Text style={pdfStyles.cardHeaderBadge}>Allotment Reference</Text>
          </View>
          <View style={pdfStyles.cardBody}>
            <View style={pdfStyles.fieldRow}>
              <GridField
                label="Unit Unique No"
                value={formatUnitDisplayCode(
                  props.unit.unitCode,
                  props.unit.categoryName,
                )}
                isMono
              />
              <GridField label="Floor Level" value={props.unit.floorName} />
              <GridField label="Property Category" value={props.unit.categoryName} />
            </View>
            <View style={pdfStyles.fieldRow}>
              <GridField
                label="Gross Area (Sq Ft)"
                value={`${props.unit.grossAreaSqft || props.unit.netAreaSqft || "—"} sft`}
              />
              <GridField
                label="Total Unit Price (PKR)"
                value={formatPkr(props.payment.netPrice)}
                isPrice
              />
              <GridField
                label="Down Payment Amount"
                value={
                  props.payment.downPayment ? formatPkr(props.payment.downPayment) : "—"
                }
                isPrice
              />
            </View>
            <View style={[pdfStyles.fieldRow, { marginBottom: 0 }]}>
              <GridField
                label="Annual Balloon Payments"
                value={
                  props.payment.balloonTotalAmount &&
                  Number(props.payment.balloonTotalAmount) > 0
                    ? formatPkr(props.payment.balloonTotalAmount)
                    : "None"
                }
                isPrice
              />
              <GridField
                label="On Possession Amount"
                value={
                  props.payment.possessionAmount &&
                  Number(props.payment.possessionAmount) > 0
                    ? formatPkr(props.payment.possessionAmount)
                    : "None"
                }
                isPrice
              />
              <GridField
                label="Payment Plan Structure"
                value={
                  props.payment.plan
                    ? props.payment.plan.replace(/_/g, " ")
                    : "Standard Plan"
                }
              />
            </View>
            {Boolean(
              props.payment.surchargeAmount && Number(props.payment.surchargeAmount) > 0,
            ) && (
              <View style={[pdfStyles.fieldRow, { marginTop: 4, marginBottom: 0 }]}>
                <GridField
                  label="Overdue Surcharge"
                  value={formatPkr(props.payment.surchargeAmount!)}
                  isPrice
                />
              </View>
            )}
          </View>
        </View>

        {/* Section 2: Applicant Particulars */}
        <View style={pdfStyles.card}>
          <View style={pdfStyles.cardHeader}>
            <Text style={pdfStyles.cardHeaderTitle}>2. Applicant Particulars</Text>
            <Text style={pdfStyles.cardHeaderBadge}>Primary Allottee</Text>
          </View>
          <View style={pdfStyles.cardBody}>
            <View style={pdfStyles.fieldRow}>
              <GridField label="Full Name" value={props.client.name} />
              <GridField
                label={`Father / Husband (${relationLabel})`}
                value={props.client.relationName ?? ""}
              />
              <GridField label="CNIC Number" value={props.client.cnic} isMono />
            </View>
            <View style={pdfStyles.fieldRow}>
              <GridField label="Mobile Contact" value={props.client.phone} isMono />
              <GridField
                label="Office / Secondary Phone"
                value={props.client.phoneOffice || props.client.mobile2 || "—"}
              />
              <GridField label="Email Address" value={props.client.email ?? ""} />
            </View>
            <View style={[pdfStyles.fieldRow, { marginBottom: 0 }]}>
              <GridField
                label="Residential Address"
                value={props.client.residentialAddress || props.client.address}
                style={{ flex: 1 }}
              />
              <GridField
                label="Postal / Mailing Address"
                value={props.client.postalAddress || props.client.address}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </View>

        {/* Section 3: Next of Kin / Nominee */}
        {props.nextOfKin ? (
          <View style={pdfStyles.card}>
            <View style={pdfStyles.cardHeader}>
              <Text style={pdfStyles.cardHeaderTitle}>
                3. Next of Kin / Nominee Particulars
              </Text>
              <Text style={pdfStyles.cardHeaderBadge}>Succession Nominee</Text>
            </View>
            <View
              style={[pdfStyles.cardBody, { flexDirection: "row", alignItems: "center" }]}
            >
              <View style={{ flex: 1 }}>
                <View style={pdfStyles.fieldRow}>
                  <GridField label="Nominee Name" value={props.nextOfKin.name} />
                  <GridField
                    label={`Relation / Prefix (${props.nextOfKin.relationPrefix || "S/O"})`}
                    value={props.nextOfKin.relationName ?? ""}
                  />
                  <GridField
                    label="Relationship"
                    value={props.nextOfKin.relation ?? ""}
                  />
                </View>
                <View style={[pdfStyles.fieldRow, { marginBottom: 0 }]}>
                  <GridField label="Nominee CNIC" value={props.nextOfKin.cnic} isMono />
                  <GridField
                    label="Contact Number"
                    value={props.nextOfKin.phone}
                    isMono
                  />
                  <GridField
                    label="Nominee Address"
                    value={props.nextOfKin.address ?? "Same as applicant"}
                  />
                </View>
              </View>
              <PhotoBox
                image={props.kinPhoto}
                styleBox={pdfStyles.kinPhotoBox}
                styleImage={pdfStyles.kinPhoto}
                placeholder="KIN PHOTO"
              />
            </View>
          </View>
        ) : null}

        {/* Section 4: Declaration & Payment Enclosure */}
        <View style={pdfStyles.card}>
          <View style={pdfStyles.cardHeader}>
            <Text style={pdfStyles.cardHeaderTitle}>
              4. Payment Enclosure & Booking Undertaking
            </Text>
            <Text style={pdfStyles.cardHeaderBadge}>Applicant Undertaking</Text>
          </View>
          <View style={pdfStyles.cardBody}>
            {BOOKING_FORM_CONTENT.declaration.map((item, index) => (
              <Text key={item} style={pdfStyles.declarationItem}>
                {index + 1}. {item}
              </Text>
            ))}
            <View style={pdfStyles.enclosureBox}>
              {filledEnclosure.map((line) => (
                <Text key={line} style={pdfStyles.enclosureLine}>
                  {line}
                </Text>
              ))}
            </View>
            <View style={[pdfStyles.signRow, { marginTop: 8, alignItems: "flex-end" }]}>
              <View style={{ flex: 1 }}>
                <Text style={pdfStyles.fieldValueBold}>
                  Applicant: {props.client.name}
                </Text>
                <Text style={pdfStyles.fieldLabel}>
                  {relationLabel}: {props.client.relationName ?? "—"} • Date:{" "}
                  {dateLabel(props.date)}
                </Text>
              </View>
              <View style={{ width: 180, alignItems: "flex-end" }}>
                <View
                  style={{
                    borderBottomWidth: 0.5,
                    borderBottomColor: INK,
                    width: 170,
                    marginBottom: 2,
                  }}
                />
                <Text style={pdfStyles.signLabel}>Signature of Applicant</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 5: For Office Use Only */}
        <View style={[pdfStyles.card, { marginBottom: 0 }]}>
          <View style={pdfStyles.cardHeader}>
            <Text style={pdfStyles.cardHeaderTitle}>
              5. For Office Use Only — Verification & Approvals
            </Text>
            <Text style={pdfStyles.cardHeaderBadge}>Corporate Authorization</Text>
          </View>
          <View style={[pdfStyles.cardBody, { paddingVertical: 4 }]}>
            <View style={pdfStyles.officeRow}>
              <View style={pdfStyles.officeCol}>
                <Text style={pdfStyles.officeTitle}>Prepared By</Text>
                <View style={pdfStyles.officeLine} />
                <Text style={pdfStyles.officeLabel}>Designation: Accountant</Text>
              </View>
              <View style={pdfStyles.officeCol}>
                <Text style={pdfStyles.officeTitle}>Reviewed By</Text>
                <View style={pdfStyles.officeLine} />
                <Text style={pdfStyles.officeLabel}>
                  Designation: Director Operations
                </Text>
              </View>
              <View style={pdfStyles.officeCol}>
                <Text style={pdfStyles.officeTitle}>Approved By</Text>
                <View style={pdfStyles.officeLine} />
                <Text style={pdfStyles.officeLabel}>Designation: CEO</Text>
              </View>
            </View>
          </View>
        </View>

        <PageFooter
          applicationFormNo={props.applicationFormNo}
          unitCode={props.unit.unitCode}
          printDate={props.printDate}
        />
      </Page>

      {/* PAGE 2: PAYMENT PLAN & INSTALLMENT SCHEDULE (If booking with installments) */}
      {isBooking && hasInstallments ? (
        <Page size="A4" style={pdfStyles.page}>
          <View style={pdfStyles.headerRow}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-start" }}>
              <Image src={SARDARS_MALL_MARK_DATA_URL} style={pdfStyles.brandLogo} />
              <View>
                <Text style={pdfStyles.company}>SARDAR'S MALL</Text>
                <Text style={pdfStyles.subtitle}>{COMPANY_LEGAL_NAME}</Text>
                <Text style={pdfStyles.title}>PAYMENT PLAN & INSTALLMENT SCHEDULE</Text>
              </View>
            </View>
            <View style={pdfStyles.metaBlock}>
              <Text style={pdfStyles.metaLabel}>Application Form No</Text>
              <Text style={pdfStyles.metaValue}>{props.applicationFormNo}</Text>
              <Text style={pdfStyles.metaLabel}>Unit Unique No</Text>
              <Text style={pdfStyles.metaValue}>{props.unit.unitCode}</Text>
              <Text style={pdfStyles.metaLabel}>Client Name</Text>
              <Text style={pdfStyles.metaValue}>{props.client.name}</Text>
            </View>
          </View>

          {/* KPI Overview Tiles */}
          <View style={pdfStyles.kpiGrid}>
            <View style={pdfStyles.kpiCard}>
              <Text style={pdfStyles.kpiLabel}>Total Unit Price</Text>
              <Text style={pdfStyles.kpiValue}>{formatPkr(props.payment.netPrice)}</Text>
            </View>
            <View style={pdfStyles.kpiCard}>
              <Text style={pdfStyles.kpiLabel}>Down Payment</Text>
              <Text style={pdfStyles.kpiValue}>
                {props.payment.downPayment ? formatPkr(props.payment.downPayment) : "—"}
              </Text>
            </View>
            <View style={pdfStyles.kpiCard}>
              <Text style={pdfStyles.kpiLabel}>Annual Balloons</Text>
              <Text style={pdfStyles.kpiValue}>
                {props.payment.balloonTotalAmount &&
                Number(props.payment.balloonTotalAmount) > 0
                  ? formatPkr(props.payment.balloonTotalAmount)
                  : "None"}
              </Text>
            </View>
            <View style={pdfStyles.kpiCard}>
              <Text style={pdfStyles.kpiLabel}>On Possession</Text>
              <Text style={pdfStyles.kpiValue}>
                {props.payment.possessionAmount &&
                Number(props.payment.possessionAmount) > 0
                  ? formatPkr(props.payment.possessionAmount)
                  : "None"}
              </Text>
            </View>
            <View style={pdfStyles.kpiCard}>
              <Text style={pdfStyles.kpiLabel}>Balance Due</Text>
              <Text style={pdfStyles.kpiValue}>{formatPkr(balanceNum.toFixed(2))}</Text>
            </View>
            <View style={pdfStyles.kpiCard}>
              <Text style={pdfStyles.kpiLabel}>Plan Structure</Text>
              <Text style={[pdfStyles.kpiValue, { fontSize: 8.5 }]}>
                {props.payment.installmentCount
                  ? `${props.payment.installmentCount} ${props.payment.plan?.toLowerCase() ?? "installments"}`
                  : (props.payment.plan ?? "Standard Plan")}
              </Text>
            </View>
            {props.payment.surchargeAmount &&
            Number(props.payment.surchargeAmount) > 0 ? (
              <View style={pdfStyles.kpiCard}>
                <Text style={pdfStyles.kpiLabel}>Overdue Surcharge</Text>
                <Text style={[pdfStyles.kpiValue, { color: "#991B1B" }]}>
                  {formatPkr(props.payment.surchargeAmount)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Installments Table */}
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.th, { width: "10%", textAlign: "center" }]}>#</Text>
              <Text style={[pdfStyles.th, { width: "26%" }]}>Milestone / Due Date</Text>
              <Text style={[pdfStyles.th, { width: "24%" }]}>Schedule Type</Text>
              <Text style={[pdfStyles.th, { width: "24%", textAlign: "right" }]}>
                Amount (PKR)
              </Text>
              <Text style={[pdfStyles.th, { width: "16%", textAlign: "center" }]}>
                Status
              </Text>
            </View>
            {props.installments!.map((inst, index) => {
              const isEven = index % 2 === 1;
              const isPaid = inst.status?.toUpperCase() === "PAID";
              return (
                <View
                  key={inst.seq}
                  style={[
                    pdfStyles.tableRow,
                    isEven
                      ? { backgroundColor: BG_LIGHT }
                      : { backgroundColor: BG_WHITE },
                  ]}
                >
                  <Text
                    style={[
                      pdfStyles.td,
                      { width: "10%", textAlign: "center", fontWeight: 700 },
                    ]}
                  >
                    {inst.seq}
                  </Text>
                  <Text style={[pdfStyles.td, { width: "26%" }]}>
                    {dateLabel(inst.dueDate)}
                  </Text>
                  <Text style={[pdfStyles.td, { width: "24%", color: MUTED }]}>
                    {inst.label ||
                      (inst.type === "BALLOON"
                        ? `Balloon Payment #${inst.seq}`
                        : inst.type === "POSSESSION"
                          ? "Possession Payment"
                          : `Installment ${String(inst.seq).padStart(2, "0")}`)}
                  </Text>
                  <Text
                    style={[
                      pdfStyles.td,
                      { width: "24%", textAlign: "right", fontWeight: 700, color: INK },
                    ]}
                  >
                    {formatPkr(inst.amount)}
                  </Text>
                  <View style={{ width: "16%", alignItems: "center" }}>
                    <Text style={isPaid ? pdfStyles.statusPaid : pdfStyles.statusPending}>
                      {inst.status}
                    </Text>
                  </View>
                </View>
              );
            })}
            <View style={pdfStyles.tableFooterRow}>
              <Text
                style={[
                  pdfStyles.td,
                  {
                    width: "60%",
                    fontWeight: 700,
                    color: BRAND,
                    textTransform: "uppercase",
                  },
                ]}
              >
                Total Scheduled Installments Commitment
              </Text>
              <Text
                style={[
                  pdfStyles.td,
                  { width: "24%", textAlign: "right", fontWeight: 700, color: BRAND },
                ]}
              >
                {formatPkr((totalScheduledInstallments || balanceNum).toFixed(2))}
              </Text>
              <Text
                style={[
                  pdfStyles.td,
                  { width: "16%", textAlign: "center", color: MUTED },
                ]}
              >
                {props.installments!.length} Milestones
              </Text>
            </View>
          </View>

          {/* Official Payment Instructions */}
          <View style={pdfStyles.instructionBox}>
            <Text style={pdfStyles.instructionTitle}>
              Payment Instructions & Banking Channels
            </Text>
            <Text style={pdfStyles.instructionText}>
              • Beneficiary Name:{" "}
              <Text style={{ fontWeight: 700 }}>{COMPANY_LEGAL_NAME}</Text> | Bank: Habib
              Bank Limited (HBL) / Meezan Bank.
            </Text>
            <Text style={pdfStyles.instructionText}>
              • All installment payments must be deposited on or before the due date via
              Crossed Cheque, Demand Draft, or Pay Order.
            </Text>
            <Text style={pdfStyles.instructionText}>
              • Please write the Unit Unique No ({props.unit.unitCode}) and Application
              Form No ({props.applicationFormNo}) on the reverse of all payment
              instruments.
            </Text>
            <Text style={pdfStyles.instructionText}>
              • Cash payments are acknowledged only against an official computerized
              system receipt issued by Sardar's Mall accounts office.
            </Text>
          </View>

          {/* Schedule Acknowledgment & Signatures */}
          <View style={[pdfStyles.card, { marginBottom: 0, padding: 6 }]}>
            <Text style={[pdfStyles.declarationItem, { marginBottom: 6 }]}>
              I hereby acknowledge and agree to adhere strictly to the installment
              milestone schedule outlined above and ensure timely payments as stipulated.
            </Text>
            <View style={[pdfStyles.signRow, { marginTop: 10 }]}>
              <View style={{ width: 190 }}>
                <View
                  style={{
                    borderBottomWidth: 0.5,
                    borderBottomColor: INK,
                    width: 180,
                    marginBottom: 3,
                  }}
                />
                <Text style={pdfStyles.signLabel}>
                  Client Signature: {props.client.name}
                </Text>
                <Text style={pdfStyles.signSub}>CNIC: {props.client.cnic}</Text>
              </View>
              <View style={{ width: 190, alignItems: "flex-end" }}>
                <View
                  style={{
                    borderBottomWidth: 0.5,
                    borderBottomColor: INK,
                    width: 180,
                    marginBottom: 3,
                  }}
                />
                <Text style={pdfStyles.signLabel}>Authorized Officer / Director</Text>
                <Text style={pdfStyles.signSub}>{COMPANY_LEGAL_NAME}</Text>
              </View>
            </View>
          </View>

          <PageFooter
            applicationFormNo={props.applicationFormNo}
            unitCode={props.unit.unitCode}
            printDate={props.printDate}
          />
        </Page>
      ) : null}

      {/* PAGE 3: TERMS AND CONDITIONS & LEGAL UNDERTAKING */}
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerRow}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-start" }}>
            <Image src={SARDARS_MALL_MARK_DATA_URL} style={pdfStyles.brandLogo} />
            <View>
              <Text style={pdfStyles.company}>SARDAR'S MALL</Text>
              <Text style={pdfStyles.subtitle}>{COMPANY_LEGAL_NAME}</Text>
              <Text style={pdfStyles.title}>
                TERMS AND CONDITIONS & GOVERNING COVENANTS
              </Text>
            </View>
          </View>
          <View style={pdfStyles.metaBlock}>
            <Text style={pdfStyles.metaLabel}>Application Form No</Text>
            <Text style={pdfStyles.metaValue}>{props.applicationFormNo}</Text>
            <Text style={pdfStyles.metaLabel}>Unit Unique No</Text>
            <Text style={pdfStyles.metaValue}>{props.unit.unitCode}</Text>
          </View>
        </View>

        {/* 16 Legal Terms in a 2-Column Balanced Grid */}
        <View style={pdfStyles.termsContainer}>
          <View style={pdfStyles.termsCol}>
            {BOOKING_FORM_CONTENT.terms.slice(0, 8).map((term, index) => (
              <View key={term} style={pdfStyles.termRow}>
                <Text style={pdfStyles.termIndex}>
                  {String(index + 1).padStart(2, "0")}.
                </Text>
                <Text style={pdfStyles.termText}>{term}</Text>
              </View>
            ))}
          </View>
          <View style={pdfStyles.termsCol}>
            {BOOKING_FORM_CONTENT.terms.slice(8, 16).map((term, index) => (
              <View key={term} style={pdfStyles.termRow}>
                <Text style={pdfStyles.termIndex}>
                  {String(index + 9).padStart(2, "0")}.
                </Text>
                <Text style={pdfStyles.termText}>{term}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Highlighted Ownership Note */}
        <View style={pdfStyles.noteBox}>
          <Text style={pdfStyles.noteText}>
            SPECIAL NOTICE: {BOOKING_FORM_CONTENT.note}
          </Text>
        </View>

        {/* Final Legal Undertaking */}
        <View style={pdfStyles.declarationBox}>
          <Text style={pdfStyles.declarationTitle}>
            {BOOKING_FORM_CONTENT.declarationTitle}
          </Text>
          <Text style={pdfStyles.declarationItem}>
            {BOOKING_FORM_CONTENT.finalDeclaration}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <Text style={pdfStyles.fieldValue}>Date: {dateLabel(props.date)}</Text>
            <Text style={pdfStyles.fieldValueBold}>
              Applicant CNIC #: {props.client.cnic}
            </Text>
          </View>
        </View>

        {/* Formal Execution & Biometric Block */}
        <View style={pdfStyles.signaturesCard}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Box 1: Applicant Signature */}
            <View style={{ width: 140 }}>
              <View
                style={{
                  borderBottomWidth: 0.5,
                  borderBottomColor: INK,
                  width: 135,
                  marginBottom: 4,
                }}
              />
              <Text style={pdfStyles.signLabel}>Signature of Applicant</Text>
              <Text style={pdfStyles.signSub}>{props.client.name}</Text>
            </View>

            {/* Box 2: Biometric Thumb Impression */}
            <View style={{ alignItems: "center" }}>
              <View style={pdfStyles.thumbBox}>
                <Text style={pdfStyles.thumbText}>
                  LEFT / RIGHT{"\n"}THUMB IMPRESSION
                </Text>
              </View>
              <Text style={[pdfStyles.signSub, { marginTop: 2 }]}>
                Applicant Thumb Impression
              </Text>
            </View>

            {/* Box 3: Authorized Signatory */}
            <View style={{ width: 140, alignItems: "flex-end" }}>
              <View
                style={{
                  borderBottomWidth: 0.5,
                  borderBottomColor: INK,
                  width: 135,
                  marginBottom: 4,
                }}
              />
              <Text style={pdfStyles.signLabel}>Authorized Signatory / CEO</Text>
              <Text style={pdfStyles.signSub}>{COMPANY_LEGAL_NAME}</Text>
            </View>
          </View>
        </View>

        <PageFooter
          applicationFormNo={props.applicationFormNo}
          unitCode={props.unit.unitCode}
          printDate={props.printDate}
        />
      </Page>

      {/* PAGE 4: DOCUMENT APPENDIX (When includeAppendix is true) */}
      {props.appendix.include ? (
        <Page size="A4" style={pdfStyles.page}>
          <View style={pdfStyles.headerRow}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-start" }}>
              <Image src={SARDARS_MALL_MARK_DATA_URL} style={pdfStyles.brandLogo} />
              <View>
                <Text style={pdfStyles.company}>SARDAR'S MALL</Text>
                <Text style={pdfStyles.subtitle}>{COMPANY_LEGAL_NAME}</Text>
                <Text style={pdfStyles.title}>
                  DOCUMENT APPENDIX — VERIFIED IDENTIFICATION
                </Text>
              </View>
            </View>
            <View style={pdfStyles.metaBlock}>
              <Text style={pdfStyles.metaLabel}>Application Form No</Text>
              <Text style={pdfStyles.metaValue}>{props.applicationFormNo}</Text>
              <Text style={pdfStyles.metaLabel}>Client Name</Text>
              <Text style={pdfStyles.metaValue}>{props.client.name}</Text>
            </View>
          </View>

          {/* 2x2 Clean ID Card Grid */}
          <View style={pdfStyles.appendixGrid}>
            <AppendixItem
              title="Applicant CNIC — Front"
              image={props.appendix.clientFront}
            />
            <AppendixItem
              title="Applicant CNIC — Back"
              image={props.appendix.clientBack}
            />
            <AppendixItem title="Nominee CNIC — Front" image={props.appendix.kinFront} />
            <AppendixItem title="Nominee CNIC — Back" image={props.appendix.kinBack} />
          </View>

          {/* ERP Archive & Verification Notice */}
          <View style={pdfStyles.instructionBox}>
            <Text style={pdfStyles.instructionTitle}>
              Official Verification & Compliance Archival
            </Text>
            <Text style={pdfStyles.instructionText}>
              • The identification credentials displayed above were uploaded and
              electronically verified for Application No. {props.applicationFormNo}{" "}
              pertaining to Unit {props.unit.unitCode}.
            </Text>
            <Text style={pdfStyles.instructionText}>
              • These documents form an irrevocable annexure to the सरदार / Sardar's Mall
              Booking Agreement and are securely archived in ASSH Developers ERP
              compliance registry.
            </Text>
          </View>

          <PageFooter
            applicationFormNo={props.applicationFormNo}
            unitCode={props.unit.unitCode}
            printDate={props.printDate}
          />
        </Page>
      ) : null}
    </Document>
  );
}
