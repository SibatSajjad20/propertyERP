import { describe, expect, it } from "vitest";
import { formatDecimal, parseDecimal } from "@/lib/money";

describe("Summary Report Financial Aggregations", () => {
  it("computes net cash collections strictly deducting refunds and buybacks", () => {
    const grossPayments = ["500000.00", "750000.00", "1250000.00"];
    const refunds = ["100000.00", "50000.00"];
    const buybacks = ["300000.00"];

    let grossPaisa = 0n;
    for (const p of grossPayments) {
      grossPaisa += parseDecimal(p);
    }
    expect(formatDecimal(grossPaisa)).toBe("2500000.00");

    let deductionsPaisa = 0n;
    for (const r of refunds) {
      deductionsPaisa += parseDecimal(r);
    }
    for (const b of buybacks) {
      deductionsPaisa += parseDecimal(b);
    }
    expect(formatDecimal(deductionsPaisa)).toBe("450000.00");

    const netPaisa = grossPaisa - deductionsPaisa;
    expect(formatDecimal(netPaisa)).toBe("2050000.00");
  });

  it("calculates outstanding receivables and overdue exposure across bookings", () => {
    const activeBookings = [
      { netPrice: "2000000.00", paidTotal: "800000.00" }, // 1.2M receivable
      { netPrice: "3500000.00", paidTotal: "3500000.00" }, // 0 receivable (completed)
      { netPrice: "1500000.00", paidTotal: "300000.00" }, // 1.2M receivable
    ];

    let outstandingPaisa = 0n;
    for (const b of activeBookings) {
      const netP = parseDecimal(b.netPrice);
      const paidP = parseDecimal(b.paidTotal);
      if (netP > paidP) {
        outstandingPaisa += netP - paidP;
      }
    }
    expect(formatDecimal(outstandingPaisa)).toBe("2400000.00");

    const installments = [
      { amount: "200000.00", paidAmount: "200000.00", isPastDue: true }, // 0
      { amount: "200000.00", paidAmount: "100000.00", isPastDue: true }, // 100k overdue
      { amount: "200000.00", paidAmount: "0.00", isPastDue: true }, // 200k overdue
      { amount: "200000.00", paidAmount: "0.00", isPastDue: false }, // 0 (future due)
    ];

    let overduePaisa = 0n;
    let overdueCount = 0;
    for (const inst of installments) {
      if (inst.isPastDue) {
        const amtP = parseDecimal(inst.amount);
        const paidP = parseDecimal(inst.paidAmount);
        const bal = amtP - paidP;
        if (bal > 0n) {
          overduePaisa += bal;
          overdueCount++;
        }
      }
    }

    expect(overdueCount).toBe(2);
    expect(formatDecimal(overduePaisa)).toBe("300000.00");
  });

  it("aggregates status mix counts and values correctly", () => {
    const units = [
      { status: "AVAILABLE", price: "2500000.00" },
      { status: "AVAILABLE", price: "3000000.00" },
      { status: "RESERVED", price: "4000000.00" },
      { status: "BOOKED", price: "5000000.00" },
      { status: "SOLD", price: "6000000.00" },
    ];

    const counts: Record<string, number> = {};
    const values: Record<string, bigint> = {};

    for (const u of units) {
      counts[u.status] = (counts[u.status] || 0) + 1;
      values[u.status] = (values[u.status] || 0n) + parseDecimal(u.price);
    }

    expect(counts["AVAILABLE"]).toBe(2);
    expect(formatDecimal(values["AVAILABLE"]!)).toBe("5500000.00");
    expect(counts["RESERVED"]).toBe(1);
    expect(formatDecimal(values["RESERVED"]!)).toBe("4000000.00");
    expect(counts["BOOKED"]).toBe(1);
    expect(formatDecimal(values["BOOKED"]!)).toBe("5000000.00");
    expect(counts["SOLD"]).toBe(1);
    expect(formatDecimal(values["SOLD"]!)).toBe("6000000.00");
  });
});
