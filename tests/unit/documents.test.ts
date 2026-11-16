import { describe, expect, it } from "vitest";
import {
  missingClientDocTypes,
  missingKinDocTypes,
  requiredDocumentErrorMessage,
} from "@/features/documents/required";
import { createBookingSchema, requiredNextOfKinSchema } from "@/features/sales/schema";

describe("required client documents", () => {
  it("lists missing client and kin document types", () => {
    expect(missingClientDocTypes([])).toEqual(["PHOTO", "CNIC_FRONT", "CNIC_BACK"]);
    expect(missingKinDocTypes([])).toEqual(["KIN_PHOTO", "CNIC_FRONT", "CNIC_BACK"]);
    const present = [
      { ownerType: "CLIENT" as const, docType: "PHOTO" as const, replacedAt: null },
      { ownerType: "CLIENT" as const, docType: "CNIC_FRONT" as const, replacedAt: null },
      { ownerType: "CLIENT" as const, docType: "CNIC_BACK" as const, replacedAt: null },
      { ownerType: "KIN" as const, docType: "KIN_PHOTO" as const, replacedAt: null },
      { ownerType: "KIN" as const, docType: "CNIC_FRONT" as const, replacedAt: null },
      { ownerType: "KIN" as const, docType: "CNIC_BACK" as const, replacedAt: null },
    ];
    expect(missingClientDocTypes(present)).toEqual([]);
    expect(missingKinDocTypes(present)).toEqual([]);
    expect(requiredDocumentErrorMessage(present)).toBeNull();
  });

  it("ignores replaced versions", () => {
    const docs = [
      { ownerType: "CLIENT" as const, docType: "PHOTO" as const, replacedAt: new Date() },
    ];
    expect(missingClientDocTypes(docs)).toContain("PHOTO");
  });

  it("rejects booking creation input without next of kin", () => {
    const parsed = createBookingSchema.safeParse({
      unitId: "11111111-1111-1111-1111-111111111111",
      client: {
        fullName: "Test Client",
        relationPrefix: "S/O",
        relationName: "Test Father",
        cnic: "35201-1234567-1",
        phone: "03001234567",
        email: "",
        homeAddress: "House 1 Street 2",
        postalAddress: "House 1 Street 2",
      },
      downPaymentPkr: "100000",
      plan: "MONTHLY",
      installmentCount: 12,
      startDate: "2026-12-01",
    });
    expect(parsed.success).toBe(false);
  });

  it("requires nominee CNIC on booking/sale kin schema", () => {
    const missing = requiredNextOfKinSchema.safeParse({
      name: "Ayesha",
      relationPrefix: "D/O",
      relationName: "Tariq",
      relation: "Spouse",
      cnic: "",
      phone: "03007654321",
    });
    expect(missing.success).toBe(false);
    const ok = requiredNextOfKinSchema.safeParse({
      name: "Ayesha",
      relationPrefix: "D/O",
      relationName: "Tariq",
      relation: "Spouse",
      cnic: "3520112345671",
      phone: "03007654321",
    });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.cnic).toBe("35201-1234567-1");
  });
});
