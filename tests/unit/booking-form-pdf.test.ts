import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  BOOKING_FORM_CONTENT,
  COMPANY_LEGAL_NAME,
} from "@/features/documents/booking-form-content";
import {
  FormalFormPdf,
  enclosureLines,
  legalPdfPlainText,
} from "@/features/documents/pdf/form-document";
import { registerPdfFonts } from "@/features/documents/pdf/fonts";

const sampleProps = {
  kind: "booking" as const,
  serialNo: 1,
  applicationFormNo: "SM-GF-S1-26-001",
  registrationNo: "ASSH-GF-S1-26-SM001",
  date: new Date(2026, 0, 5),
  generatedOn: "05 Jan 2026, 10:00",
  unit: {
    unitCode: "GF-S1",
    floorName: "Ground",
    categoryName: "Shop",
    netAreaSqft: "312.50",
    ratePerSqftPkr: "25000.00",
  },
  client: {
    name: "Muhammad Tariq",
    relationPrefix: "S/O",
    relationName: "Ahmed Khan",
    cnic: "35201-1234567-1",
    phone: "03001234567",
    address: "House 42, Model Town",
    postalAddress: "House 42, Model Town",
    residentialAddress: "House 42, Model Town",
    email: "tariq@example.com",
  },
  nextOfKin: {
    name: "Ayesha Tariq",
    relationPrefix: "D/O",
    relationName: "Muhammad Tariq",
    relation: "Daughter",
    cnic: "35201-1234567-2",
    phone: "03007654321",
    address: "House 42, Model Town",
  },
  photo: null,
  kinPhoto: null,
  payment: {
    netPrice: "2000000.00",
    downPayment: "400000.00",
    plan: "MONTHLY",
    installmentCount: 12,
  },
  enclosure: {
    amount: "Rs 400,000",
    mode: "Cash",
    reference: "DP-1",
    date: "05 Jan 2026",
    bank: "HBL",
  },
  appendix: { include: false },
};

describe("booking form PDF legal text", () => {
  it("includes all 16 terms, both declaration items, both numbers, and the legal name", () => {
    expect(BOOKING_FORM_CONTENT.terms).toHaveLength(16);
    const text = legalPdfPlainText({
      serialNo: sampleProps.serialNo,
      applicationFormNo: sampleProps.applicationFormNo,
      registrationNo: sampleProps.registrationNo,
      enclosure: sampleProps.enclosure,
    });
    for (const term of BOOKING_FORM_CONTENT.terms) {
      expect(text).toContain(term);
    }
    for (const item of BOOKING_FORM_CONTENT.declaration) {
      expect(text).toContain(item);
    }
    expect(text).toContain(sampleProps.applicationFormNo);
    expect(text).toContain(sampleProps.registrationNo);
    expect(text).toContain(COMPANY_LEGAL_NAME);
    expect(COMPANY_LEGAL_NAME).toBe("ASSH Developers (Pvt) Ltd");
  });

  it("renders a PDF buffer without throwing", async () => {
    registerPdfFonts();
    const buffer = await renderToBuffer(FormalFormPdf(sampleProps));
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it("avoids double 'Rs. Rs' in enclosure text when amount has Rs prefix", () => {
    const lines = enclosureLines(BOOKING_FORM_CONTENT.enclosure, {
      amount: "Rs 1,23,05,000",
      mode: "Cash",
      reference: "DP-01",
      date: "05 Nov 2026",
      bank: "HBL",
    });
    expect(lines[0]).not.toContain("Rs. Rs");
    expect(lines[0]).not.toContain("Rs.Rs");
    expect(lines[0]).toContain("Rs. 1,23,05,000");
  });

  it("renders a booking with 12 installments and appendix in exactly 4 pages", async () => {
    registerPdfFonts();
    const propsWithInstallments = {
      ...sampleProps,
      installments: Array.from({ length: 12 }, (_, i) => ({
        seq: i + 1,
        dueDate: new Date(2026, i, 5),
        amount: "4101700.00",
        status: "PENDING",
      })),
      appendix: { include: true },
    };
    const buffer = await renderToBuffer(FormalFormPdf(propsWithInstallments));
    const text = buffer.toString("latin1");
    const pageMatches = text.match(/\/Type\s*\/Page\b/g) || [];
    expect(pageMatches.length).toBe(4);
  });

  it("renders a booking with 12 installments without appendix in exactly 3 pages", async () => {
    registerPdfFonts();
    const propsWithInstallments = {
      ...sampleProps,
      installments: Array.from({ length: 12 }, (_, i) => ({
        seq: i + 1,
        dueDate: new Date(2026, i, 5),
        amount: "4101700.00",
        status: "PENDING",
      })),
      appendix: { include: false },
    };
    const buffer = await renderToBuffer(FormalFormPdf(propsWithInstallments));
    const text = buffer.toString("latin1");
    const pageMatches = text.match(/\/Type\s*\/Page\b/g) || [];
    expect(pageMatches.length).toBe(3);
  });

  it("renders a booking with 24 installments without appendix in exactly 3 pages", async () => {
    registerPdfFonts();
    const propsWithInstallments = {
      ...sampleProps,
      installments: Array.from({ length: 24 }, (_, i) => ({
        seq: i + 1,
        dueDate: new Date(2026, i % 12, 5),
        amount: "2050850.00",
        status: "PENDING",
      })),
      appendix: { include: false },
    };
    const buffer = await renderToBuffer(FormalFormPdf(propsWithInstallments));
    const text = buffer.toString("latin1");
    const pageMatches = text.match(/\/Type\s*\/Page\b/g) || [];
    expect(pageMatches.length).toBe(3);
  });

  it("renders a booking without next of kin without error", async () => {
    registerPdfFonts();
    const propsWithoutKin = {
      ...sampleProps,
      nextOfKin: null,
      installments: Array.from({ length: 12 }, (_, i) => ({
        seq: i + 1,
        dueDate: new Date(2026, i, 5),
        amount: "4101700.00",
        status: "PENDING",
      })),
      appendix: { include: false },
    };
    const buffer = await renderToBuffer(FormalFormPdf(propsWithoutKin));
    const text = buffer.toString("latin1");
    const pageMatches = text.match(/\/Type\s*\/Page\b/g) || [];
    expect(pageMatches.length).toBe(3);
  });

  it("renders a sale without installments and without appendix in exactly 2 pages", async () => {
    registerPdfFonts();
    const saleProps = {
      ...sampleProps,
      kind: "sale" as const,
      installments: undefined,
      appendix: { include: false },
    };
    const buffer = await renderToBuffer(FormalFormPdf(saleProps));
    const text = buffer.toString("latin1");
    const pageMatches = text.match(/\/Type\s*\/Page\b/g) || [];
    expect(pageMatches.length).toBe(2);
  });
});
