import { describe, expect, it } from "vitest";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { PaymentReceiptPdf } from "@/features/installments/pdf/payment-receipt-document";

describe("PaymentReceiptPdf", () => {
  it("renders without error and outputs valid PDF buffer", async () => {
    const sampleData = {
      receiptNo: "SM-REC-2026-0002",
      paidAt: "2026-11-21",
      amountPkr: "1395000",
      method: "BANK_TRANSFER",
      chequeNo: "Ref#7472874547",
      bank: "United Bank Limited",
      notes: "Down payment on booking",
      allocationLabel: "Down Payment",
      client: {
        fullName: "Rahim Baz Khan",
        cnic: "11101-7634417-1",
        phone: "03361050888",
        relationPrefix: "S/O",
        relationName: "Tila Baz Khan",
        homeAddress: "Pak Ismail Khel Surrani Bannu",
      },
      booking: {
        bookingNo: "SM-BK-2026-0002",
        applicationFormNo: "SM-4F-O8-26-002",
        netPrice: "5580000",
        downPayment: "1395000",
        paidTotal: "1395000",
      },
      unit: {
        unitCode: "4F-O8",
        floorName: "4th",
        categoryName: "Office",
      },
      receivedByName: "Administrator",
      company: {
        name: "Sardar's Mall",
        address: "54-C Iran Road, Block C, near Chandni Chowk, Rawalpindi",
      },
    };

    const buf = await renderToBuffer(<PaymentReceiptPdf data={sampleData} />);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(1000);
  });
});
