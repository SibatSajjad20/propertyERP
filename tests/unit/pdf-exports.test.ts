import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { InstallmentSchedulePdf } from "@/features/installments/pdf/installment-schedule-document";
import { ClientLedgerPdf } from "@/features/reports/pdf/client-ledger-document";
import { ReportPdfDocument } from "@/features/reports/pdf/report-document";

describe("New PDF Document Renderers", () => {
  it("renders InstallmentSchedulePdf buffer without errors", async () => {
    const buf = await renderToBuffer(
      InstallmentSchedulePdf({
        bookingNo: "SM-BK-2026-0001",
        applicationFormNo: "SM-APP-001",
        bookingDate: new Date("2026-11-20T00:00:00Z"),
        plan: "4_YEAR_QUARTERLY",
        client: {
          title: "Mr",
          fullName: "Rahim Baz Khan",
          cnic: "11101-7634417-1",
          phone: "+92 336 1050888",
          address: "Sector F-10, Islamabad",
        },
        unit: {
          unitCode: "4F-08",
          floorName: "4th Floor",
          categoryName: "Office",
          grossAreaSqft: "500.00",
        },
        financials: {
          listPrice: "5000000.00",
          discountValue: "0.00",
          netPrice: "5000000.00",
          downPayment: "1250000.00",
          paidTotal: "1250000.00",
          balance: "3750000.00",
        },
        installments: [
          {
            seq: 1,
            label: "Installment #1",
            type: "REGULAR",
            dueDate: new Date("2026-12-05T00:00:00Z"),
            amount: "4101700.00",
            paidAmount: "0.00",
            status: "PENDING",
            receiptNo: null,
          },
        ],
        payments: [
          {
            receiptNo: "SM-REC-2026-0001",
            paidAt: new Date("2026-11-20T00:00:00Z"),
            method: "BANK_TRANSFER",
            amount: "1250000.00",
            surchargeAmount: "0.00",
          },
        ],
      }),
    );
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.byteLength).toBeGreaterThan(1000);
    expect(buf.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("renders ClientLedgerPdf buffer without errors", async () => {
    const buf = await renderToBuffer(
      ClientLedgerPdf({
        data: {
          client: {
            id: "client-1",
            fullName: "Rahim Baz Khan",
            cnic: "11101-7634417-1",
            phone: "+92 336 1050888",
            email: "rahim@example.com",
            homeAddress: "House 123, Islamabad",
            postalAddress: "House 123, Islamabad",
          },
          nextOfKin: {
            name: "Baz Khan",
            relation: "Father",
            phone: "+92 300 1234567",
            cnic: "11101-1234567-1",
            address: "House 123, Islamabad",
          },
          units: [
            {
              unitId: "unit-1",
              unitCode: "4F-08",
              floorName: "4th Floor",
              amountPkr: "5000000.00",
              relationType: "BOOKED",
              date: new Date("2026-11-20T00:00:00Z"),
            },
          ],
          statement: {
            period: {
              startDate: "2026-11-01",
              endDate: "2026-11-30",
            },
            openingBalancePkr: "0.00",
            totalDebitsPkr: "5000000.00",
            totalCreditsPkr: "1250000.00",
            closingBalancePkr: "3750000.00",
            entries: [
              {
                date: new Date("2026-11-20T00:00:00Z"),
                description: "Booking 4F-08 Contract",
                receiptNo: null,
                debitPkr: "5000000.00",
                creditPkr: "0.00",
                runningBalancePkr: "5000000.00",
              },
              {
                date: new Date("2026-11-20T00:00:00Z"),
                description: "Down payment receipt",
                receiptNo: "SM-REC-2026-0001",
                debitPkr: "0.00",
                creditPkr: "1250000.00",
                runningBalancePkr: "3750000.00",
              },
            ],
          },
        },
      }),
    );
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.byteLength).toBeGreaterThan(1000);
    expect(buf.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("renders ReportPdfDocument buffer without errors", async () => {
    const buf = await renderToBuffer(
      ReportPdfDocument({
        title: "COLLECTIONS REPORT",
        subtitle: "Monthly Collections Overview",
        filterDesc: "Period: This Month",
        stats: [{ label: "Total Collected", value: "Rs 14,00,000" }],
        columns: [
          { key: "receiptNo", label: "Receipt #", width: "20%", align: "center" },
          { key: "customer", label: "Customer", width: "40%", align: "left" },
          {
            key: "amount",
            label: "Amount (PKR)",
            width: "40%",
            align: "right",
            isMoney: true,
          },
        ],
        rows: [
          {
            receiptNo: "SM-REC-2026-0001",
            customer: "Rahim Baz Khan",
            amount: "1400000.00",
          },
        ],
        totals: {
          amount: "Rs 14,00,000",
        },
      }),
    );
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.byteLength).toBeGreaterThan(1000);
    expect(buf.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("renders ClientLedgerPdf in print mode with signature blocks", async () => {
    const buf = await renderToBuffer(
      ClientLedgerPdf({
        mode: "print",
        data: {
          client: {
            id: "client-1",
            fullName: "Rahim Baz Khan",
            cnic: "11101-7634417-1",
            phone: "+92 336 1050888",
            email: "rahim@example.com",
            homeAddress: "House 123, Islamabad",
            postalAddress: "House 123, Islamabad",
          },
          nextOfKin: {
            name: "Baz Khan",
            relation: "Father",
            phone: "+92 300 1234567",
            cnic: "11101-1234567-1",
            address: "House 123, Islamabad",
          },
          units: [
            {
              unitId: "unit-1",
              unitCode: "4F-08",
              floorName: "4th Floor",
              amountPkr: "5000000.00",
              relationType: "BOOKED",
              date: new Date("2026-11-20T00:00:00Z"),
            },
          ],
          statement: {
            period: {
              startDate: "2026-11-01",
              endDate: "2026-11-30",
            },
            openingBalancePkr: "0.00",
            totalDebitsPkr: "5000000.00",
            totalCreditsPkr: "1250000.00",
            closingBalancePkr: "3750000.00",
            entries: [],
          },
        },
      }),
    );
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.byteLength).toBeGreaterThan(1000);
    expect(buf.subarray(0, 4).toString()).toBe("%PDF");
  });
});
