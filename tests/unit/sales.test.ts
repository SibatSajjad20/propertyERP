import { describe, expect, it } from "vitest";
import {
  allocatePayment,
  calculateBuyback,
  calculateDiscount,
  calculateRefund,
  generateSchedule,
} from "@/features/sales/calculator";
import { formatCnic, clientSchema } from "@/features/sales/schema";
import { STATUS_TRANSITIONS, canTransition } from "@/features/units/status";
import { parseDecimal } from "@/lib/money";

describe("Sales Calculator: Discount Engine", () => {
  it("returns zero discount when no discount is applied", () => {
    const res = calculateDiscount("10000000.00", null, null);
    expect(res.discountAmountPkr).toBe("0.00");
    expect(res.effectivePercent).toBe(0);
    expect(res.netPricePkr).toBe("10000000.00");
    expect(res.requiresAdmin).toBe(false);
  });

  it("calculates percentage discount accurately within sales representative limit (<= 10%)", () => {
    const res = calculateDiscount("10000000.00", "PERCENT", "5.00");
    expect(res.discountAmountPkr).toBe("500000.00");
    expect(res.effectivePercent).toBe(5);
    expect(res.netPricePkr).toBe("9500000.00");
    expect(res.requiresAdmin).toBe(false);
  });

  it("flags percentage discount exceeding 10% as requiring ADMIN approval", () => {
    const res = calculateDiscount("10000000.00", "PERCENT", "12.50");
    expect(res.discountAmountPkr).toBe("1250000.00");
    expect(res.effectivePercent).toBe(12.5);
    expect(res.netPricePkr).toBe("8750000.00");
    expect(res.requiresAdmin).toBe(true);
  });

  it("calculates fixed amount discount and flags if effective percentage > 10%", () => {
    // 500k on 10M is 5% -> no admin
    const normal = calculateDiscount("10000000.00", "AMOUNT", "500000.00");
    expect(normal.discountAmountPkr).toBe("500000.00");
    expect(normal.effectivePercent).toBe(5);
    expect(normal.requiresAdmin).toBe(false);

    // 1.5M on 10M is 15% -> requires admin
    const large = calculateDiscount("10000000.00", "AMOUNT", "1500000.00");
    expect(large.discountAmountPkr).toBe("1500000.00");
    expect(large.effectivePercent).toBe(15);
    expect(large.requiresAdmin).toBe(true);
  });

  it("caps discount amount to list price if discount exceeds list price", () => {
    const res = calculateDiscount("1000000.00", "AMOUNT", "1500000.00");
    expect(res.discountAmountPkr).toBe("1000000.00");
    expect(res.netPricePkr).toBe("0.00");
  });
});

describe("Sales Calculator: Installment Schedule Generator", () => {
  it("generates 12 monthly installments rounded to nearest Rs 100 with remainder on final installment", () => {
    const startDate = new Date(Date.UTC(2026, 0, 1));
    const sched = generateSchedule({
      listPricePkr: "12000000.00",
      downPaymentPkr: "2400000.00", // 20% down
      possessionAmountPkr: "1200000.00", // 10% possession
      plan: "MONTHLY",
      installmentCount: 12,
      startDate,
    });

    // Net: 12M. Down: 2.4M. Possession: 1.2M. Balance: 8.4M.
    // 8.4M / 12 = 700,000 per month (exact multiple of 100)
    expect(sched.netPricePkr).toBe("12000000.00");
    expect(sched.downPaymentPkr).toBe("2400000.00");
    expect(sched.possessionAmountPkr).toBe("1200000.00");
    expect(sched.totalInstallmentsPkr).toBe("8400000.00");
    expect(sched.installments.length).toBe(12);

    // Total of downPayment + installments + possession must equal netPrice exact to the paisa
    let instSumPaisa = 0n;
    for (const inst of sched.installments) {
      instSumPaisa += parseDecimal(inst.amountPkr);
    }
    const totalFinancedPaisa =
      parseDecimal(sched.downPaymentPkr) +
      instSumPaisa +
      parseDecimal(sched.possessionAmountPkr);

    expect(totalFinancedPaisa).toBe(parseDecimal(sched.netPricePkr));
  });

  it("preserves exact paisa balance on non-divisible amounts by assigning remainder to last installment", () => {
    const startDate = new Date(Date.UTC(2026, 0, 1));
    // Odd amount: 10,000,007.50
    const sched = generateSchedule({
      listPricePkr: "10000007.50",
      downPaymentPkr: "1000000.00",
      possessionAmountPkr: "0.00",
      plan: "MONTHLY",
      installmentCount: 7,
      startDate,
    });

    expect(sched.installments.length).toBe(7);

    // Verify installments 1 through 6 are rounded to nearest Rs 100
    for (let i = 0; i < 6; i++) {
      const inst = sched.installments[i];
      expect(inst).toBeDefined();
      if (inst) {
        const paisa = parseDecimal(inst.amountPkr);
        expect(paisa % 10000n).toBe(0n); // exactly divisible by 10,000 paisa (Rs 100)
      }
    }

    // Exact sum invariant check
    let sumInstPaisa = 0n;
    for (const inst of sched.installments) {
      sumInstPaisa += parseDecimal(inst.amountPkr);
    }
    const grandTotal =
      parseDecimal(sched.downPaymentPkr) +
      sumInstPaisa +
      parseDecimal(sched.possessionAmountPkr);

    expect(grandTotal).toBe(parseDecimal(sched.netPricePkr));
  });

  it("handles QUARTERLY and SEMI_ANNUAL interval spacing", () => {
    const startDate = new Date(Date.UTC(2026, 0, 1));
    const qSched = generateSchedule({
      listPricePkr: "4000000.00",
      downPaymentPkr: "1000000.00",
      plan: "QUARTERLY",
      installmentCount: 4,
      startDate,
    });

    const q0 = qSched.installments[0];
    const q1 = qSched.installments[1];
    const q2 = qSched.installments[2];
    const q3 = qSched.installments[3];
    expect(q0?.dueDate.getUTCMonth()).toBe(0); // Jan
    expect(q1?.dueDate.getUTCMonth()).toBe(3); // Apr
    expect(q2?.dueDate.getUTCMonth()).toBe(6); // Jul
    expect(q3?.dueDate.getUTCMonth()).toBe(9); // Oct

    const saSched = generateSchedule({
      listPricePkr: "4000000.00",
      downPaymentPkr: "1000000.00",
      plan: "SEMI_ANNUAL",
      installmentCount: 2,
      startDate,
    });
    const sa0 = saSched.installments[0];
    const sa1 = saSched.installments[1];
    expect(sa0?.dueDate.getUTCMonth()).toBe(0); // Jan
    expect(sa1?.dueDate.getUTCMonth()).toBe(6); // Jul
  });
});

