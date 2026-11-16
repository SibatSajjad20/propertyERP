import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { formatReceiptNo, padReceiptSerial } from "@/features/sales/document-numbers";
import { registerPdfFonts } from "@/features/documents/pdf/fonts";
import { DownPaymentReceiptPdf } from "@/features/documents/pdf/receipt-document";
import {
  DEFAULT_DOWN_PAYMENT_PERCENT,
  EXCESS_NOTE,
  RECEIPT_FOOTER_NOTE,
  computeDownPaymentPlan,
  computeReceiptTotals,
  percentOf,
  selectDownPaymentPayments,
  sumAmounts,
} from "@/features/documents/receipt-math";
import { COMPANY_LEGAL_NAME } from "@/features/documents/booking-form-content";
import { receiptPdfPlainText } from "@/features/documents/pdf/receipt-document";

describe("receipt number format", () => {
  it("formats SM-DPR-YY-0001", () => {
    expect(formatReceiptNo(new Date(2026, 0, 5), 1)).toBe("SM-DPR-26-0001");
    expect(padReceiptSerial(12)).toBe("0012");
    expect(padReceiptSerial(10000)).toBe("10000");
  });
});

describe("down payment math", () => {
  it("computes 25% required from price without floats", () => {
    expect(percentOf("7800000.00", "25.00")).toBe("1950000.00");
    expect(DEFAULT_DOWN_PAYMENT_PERCENT).toBe("25.00");
  });

  it("uses Full when the down payment covers the net price", () => {
    const plan = computeDownPaymentPlan({
      netPrice: "2000000.00",
      downPayment: "2000000.00",
      installmentCount: 0,
    });
    expect(plan.kind).toBe("FULL");
    expect(plan.percentLabel).toBe("Full");
    expect(plan.required).toBe("2000000.00");
  });

  it("uses the contracted down payment as required for a percent plan", () => {
    const plan = computeDownPaymentPlan({
      netPrice: "7800000.00",
      downPayment: "1950000.00",
      installmentCount: 12,
    });
    expect(plan.kind).toBe("PERCENT");
    expect(plan.percentLabel).toBe("25%");
    expect(plan.required).toBe("1950000.00");
  });

  it("lists token plus later parts until required is covered and computes excess", () => {
    const totals = computeReceiptTotals({
      netPrice: "7800000.00",
      downPayment: "1950000.00",
      installmentCount: 12,
      payments: [
        {
          amount: "500000.00",
          paidAt: "2026-01-01",
          method: "CASH",
          reference: "Token amount",
        },
        {
          amount: "1500000.00",
          paidAt: "2026-01-05",
          method: "CHEQUE",
          reference: "Booking amount",
          chequeNo: "CHQ-9",
        },
        {
          amount: "200000.00",
          paidAt: "2026-02-01",
          method: "BANK_TRANSFER",
          reference: "Installment 1",
        },
      ],
    });
    expect(totals.listed).toHaveLength(2);
    expect(totals.received).toBe("2000000.00");
    expect(totals.balance).toBe("50000.00");
    expect(totals.showExcessNote).toBe(true);
    expect(EXCESS_NOTE).toContain("upcoming installment");
  });

  it("shows a negative balance when received is still short", () => {
    const totals = computeReceiptTotals({
      netPrice: "2000000.00",
      downPayment: "500000.00",
      installmentCount: 6,
      payments: [{ amount: "200000.00", paidAt: "2026-01-01", method: "CASH" }],
    });
    expect(totals.received).toBe("200000.00");
    expect(totals.balance).toBe("-300000.00");
    expect(totals.stillDue).toBe("300000.00");
    expect(totals.showExcessNote).toBe(false);
  });

  it("skips voided payments", () => {
    const listed = selectDownPaymentPayments(
      [
        { amount: "100.00", paidAt: "2026-01-01", isVoided: true },
        { amount: "100.00", paidAt: "2026-01-02", isVoided: false },
      ],
      "100.00",
    );
    expect(listed).toHaveLength(1);
    expect(sumAmounts(listed.map((p) => p.amount))).toBe("100.00");
  });
});

describe("down payment receipt PDF text", () => {
  it("includes receipt no, payment rows, total, signatory, and footer note", async () => {
    const props = {
      receiptNo: "SM-DPR-26-0001",
      printDate: "05 Jan 2026, 10:00",
      serialNo: 1,
      applicationFormNo: "SM-GF-S1-26-001",
      registrationNo: "ASSH-GF-S1-26-SM001",
      unitCode: "GF-S1",
      floorName: "Ground",
      unitType: "Shop",
      netAreaSqft: "312.50",
      ratePerSqftPkr: "25000.00",
      totalPrice: "7800000.00",
      installmentType: "Monthly",
      perInstallment: "487500.00",
      bookingNo: "SM-BK-2026-0001",
      bookingDate: "05 Jan 2026",
      bookingOffice: "SARDAR'S MALL",
      salesAgent: "Ali",
      clientName: "Muhammad Tariq",
      relationPrefix: "S/O",
      relationName: "Ahmed Khan",
      clientCnic: "35201-1234567-1",
      clientEmail: "tariq@example.com",
      clientPhone: "03001234567",
      clientAddress: "House 42",
      bankName: "HBL",
      accountTitle: "ASSH Developers (Pvt) Ltd",
      iban: "PK12HABB000000",
      downPaymentLabel: "25%",
      downPaymentRequired: "1950000.00",
      totalReceived: "2000000.00",
      balance: "50000.00",
      payments: [
        {
          amount: "500000.00",
          paidAt: new Date(2026, 0, 1),
          method: "CASH",
          reference: "Token amount",
        },
        {
          amount: "1500000.00",
          paidAt: new Date(2026, 0, 5),
          method: "CHEQUE",
          reference: "Booking amount",
          bank: "HBL DHA",
        },
      ],
      showExcessNote: true,
      signatoryName: "Afnan Khan",
      signatoryDesignation: "Chief Executive Officer",
    };
    const text = receiptPdfPlainText(props);
    expect(text).toContain("SM-DPR-26-0001");
    expect(text).toContain("Token amount");
    expect(text).toContain("Booking amount");
    expect(text).toContain("Rs 5,00,000");
    expect(text).toContain("Rs 15,00,000");
    expect(text).toContain("Rs 20,00,000");
    expect(text).toContain("Afnan Khan");
    expect(text).toContain("Chief Executive Officer");
    expect(text).toContain(RECEIPT_FOOTER_NOTE);
    expect(text).toContain(EXCESS_NOTE);
    expect(text).toContain(COMPANY_LEGAL_NAME);
    registerPdfFonts();
    const buffer = await renderToBuffer(DownPaymentReceiptPdf(props));
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });
});
