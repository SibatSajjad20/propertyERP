import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { SalePurchaseAgreementPdf } from "@/features/agreements/pdf/agreement-document";
import { AGREEMENT_CLAUSES, AGREEMENT_DEFINITIONS } from "@/features/agreements/template";

describe("Sale & Purchase Agreement Template & PDF", () => {
  it("contains all 22 clauses and complete definitions table", () => {
    expect(AGREEMENT_CLAUSES).toHaveLength(22);
    expect(AGREEMENT_CLAUSES[0]?.title).toBe("THE PROJECT");
    expect(AGREEMENT_CLAUSES[21]?.title).toBe("SEVERABILITY");
    expect(AGREEMENT_DEFINITIONS.length).toBeGreaterThanOrEqual(20);

    const clause1_2 = AGREEMENT_CLAUSES[0]?.paragraphs[1];
    expect(clause1_2).toBeDefined();
    expect(clause1_2).toContain("• **Residential Apartments (Un Furnished):**");
    expect(clause1_2).toContain("• **Commercial Units/Shops:**");
    expect(clause1_2).toContain("• **Offices (Unfurnished):**");
    expect(clause1_2).not.toContain("Furnished/Semi Furnished");

    const parkingDef = AGREEMENT_DEFINITIONS.find((d) => d.term === "Parking Area");
    expect(parkingDef).toBeDefined();
    expect(parkingDef?.definition).toContain(
      "Dedicated Parking Slots Duly Paid and Purchased by Buyer/Vendee",
    );
    expect(parkingDef?.definition).toContain(
      "Common Parking Area in-front of Sardars Mall Building",
    );
  });

  it("renders a valid multi-page PDF buffer with Apartment No. format and 40-row Schedule-B", async () => {
    const scheduleRows = [
      ...Array.from({ length: 36 }, (_, i) => ({
        seq: i + 1,
        label: `Installment #${i + 1}`,
        type: "REGULAR",
        dueDate: new Date(2026, 2 + i, 18),
        amountPkr: "129800.00",
        status: "PENDING",
      })),
      {
        seq: 37,
        label: "Year 1 Balloon Payment",
        type: "BALLOON",
        dueDate: new Date("2027-02-18T00:00:00Z"),
        amountPkr: "1557600.00",
        status: "PENDING",
      },
      {
        seq: 38,
        label: "Year 2 Balloon Payment",
        type: "BALLOON",
        dueDate: new Date("2028-02-18T00:00:00Z"),
        amountPkr: "1557600.00",
        status: "PENDING",
      },
      {
        seq: 39,
        label: "Year 3 Balloon Payment",
        type: "BALLOON",
        dueDate: new Date("2029-02-18T00:00:00Z"),
        amountPkr: "1557600.00",
        status: "PENDING",
      },
      {
        seq: 40,
        label: "Possession Payment",
        type: "POSSESSION",
        dueDate: new Date("2029-02-18T00:00:00Z"),
        amountPkr: "2336400.00",
        status: "PENDING",
      },
    ];

    const buf = await renderToBuffer(
      SalePurchaseAgreementPdf({
        agreementNo: "SM-AGR-2026-0001",
        agreementDate: new Date("2026-02-18T00:00:00Z"),
        sellerName: "Mr. Afnan Khan",
        anticipatedCompletionDate: "Feb-2029",
        buyer: {
          fullName: "Noreen Feroz",
          relationPrefix: "W/O",
          relationName: "Ghafoor Mahmood Iqbal",
          cnic: "37401-7028130-6",
          nationality: "Pakistani",
          address: "NA160 New Mul Pur Satellite Town, Rawalpindi Pakistan",
          phone: "+33650846069",
          email: "mahmoodghafoor11@msn.com",
        },
        nominee: {
          name: "Ghafoor Mahmood Iqbal",
          cnic: "37401-3033021-9",
          nationality: "Pakistani",
          address: "NA160 New Mul Pur Satellite Town, Rawalpindi Pakistan",
        },
        unit: {
          unitCode: "10F-RA1",
          categoryName: "1-BED",
          floorName: "10th Floor",
          grossAreaSqft: "649.00",
        },
        financials: {
          totalPricePkr: "15576000.00",
          bookingAmountPkr: "3894000.00",
          possessionAmountPkr: "2336400.00",
          balloonTotalAmountPkr: "4672800.00",
        },
        witness1Name: "Witness One",
        witness2Name: "Witness Two",
        scheduleRows,
      }),
    );

    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.byteLength).toBeGreaterThan(20000);
    expect(buf.subarray(0, 4).toString()).toBe("%PDF");
    const pageMatches = buf.toString("latin1").match(/\/Type\s*\/Page\b/g) || [];
    expect(pageMatches.length).toBeGreaterThanOrEqual(8);
  });

  it("renders PDF with paid installments and total paid amount", async () => {
    const buf = await renderToBuffer(
      SalePurchaseAgreementPdf({
        agreementNo: "SM-AGR-2026-0002",
        agreementDate: new Date("2026-02-18T00:00:00Z"),
        sellerName: "Mr. Afnan Khan",
        anticipatedCompletionDate: "Feb-2029",
        buyer: {
          fullName: "Noreen Feroz",
          relationPrefix: "W/O",
          relationName: "Ghafoor Mahmood Iqbal",
          cnic: "37401-7028130-6",
          nationality: "Pakistani",
          address: "NA160 New Mul Pur Satellite Town, Rawalpindi Pakistan",
          phone: "+33650846069",
          email: "mahmoodghafoor11@msn.com",
        },
        nominee: null,
        unit: {
          unitCode: "10F-RA1",
          categoryName: "1-BED",
          floorName: "10th Floor",
          grossAreaSqft: "649.00",
        },
        financials: {
          totalPricePkr: "15576000.00",
          bookingAmountPkr: "3894000.00",
          downPaymentPaidAmountPkr: "3894000.00",
        },
        scheduleRows: [
          {
            seq: 1,
            label: "Installment #1",
            type: "REGULAR",
            dueDate: new Date(2026, 3, 18),
            amountPkr: "129800.00",
            paidAmountPkr: "129800.00",
            status: "PAID",
          },
          {
            seq: 2,
            label: "Installment #2",
            type: "REGULAR",
            dueDate: new Date(2026, 4, 18),
            amountPkr: "129800.00",
            status: "PENDING",
          },
        ],
      }),
    );

    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.subarray(0, 4).toString()).toBe("%PDF");
  });
});