describe("Sales Calculator: Payment Allocation Waterfall", () => {
  const dummyInstallments = [
    {
      id: "inst-1",
      seq: 1,
      dueDate: new Date(Date.UTC(2026, 1, 1)),
      amount: "100000.00",
      paidAmount: "0.00",
      status: "PENDING" as const,
    },
    {
      id: "inst-2",
      seq: 2,
      dueDate: new Date(Date.UTC(2026, 2, 1)),
      amount: "100000.00",
      paidAmount: "0.00",
      status: "PENDING" as const,
    },
    {
      id: "inst-3",
      seq: 3,
      dueDate: new Date(Date.UTC(2026, 3, 1)),
      amount: "100000.00",
      paidAmount: "0.00",
      status: "PENDING" as const,
    },
  ];

  it("allocates partial payment to the first unpaid installment", () => {
    const result = allocatePayment({
      paymentAmountPkr: "60000.00",
      currentPaidTotalPkr: "200000.00", // down payment already paid
      netPricePkr: "500000.00",
      installments: dummyInstallments,
    });

    expect(result.allocations.length).toBe(1);
    const a0 = result.allocations[0];
    expect(a0?.installmentId).toBe("inst-1");
    expect(a0?.allocatedPkr).toBe("60000.00");
    expect(a0?.newPaidPkr).toBe("60000.00");
    expect(a0?.newStatus).toBe("PARTIAL");
    expect(result.unallocatedPkr).toBe("0.00");
    expect(result.isCompleted).toBe(false);
  });

  it("cascades payment across multiple installments in sequence order", () => {
    const result = allocatePayment({
      paymentAmountPkr: "250000.00",
      currentPaidTotalPkr: "200000.00",
      netPricePkr: "500000.00",
      installments: dummyInstallments,
    });

    // Pays inst-1 (100k) fully, inst-2 (100k) fully, inst-3 (50k) partial
    expect(result.allocations.length).toBe(3);
    const a0 = result.allocations[0];
    const a1 = result.allocations[1];
    const a2 = result.allocations[2];

    expect(a0?.newStatus).toBe("PAID");
    expect(a0?.allocatedPkr).toBe("100000.00");

    expect(a1?.newStatus).toBe("PAID");
    expect(a1?.allocatedPkr).toBe("100000.00");

    expect(a2?.newStatus).toBe("PARTIAL");
    expect(a2?.allocatedPkr).toBe("50000.00");

    expect(result.unallocatedPkr).toBe("0.00");
    expect(result.isCompleted).toBe(false);
  });

  it("marks booking as completed (auto-SOLD) when paid total reaches net price", () => {
    const result = allocatePayment({
      paymentAmountPkr: "300000.00",
      currentPaidTotalPkr: "200000.00",
      netPricePkr: "500000.00",
      installments: dummyInstallments,
    });

    expect(result.allocations.length).toBe(3);
    const a2 = result.allocations[2];
    expect(a2?.newStatus).toBe("PAID");
    expect(result.newPaidTotalPkr).toBe("500000.00");
    expect(result.isCompleted).toBe(true);
  });
});

