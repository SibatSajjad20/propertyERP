import { describe, expect, it } from "vitest";
import {
  calculateClientLedger,
  recalculateInstallmentAllocations,
  validateReschedule,
} from "@/features/installments/calculator";

describe("Installments Calculator: Recalculate Allocations on Void / Edit", () => {
  const dummyBooking = {
    id: "bkg-1",
    netPrice: "500000.00",
    downPayment: "100000.00",
  };

  const dummyInstallments = [
    {
      id: "inst-1",
      seq: 1,
      dueDate: new Date("2026-05-01"),
      amount: "200000.00",
    },
    {
      id: "inst-2",
      seq: 2,
      dueDate: new Date("2026-06-01"),
      amount: "200000.00",
    },
  ];

  it("allocates down payment and subsequent payments waterfall", () => {
    const payments = [
      {
        id: "p-0",
        receiptNo: "REC-001",
        amount: "100000.00", // down payment
        isVoided: false,
        paidAt: new Date("2026-04-01"),
      },
      {
        id: "p-1",
        receiptNo: "REC-002",
        amount: "200000.00", // installment 1
        isVoided: false,
        paidAt: new Date("2026-05-01"),
      },
    ];

    const result = recalculateInstallmentAllocations({
      booking: dummyBooking,
      installments: dummyInstallments,
      payments,
      asOfDate: new Date("2026-05-15"),
    });

    expect(result.paidTotalPkr).toBe("300000.00");
    expect(result.isCompleted).toBe(false);

    expect(result.installments[0]?.paidAmount).toBe("200000.00");
    expect(result.installments[0]?.status).toBe("PAID");
    expect(result.installments[0]?.receiptNos).toBe("REC-002");

    expect(result.installments[1]?.paidAmount).toBe("0.00");
    expect(result.installments[1]?.status).toBe("PENDING");
  });

  it("recalculates waterfall when an intermediate payment is voided", () => {
    const payments = [
      {
        id: "p-0",
        receiptNo: "REC-001",
        amount: "100000.00",
        isVoided: false,
        paidAt: new Date("2026-04-01"),
      },
      {
        id: "p-1",
        receiptNo: "REC-002",
        amount: "200000.00",
        isVoided: true, // VOIDED!
        paidAt: new Date("2026-05-01"),
      },
      {
        id: "p-2",
        receiptNo: "REC-003",
        amount: "200000.00",
        isVoided: false,
        paidAt: new Date("2026-06-01"),
      },
    ];

    const result = recalculateInstallmentAllocations({
      booking: dummyBooking,
      installments: dummyInstallments,
      payments,
      asOfDate: new Date("2026-06-15"),
    });

    // Total active paid = 100k + 200k = 300k
    expect(result.paidTotalPkr).toBe("300000.00");
    // p-2 now covers inst-1 instead of inst-2!
    expect(result.installments[0]?.paidAmount).toBe("200000.00");
    expect(result.installments[0]?.status).toBe("PAID");
    expect(result.installments[0]?.receiptNos).toBe("REC-003");

    // inst-2 has 0 paid and dueDate 2026-06-01 is past asOfDate 2026-06-15 -> OVERDUE
    expect(result.installments[1]?.paidAmount).toBe("0.00");
    expect(result.installments[1]?.status).toBe("OVERDUE");
    expect(result.installments[1]?.receiptNos).toBeNull();
  });

  it("marks booking as completed (isCompleted = true) when payments reach net price", () => {
    const payments = [
      {
        id: "p-0",
        receiptNo: "REC-001",
        amount: "100000.00",
        isVoided: false,
        paidAt: new Date("2026-04-01"),
      },
      {
        id: "p-1",
        receiptNo: "REC-002",
        amount: "200000.00",
        isVoided: false,
        paidAt: new Date("2026-05-01"),
      },
      {
        id: "p-2",
        receiptNo: "REC-003",
        amount: "200000.00",
        isVoided: false,
        paidAt: new Date("2026-06-01"),
      },
    ];

    const result = recalculateInstallmentAllocations({
      booking: dummyBooking,
      installments: dummyInstallments,
      payments,
    });

    expect(result.paidTotalPkr).toBe("500000.00");
    expect(result.isCompleted).toBe(true);
    expect(result.installments[0]?.status).toBe("PAID");
    expect(result.installments[1]?.status).toBe("PAID");
  });
});

