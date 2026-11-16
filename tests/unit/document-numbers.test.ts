import { describe, expect, it } from "vitest";
import {
  formatDocumentNumbers,
  padSerial,
  splitUnitCode,
} from "@/features/sales/document-numbers";
import {
  clientSchema,
  createBookingSchema,
  requiredNextOfKinSchema,
} from "@/features/sales/schema";
import {
  missingClientDocTypes,
  missingKinDocTypes,
  requiredDocumentErrorMessage,
} from "@/features/documents/required";

describe("document number formatters", () => {
  it("splits GF-S1 into floorCode and unitShort", () => {
    expect(splitUnitCode("GF-S1")).toEqual({ floorCode: "GF", unitShort: "S1" });
  });

  it("formats SM-GF-S1-26-001 and ASSH-GF-S1-26-SM001", () => {
    const nums = formatDocumentNumbers("GF-S1", new Date(2026, 5, 1), 1);
    expect(nums.serialNo).toBe(1);
    expect(nums.applicationFormNo).toBe("SM-GF-S1-26-001");
    expect(nums.registrationNo).toBe("ASSH-GF-S1-26-SM001");
  });

  it("pads to 3 digits and grows past 999", () => {
    expect(padSerial(7)).toBe("007");
    expect(padSerial(12)).toBe("012");
    expect(padSerial(999)).toBe("999");
    expect(padSerial(1000)).toBe("1000");
    expect(
      formatDocumentNumbers("GF-S1", new Date(2026, 0, 1), 1000).applicationFormNo,
    ).toBe("SM-GF-S1-26-1000");
  });

  it("rolls year from the booking date", () => {
    const nums = formatDocumentNumbers("1F-A10", new Date(2027, 11, 31), 4);
    expect(nums.applicationFormNo).toBe("SM-1F-A10-27-004");
    expect(nums.registrationNo).toBe("ASSH-1F-A10-27-SM004");
  });
});

describe("booking form field validation", () => {
  it("rejects a client without relation fields", () => {
    const parsed = clientSchema.safeParse({
      fullName: "Test Client",
      cnic: "35201-1234567-1",
      phone: "03001234567",
      homeAddress: "House 1 Street 2",
      postalAddress: "House 1 Street 2",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects next of kin without relation prefix and name", () => {
    const parsed = requiredNextOfKinSchema.safeParse({
      name: "Ayesha",
      relation: "Spouse",
      cnic: "35201-1234567-2",
      phone: "03007654321",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects booking input without client photo, CNICs, kin photo, and relation fields", () => {
    const parsed = createBookingSchema.safeParse({
      unitId: "11111111-1111-1111-1111-111111111111",
      client: {
        fullName: "Test Client",
        cnic: "35201-1234567-1",
        phone: "03001234567",
        homeAddress: "House 1 Street 2",
        postalAddress: "House 1 Street 2",
      },
      nextOfKin: {
        name: "Ayesha",
        relation: "Spouse",
        cnic: "35201-1234567-2",
        phone: "03007654321",
      },
      downPaymentPkr: "100000",
      plan: "MONTHLY",
      installmentCount: 12,
      startDate: "2026-12-01",
    });
    expect(parsed.success).toBe(false);
  });

  it("requires kin photo in addition to CNIC scans", () => {
    const docs = [
      { ownerType: "CLIENT" as const, docType: "PHOTO" as const, replacedAt: null },
      { ownerType: "CLIENT" as const, docType: "CNIC_FRONT" as const, replacedAt: null },
      { ownerType: "CLIENT" as const, docType: "CNIC_BACK" as const, replacedAt: null },
      { ownerType: "KIN" as const, docType: "CNIC_FRONT" as const, replacedAt: null },
      { ownerType: "KIN" as const, docType: "CNIC_BACK" as const, replacedAt: null },
    ];
    expect(missingClientDocTypes(docs)).toEqual([]);
    expect(missingKinDocTypes(docs)).toEqual(["KIN_PHOTO"]);
    expect(requiredDocumentErrorMessage(docs)).toContain("Nominee Passport photo");
  });
});