describe("Sales Calculator: Reversals (Refunds & Buybacks)", () => {
  it("calculates refund with fixed amount deduction", () => {
    const refund = calculateRefund({
      paidTotalPkr: "1000000.00",
      deductionType: "AMOUNT",
      deductionValue: "150000.00", // Rs 150k cancellation fee
    });

    expect(refund.deductionPkr).toBe("150000.00");
    expect(refund.refundAmountPkr).toBe("850000.00");
  });

  it("calculates refund with percentage deduction", () => {
    const refund = calculateRefund({
      paidTotalPkr: "2000000.00",
      deductionType: "PERCENT",
      deductionValue: "10.00", // 10% fee
    });

    expect(refund.deductionPkr).toBe("200000.00");
    expect(refund.refundAmountPkr).toBe("1800000.00");
  });

  it("calculates buyback gain when Sardar's Mall buys back at discount", () => {
    const bb = calculateBuyback({
      originalPricePkr: "10000000.00",
      buybackAmountPkr: "9000000.00",
    });

    expect(bb.isGain).toBe(true);
    expect(bb.differencePkr).toBe("1000000.00");
  });

  it("calculates buyback loss when unit is bought back at premium", () => {
    const bb = calculateBuyback({
      originalPricePkr: "10000000.00",
      buybackAmountPkr: "11500000.00",
    });

    expect(bb.isGain).toBe(false);
    expect(bb.differencePkr).toBe("1500000.00");
  });
});

describe("Unit Status Transitions & Reversal Lifecycles", () => {
  it("supports the full standard lifecycle: AVAILABLE -> RESERVED -> BOOKED -> SOLD", () => {
    expect(canTransition("AVAILABLE", "RESERVED")).toBe(true);
    expect(canTransition("RESERVED", "BOOKED")).toBe(true);
    expect(canTransition("BOOKED", "SOLD")).toBe(true);
  });

  it("supports direct booking and direct sale from AVAILABLE", () => {
    expect(canTransition("AVAILABLE", "BOOKED")).toBe(true);
    expect(canTransition("AVAILABLE", "SOLD")).toBe(true);
  });

  it("supports reversal transitions: RESERVED -> AVAILABLE, BOOKED -> AVAILABLE, SOLD -> AVAILABLE", () => {
    expect(canTransition("RESERVED", "AVAILABLE")).toBe(true); // reservation cancelled/expired
    expect(canTransition("BOOKED", "AVAILABLE")).toBe(true); // booking returned
    expect(canTransition("SOLD", "AVAILABLE")).toBe(true); // unit bought back
  });

  it("allows a previously bought-back or returned unit (AVAILABLE) to be booked or sold again", () => {
    // When a unit is reverted back to AVAILABLE, it can once again transition to RESERVED, BOOKED, or SOLD
    const nextStatuses = STATUS_TRANSITIONS["AVAILABLE"];
    expect(nextStatuses).toContain("RESERVED");
    expect(nextStatuses).toContain("BOOKED");
    expect(nextStatuses).toContain("SOLD");
  });
});

describe("Sales Validation & CNIC Normalization", () => {
  it("normalizes a raw 13-digit CNIC into hyphenated format", () => {
    expect(formatCnic("3253232343241")).toBe("32532-3234324-1");
    expect(formatCnic("35201-1234567-1")).toBe("35201-1234567-1");
    expect(formatCnic("35201 1234567 1")).toBe("35201-1234567-1");
  });

  it("clientSchema successfully parses raw 13-digit and hyphenated CNICs", () => {
    const rawInput = {
      fullName: "Sibat Sajjad",
      cnic: "3253232343241", // 13 digits raw
      phone: "0300-1234567",
      email: "sajjadsibat33@gmail.com",
      homeAddress: "Phase 8 Bahria Town, RWP",
      postalAddress: "Phase 8 Bahria Town, RWP",
    };
    const parsed = clientSchema.safeParse(rawInput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.cnic).toBe("32532-3234324-1");
    }
  });

  it("clientSchema rejects 12-digit incomplete CNIC with helpful error", () => {
    const invalidInput = {
      fullName: "Sibat Sajjad",
      cnic: "325323234324", // 12 digits (1 digit missing)
      phone: "0300-1234567",
      email: "sajjadsibat33@gmail.com",
      homeAddress: "Phase 8 Bahria Town, RWP",
      postalAddress: "Phase 8 Bahria Town, RWP",
    };
    const parsed = clientSchema.safeParse(invalidInput);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toContain("CNIC must be 13 digits");
    }
  });
});
