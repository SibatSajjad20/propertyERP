import { describe, expect, it } from "vitest";
import { computeTotalPrice, formatPkr, formatPkrCompact } from "@/lib/money";

describe("computeTotalPrice", () => {
  it("multiplies rate by net area and adds adjustment with 2-decimal money math", () => {
    expect(computeTotalPrice("25000.00", "312.50", "0")).toBe("7812500.00");
    expect(computeTotalPrice("18500.50", "100.00", "15000.00")).toBe("1865050.00");
    expect(computeTotalPrice("10.00", "10.00", "-25.00")).toBe("75.00");
  });

  it("rounds half up at the paisa boundary", () => {
    expect(computeTotalPrice("1.15", "1.15", "0")).toBe("1.32");
  });
});

describe("formatPkrCompact", () => {
  it("uses lakh and crore for large PKR amounts", () => {
    expect(formatPkrCompact("1500000.00")).toBe("15.00 lakh");
    expect(formatPkr("25000000.00")).toBe("PKR 2.50 crore");
  });
});
