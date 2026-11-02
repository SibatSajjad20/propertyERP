import { describe, expect, it } from "vitest";
import {
  cleanMoneyInput,
  computeTotalPrice,
  formatMoneyInput,
  formatPkr,
  formatPkrCompact,
  formatPkrLedger,
  parseDecimal,
} from "@/lib/money";

describe("computeTotalPrice", () => {
  it("multiplies rate by net area and adds adjustment, rounding to whole rupees", () => {
    expect(computeTotalPrice("25000.00", "312.50", "0")).toBe("7812500.00");
    expect(computeTotalPrice("18500.50", "100.00", "15000.00")).toBe("1865050.00");
    expect(computeTotalPrice("10.00", "10.00", "-25.00")).toBe("75.00");
  });

  it("rounds half up to a whole rupee", () => {
    expect(computeTotalPrice("1.00", "1.50", "0")).toBe("2.00");
    expect(computeTotalPrice("1.15", "1.15", "0")).toBe("1.00");
  });
});

describe("parseDecimal", () => {
  it("parses decimals with or without commas safely", () => {
    expect(parseDecimal("1008000232")).toBe(100800023200n);
    expect(parseDecimal("1,00,80,00,232")).toBe(100800023200n);
    expect(parseDecimal("2,23,23,232.50")).toBe(2232323250n);
    expect(parseDecimal("-5,000")).toBe(-500000n);
  });
});

describe("formatMoneyInput", () => {
  it("formats user entered numbers with proper Pakistani Lakh/Crore commas", () => {
    expect(formatMoneyInput("1008000232")).toBe("1,00,80,00,232");
    expect(formatMoneyInput("22323232")).toBe("2,23,23,232");
    expect(formatMoneyInput("50000")).toBe("50,000");
    expect(formatMoneyInput("150000")).toBe("1,50,000");
    expect(formatMoneyInput("1000.")).toBe("1,000.");
    expect(formatMoneyInput("1000.50")).toBe("1,000.50");
    expect(formatMoneyInput("-5000", { allowNegative: true })).toBe("-5,000");
    expect(formatMoneyInput("")).toBe("");
  });
});

describe("cleanMoneyInput", () => {
  it("strips commas while preserving valid numeric characters", () => {
    expect(cleanMoneyInput("1,00,80,00,232")).toBe("1008000232");
    expect(cleanMoneyInput("2,23,23,232.50")).toBe("22323232.50");
    expect(cleanMoneyInput("-5,000", { allowNegative: true })).toBe("-5000");
    expect(cleanMoneyInput("")).toBe("");
  });
});

describe("formatPkrLedger", () => {
  it("groups with the lakh/crore comma style and an Rs prefix", () => {
    expect(formatPkrLedger("8400000.00")).toBe("Rs 84,00,000");
    expect(formatPkrLedger("84000000.00")).toBe("Rs 8,40,00,000");
    expect(formatPkr("25000.50")).toBe("Rs 25,000.50");
  });
});

describe("formatPkrCompact", () => {
  it("uses Lac and Cr for large PKR amounts", () => {
    expect(formatPkrCompact("4500000.00")).toBe("45 Lac");
    expect(formatPkrCompact("84000000.00")).toBe("8.4 Cr");
  });
});
