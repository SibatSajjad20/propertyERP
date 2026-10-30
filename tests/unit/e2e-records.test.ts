import { describe, expect, it } from "vitest";
import { isE2eStructureName, isE2eUnitCode } from "@/lib/e2e-records";
import { assertTestDatabase } from "@/lib/test-db-guard";

describe("e2e record matchers", () => {
  it("only matches generated test unit codes", () => {
    expect(isE2eUnitCode("E2E-123")).toBe(true);
    expect(isE2eUnitCode("ST-1793000000000")).toBe(true);
    expect(isE2eUnitCode("GF-S12")).toBe(false);
    expect(isE2eUnitCode("ST-SHOP")).toBe(false);
  });

  it("matches Playwright structure names", () => {
    expect(isE2eStructureName("E2E empty 1")).toBe(true);
    expect(isE2eStructureName("Archive empty 99")).toBe(true);
    expect(isE2eStructureName("Main")).toBe(false);
  });
});

describe("test database guard", () => {
  it("allows localhost", () => {
    expect(() =>
      assertTestDatabase({
        DATABASE_URL: "postgres://sardar:sardar@127.0.0.1:5432/sardars_mall",
      }),
    ).not.toThrow();
  });

  it("refuses production hosts", () => {
    expect(() =>
      assertTestDatabase({
        DATABASE_URL: "postgres://u:p@sardarsmall-prod.neon.tech/neondb",
        VERCEL_ENV: "production",
      }),
    ).toThrow(/ABORT/);
  });
});
