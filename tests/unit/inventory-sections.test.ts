import { describe, expect, it } from "vitest";
import {
  INVENTORY_SECTIONS,
  categoryMatchesSection,
  matchCategoryToSection,
} from "@/features/units/sections";
import { recalculateInstallmentAllocations } from "@/features/installments/calculator";
import { createMergeRequestSchema } from "@/features/units/merge-schema";

describe("Inventory Sections Mapping & Cascading Filters", () => {
  it("defines all 6 required inventory sections", () => {
    expect(INVENTORY_SECTIONS.map((s) => s.label)).toEqual([
      "Mall Shops",
      "Commercial Shops",
      "Food Court",
      "Kiosks",
      "Corporate Offices",
      "Residential Apartments",
    ]);
  });

  it("maps legacy and new categories cleanly to sections", () => {
    expect(matchCategoryToSection("Shop", 0)).toBe("commercial-shops");
    expect(matchCategoryToSection("Shop", 1)).toBe("mall-shops");
    expect(matchCategoryToSection("Mall Shops", 0)).toBe("mall-shops");
    expect(matchCategoryToSection("Commercial Shops", 2)).toBe("commercial-shops");
    expect(matchCategoryToSection("Food Outlets", 3)).toBe("food-court");
    expect(matchCategoryToSection("Kiosk", 3)).toBe("kiosks");
    expect(matchCategoryToSection("Office", 4)).toBe("corporate-offices");
    expect(matchCategoryToSection("1-BED", 10)).toBe("residential-apartments");
    expect(matchCategoryToSection("2-BED", 10)).toBe("residential-apartments");
    expect(categoryMatchesSection("1-BED", "residential-apartments")).toBe(true);
    expect(categoryMatchesSection("2-BED", "residential-apartments")).toBe(true);
    expect(
      categoryMatchesSection("Residential Apartments", "residential-apartments"),
    ).toBe(false);
    expect(categoryMatchesSection("Office", "residential-apartments")).toBe(false);
    expect(categoryMatchesSection("Food Outlets", "food-court")).toBe(true);
    expect(categoryMatchesSection("Cafetria", "food-court")).toBe(false);
    expect(categoryMatchesSection("Food Court", "food-court")).toBe(false);
    expect(categoryMatchesSection("Kiosk", "kiosks")).toBe(true);
    expect(categoryMatchesSection("Office", "corporate-offices")).toBe(true);
    expect(categoryMatchesSection("Meeting Room", "corporate-offices")).toBe(true);
    expect(categoryMatchesSection("Cafetria", "corporate-offices")).toBe(true);
  });
});

describe("Token-Adjusted & Surcharge-Aware Installment Allocation", () => {
  it("credits reservation token toward down payment and excludes surcharge portion from unit principal", () => {
    const result = recalculateInstallmentAllocations({
      booking: {
        id: "bk-1",
        netPrice: "1000000.00",
        downPayment: "250000.00",
        tokenAdjustedAmount: "50000.00",
      },
      installments: [
        {
          id: "i1",
          seq: 1,
          dueDate: new Date("2026-01-01T00:00:00Z"),
          amount: "250000.00",
        },
        {
          id: "i2",
          seq: 2,
          dueDate: new Date("2026-02-01T00:00:00Z"),
          amount: "500000.00",
        },
      ],
      payments: [
        {
          id: "p1",
          receiptNo: "SM-REC-1",
          category: "DOWN_PAYMENT",
          amount: "200000.00", // remaining down payment after Rs 50k token
          surchargeAmount: "0.00",
          isVoided: false,
          paidAt: new Date("2025-12-01T00:00:00Z"),
        },
        {
          id: "p2",
          receiptNo: "SM-REC-2",
          category: "INSTALLMENT",
          amount: "255000.00", // 250k principal + 5k surcharge
          surchargeAmount: "5000.00",
          isVoided: false,
          paidAt: new Date("2026-02-20T00:00:00Z"),
        },
      ],
    });

    // Total principal paid = 50k token + 200k down + 250k installment = 500k (surcharge 5k does NOT reduce principal!)
    expect(result.paidTotalPkr).toBe("500000.00");
    expect(result.installments[0]?.status).toBe("PAID");
    expect(result.installments[0]?.paidAmount).toBe("250000.00");
    expect(result.installments[1]?.paidAmount).toBe("0.00");
    expect(result.isCompleted).toBe(false);
  });
});

describe("Unit Merge Request Schema Validation", () => {
  const basePayload = {
    sourceUnitIds: [
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ],
    proposedUnitCode: "GF-S1-S2",
    proposedUnitNumber: "SHOP-1 + SHOP-2",
    targetFloorId: "33333333-3333-4333-8333-333333333333",
    targetCategoryId: "44444444-4444-4444-8444-444444444444",
    proposedNetAreaSqft: "600.00",
    proposedGrossAreaSqft: "720.00",
    proposedRatePerSqftPkr: "100000.00",
    reason: "Client showroom merger per layout revision 2",
    proofStoragePath: "merge-proofs/abc.pdf",
    proofMimeType: "application/pdf",
  };

  it("accepts 2 or 3 unique units and rejects 1 or 4 units", () => {
    expect(createMergeRequestSchema.safeParse(basePayload).success).toBe(true);
    expect(
      createMergeRequestSchema.safeParse({
        ...basePayload,
        sourceUnitIds: [
          ...basePayload.sourceUnitIds,
          "55555555-5555-4555-8555-555555555555",
        ],
      }).success,
    ).toBe(true);
    expect(
      createMergeRequestSchema.safeParse({
        ...basePayload,
        sourceUnitIds: [basePayload.sourceUnitIds[0]],
      }).success,
    ).toBe(false);
    expect(
      createMergeRequestSchema.safeParse({
        ...basePayload,
        sourceUnitIds: [
          "11111111-1111-4111-8111-111111111111",
          "22222222-2222-4222-8222-222222222222",
          "55555555-5555-4555-8555-555555555555",
          "66666666-6666-4666-8666-666666666666",
        ],
      }).success,
    ).toBe(false);
  });
});
