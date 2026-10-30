import { describe, expect, it } from "vitest";
import {
  computeTotalPrice,
  formatPkr,
  formatPkrCompact,
  formatPkrLedger,
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