describe("Installments Calculator: Reschedule Validation", () => {
  it("validates exact match of rescheduled total to unpaid balance", () => {
    const valid = validateReschedule(
      "300000.00",
      [
        { seq: 1, dueDate: "2026-07-01", amountPkr: "150000.00" },
        { seq: 2, dueDate: "2026-08-01", amountPkr: "150000.00" },
      ],
      "Client requested revised 2-month timeline",
    );

    expect(valid.valid).toBe(true);
    expect(valid.error).toBeNull();
    expect(valid.actualSumPkr).toBe("300000.00");
  });

  it("rejects reschedule when sum does not equal balance", () => {
    const invalid = validateReschedule(
      "300000.00",
      [
        { seq: 1, dueDate: "2026-07-01", amountPkr: "150000.00" },
        { seq: 2, dueDate: "2026-08-01", amountPkr: "100000.00" },
      ],
      "Client requested change",
    );

    expect(invalid.valid).toBe(false);
    expect(invalid.error).toContain("does not match");
    expect(invalid.differencePkr).toBe("50000.00");
  });

  it("requires a minimum reason length", () => {
    const invalid = validateReschedule(
      "300000.00",
      [{ seq: 1, dueDate: "2026-07-01", amountPkr: "300000.00" }],
      "ok",
    );

    expect(invalid.valid).toBe(false);
    expect(invalid.error).toContain("reason of at least 5 characters");
  });

  it("rejects non-chronological dates", () => {
    const invalid = validateReschedule(
      "300000.00",
      [
        { seq: 1, dueDate: "2026-08-01", amountPkr: "150000.00" },
        { seq: 2, dueDate: "2026-07-01", amountPkr: "150000.00" },
      ],
      "Client requested change",
    );

    expect(invalid.valid).toBe(false);
    expect(invalid.error).toContain("due date must be on or after");
  });
});

describe("Installments Calculator: Client Ledger Running Balance", () => {
  const entries = [
    {
      date: new Date("2026-01-10"),
      description: "Booking 6F-01 Net Price",
      debitPkr: "5000000.00",
      creditPkr: "0.00",
    },
    {
      date: new Date("2026-01-10"),
      description: "Down payment receipt REC-001",
      receiptNo: "REC-001",
      debitPkr: "0.00",
      creditPkr: "1000000.00",
    },
    {
      date: new Date("2026-02-10"),
      description: "Installment #1 Payment",
      receiptNo: "REC-002",
      debitPkr: "0.00",
      creditPkr: "500000.00",
    },
    {
      date: new Date("2026-03-10"),
      description: "Installment #2 Payment",
      receiptNo: "REC-003",
      debitPkr: "0.00",
      creditPkr: "500000.00",
    },
  ];

  it("calculates running balances and closing balance accurately", () => {
    const ledger = calculateClientLedger(entries);

    expect(ledger.openingBalancePkr).toBe("0.00");
    expect(ledger.entries.length).toBe(4);

    expect(ledger.entries[0]?.runningBalancePkr).toBe("5000000.00");
    expect(ledger.entries[1]?.runningBalancePkr).toBe("4000000.00");
    expect(ledger.entries[2]?.runningBalancePkr).toBe("3500000.00");
    expect(ledger.entries[3]?.runningBalancePkr).toBe("3000000.00");

    expect(ledger.closingBalancePkr).toBe("3000000.00");
    expect(ledger.totalDebitsPkr).toBe("5000000.00");
    expect(ledger.totalCreditsPkr).toBe("2000000.00");
  });

  it("computes non-zero opening balance when period starts after initial transactions", () => {
    // Select period starting 2026-02-01
    const ledger = calculateClientLedger(
      entries,
      new Date("2026-02-01"),
      new Date("2026-03-31"),
    );

    // Prior to Feb 1: 5M debit - 1M credit = 4M opening balance
    expect(ledger.openingBalancePkr).toBe("4000000.00");
    expect(ledger.entries.length).toBe(2); // Only Feb and Mar transactions
    expect(ledger.entries[0]?.runningBalancePkr).toBe("3500000.00");
    expect(ledger.entries[1]?.runningBalancePkr).toBe("3000000.00");
    expect(ledger.closingBalancePkr).toBe("3000000.00");
  });
});
