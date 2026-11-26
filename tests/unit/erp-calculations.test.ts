import { describe, expect, it } from "vitest";
import {
  effectivePricingArea,
  formatUnitDisplayCode,
  formatUnitNumberLabel,
  isResidentialApartment,
} from "@/lib/area";
import { computeTotalPrice, parseDecimal } from "@/lib/money";
import { generateSchedule, resolveChargeAmount } from "@/features/sales/calculator";
import {
  calculateInstallmentSurcharge,
  summarizeBookingSurcharges,
} from "@/features/installments/surcharge";

describe("Gross Area Pricing & Apartment Display Format", () => {
  it("computes total unit price strictly from Gross Square Feet × Rate per Sq. Ft.", () => {
    const gross = "649.00";
    const net = "498.00";
    const rate = "24000.00";
    const area = effectivePricingArea(gross, net);
    expect(area).toBe("649.00");
    // 649 * 24,000 = 15,576,000
    expect(computeTotalPrice(rate, area)).toBe("15576000.00");
  });

  it("falls back to net area only when gross area is null or empty", () => {
    expect(effectivePricingArea(null, "303.00")).toBe("303.00");
    expect(effectivePricingArea("", "303.00")).toBe("303.00");
    expect(computeTotalPrice("106000.00", effectivePricingArea(null, "303.00"))).toBe(
      "32118000.00",
    );
  });

  it("formats residential apartment unit codes as 'Apartment No. <unitCode>'", () => {
    expect(isResidentialApartment("10F-RA1", "1-BED")).toBe(true);
    expect(isResidentialApartment("GF-S6", "Mall Shops")).toBe(false);
    expect(formatUnitDisplayCode("10F-RA1", "1-BED")).toBe("Apartment No. 10F-RA1");
    expect(formatUnitNumberLabel("10F-RA1", "APARTMENT BLOCK-01", "1-BED")).toBe(
      "Apartment No. 10F-RA1",
    );
    expect(formatUnitDisplayCode("GF-S6", "Mall Shops")).toBe("GF-S6");
  });
});

describe("Booking Payment Schedule — Down Payment, Possession, Annual Balloon & Token", () => {
  it("resolves percentage and fixed PKR charges accurately", () => {
    expect(resolveChargeAmount("10000000.00", "PERCENT", "25")).toEqual({
      amountPkr: "2500000.00",
      effectivePercent: 25,
    });
    expect(resolveChargeAmount("10000000.00", "PERCENT", "15")).toEqual({
      amountPkr: "1500000.00",
      effectivePercent: 15,
    });
    expect(resolveChargeAmount("10000000.00", "PERCENT", "10")).toEqual({
      amountPkr: "1000000.00",
      effectivePercent: 10,
    });
    expect(resolveChargeAmount("10000000.00", "AMOUNT", "1250000")).toEqual({
      amountPkr: "1250000.00",
      effectivePercent: 12.5,
    });
  });

  it("applies 10% balloon payment on remaining balance divided across years (10M price, 2.5M down, 1.5M poss -> 6M bal -> 600k total = 200k/yr), and preserves exact paisa invariant", () => {
    const schedule = generateSchedule({
      listPricePkr: "10000000.00",
      downPaymentType: "PERCENT",
      downPaymentValue: "25",
      possessionType: "PERCENT",
      possessionValue: "15",
      balloonType: "PERCENT",
      balloonValue: "10",
      plan: "MONTHLY",
      installmentCount: 36,
      startDate: new Date("2026-03-01T00:00:00Z"),
    });

    expect(schedule.isValid).toBe(true);
    expect(schedule.downPaymentPkr).toBe("2500000.00");
    expect(schedule.possessionAmountPkr).toBe("1500000.00");
    expect(schedule.balloonCount).toBe(3);
    expect(schedule.balloonPercent).toBe(10);
    expect(schedule.balloonPercentPerYear).toBe(3.33);
    // Remaining balance after down (2.5M) + poss (1.5M) = 6.0M.
    // 10% of 6.0M = 600k total balloon. Divided over 3 years = 200k/yr.
    expect(schedule.balloonAmountPerYearPkr).toBe("200000.00");
    expect(schedule.balloonTotalAmountPkr).toBe("600000.00");
    // Remaining regular installments = 6.0M - 600k = 5.4M
    expect(schedule.totalInstallmentsPkr).toBe("5400000.00");

    const regular = schedule.installments.filter((i) => i.type === "REGULAR");
    const balloons = schedule.installments.filter((i) => i.type === "BALLOON");
    const possessions = schedule.installments.filter((i) => i.type === "POSSESSION");

    expect(regular).toHaveLength(36);
    expect(balloons).toHaveLength(3);
    expect(possessions).toHaveLength(1);

    expect(balloons[0]?.amountPkr).toBe("200000.00");
    expect(balloons[1]?.amountPkr).toBe("200000.00");
    expect(balloons[2]?.amountPkr).toBe("200000.00");

    const scheduleSum = schedule.installments.reduce(
      (acc, i) => acc + parseDecimal(i.amountPkr),
      0n,
    );
    expect(scheduleSum + parseDecimal(schedule.downPaymentPkr)).toBe(
      parseDecimal(schedule.netPricePkr),
    );
  });

  it("calculates user's Rs 300,000 example: 25% down (75k), 15% possession (45k), remaining 180k -> 10% balloon is 18k, divided by 3 years = 6k/yr; remaining 162k installments (4.5k/mo)", () => {
    const schedule = generateSchedule({
      listPricePkr: "300000.00",
      downPaymentType: "PERCENT",
      downPaymentValue: "25",
      possessionType: "PERCENT",
      possessionValue: "15",
      balloonType: "PERCENT",
      balloonValue: "10",
      plan: "MONTHLY",
      installmentCount: 36,
      startDate: new Date("2026-01-01T00:00:00Z"),
    });

    expect(schedule.isValid).toBe(true);
    expect(schedule.downPaymentPkr).toBe("75000.00");
    expect(schedule.possessionAmountPkr).toBe("45000.00");
    expect(schedule.balloonCount).toBe(3);
    expect(schedule.balloonPercent).toBe(10);
    // 10% on remaining balance of 180,000 is 18,000 total balloon!
    expect(schedule.balloonTotalAmountPkr).toBe("18000.00");
    // 18,000 divided by 3 years = 6,000 every year!
    expect(schedule.balloonAmountPerYearPkr).toBe("6000.00");
    // Remaining for regular monthly installments = 180,000 - 18,000 = 162,000
    expect(schedule.totalInstallmentsPkr).toBe("162000.00");

    const balloons = schedule.installments.filter((i) => i.type === "BALLOON");
    expect(balloons).toHaveLength(3);
    expect(balloons[0]?.amountPkr).toBe("6000.00");
    expect(balloons[1]?.amountPkr).toBe("6000.00");
    expect(balloons[2]?.amountPkr).toBe("6000.00");

    const regular = schedule.installments.filter((i) => i.type === "REGULAR");
    expect(regular).toHaveLength(36);
    // 162,000 / 36 = 4,500.00 per month
    expect(regular[0]?.amountPkr).toBe("4500.00");

    const scheduleSum = schedule.installments.reduce(
      (acc, i) => acc + parseDecimal(i.amountPkr),
      0n,
    );
    // Exact sum invariant: 75,000 + 45,000 + 18,000 + 162,000 = 300,000.00
    expect(scheduleSum + parseDecimal(schedule.downPaymentPkr)).toBe(
      parseDecimal("300000.00"),
    );
  });

  it("supports fixed PKR amounts for down payment, possession, and total balloon, plus token deduction", () => {
    const schedule = generateSchedule({
      listPricePkr: "15576000.00",
      discountType: "PERCENT",
      discountValue: "5",
      downPaymentType: "AMOUNT",
      downPaymentValue: "3000000",
      possessionType: "AMOUNT",
      possessionValue: "2000000",
      balloonType: "AMOUNT",
      balloonValue: "1000000",
      tokenAdjustedPkr: "500000",
      plan: "QUARTERLY",
      installmentCount: 8, // 24 months = 2 years -> 2 annual balloons
      startDate: new Date("2026-04-01T00:00:00Z"),
    });

    expect(schedule.isValid).toBe(true);
    // Net price = 15,576,000 * 0.95 = 14,797,200.00
    expect(schedule.netPricePkr).toBe("14797200.00");
    expect(schedule.tokenAdjustedPkr).toBe("500000.00");
    expect(schedule.payableDownPaymentNowPkr).toBe("2500000.00");
    expect(schedule.balloonCount).toBe(2);
    expect(schedule.balloonTotalAmountPkr).toBe("1000000.00");
    expect(schedule.balloonAmountPerYearPkr).toBe("500000.00");
    // Exact paisa invariant
    const scheduleSum = schedule.installments.reduce(
      (acc, i) => acc + parseDecimal(i.amountPkr),
      0n,
    );
    expect(scheduleSum + parseDecimal(schedule.downPaymentPkr)).toBe(
      parseDecimal(schedule.netPricePkr),
    );
  });

  it("flags invalid schedule when down + balloon + possession exceeds net price", () => {
    const schedule = generateSchedule({
      listPricePkr: "10000000.00",
      downPaymentType: "PERCENT",
      downPaymentValue: "50",
      possessionType: "PERCENT",
      possessionValue: "30",
      // Financed balance is 20% (2M). If balloon is 110% of financed balance > 20%
      balloonType: "PERCENT",
      balloonValue: "110",
      plan: "MONTHLY",
      installmentCount: 36,
      startDate: new Date("2026-03-01T00:00:00Z"),
    });
    expect(schedule.isValid).toBe(false);
    expect(schedule.validationError).toBeTruthy();
  });
});

describe("Surcharge Policy (30-day grace, 0.05%/day beyond day 30, Waive/Remove)", () => {
  it("charges Rs 0 when overdue 30 days or fewer", () => {
    const res = calculateInstallmentSurcharge(
      {
        amount: "100000.00",
        paidAmount: "0.00",
        dueDate: new Date("2026-01-01T00:00:00Z"),
        status: "OVERDUE",
      },
      new Date("2026-01-31T00:00:00Z"), // exactly 30 days
    );
    expect(res.daysPastDue).toBe(30);
    expect(res.chargeableDays).toBe(0);
    expect(res.netDuePkr).toBe("0.00");
  });

  it("charges 0.05% per day ONLY on days beyond the 30-day grace period", () => {
    const res = calculateInstallmentSurcharge(
      {
        amount: "100000.00",
        paidAmount: "0.00",
        dueDate: new Date("2026-01-01T00:00:00Z"),
        status: "OVERDUE",
      },
      new Date("2026-02-05T00:00:00Z"), // 35 days -> 5 chargeable days
    );
    expect(res.daysPastDue).toBe(35);
    expect(res.chargeableDays).toBe(5);
    // 100,000 * 0.05% * 5 = 250.00
    expect(res.rawAccruedPkr).toBe("250.00");
    expect(res.netDuePkr).toBe("250.00");
  });

  it("computes surcharge on unpaid remainder for partially paid installments and respects waivers & paid surcharge", () => {
    const res = calculateInstallmentSurcharge(
      {
        amount: "100000.00",
        paidAmount: "40000.00", // unpaid = 60,000
        dueDate: new Date("2026-01-01T00:00:00Z"),
        status: "PARTIAL",
        surchargeWaivedAmount: "100.00",
        surchargePaidAmount: "50.00",
      },
      new Date("2026-02-10T00:00:00Z"), // 40 days -> 10 chargeable days
    );
    // 60,000 * 0.05% * 10 = 300.00; minus 100 waived, minus 50 paid = 150.00
    expect(res.rawAccruedPkr).toBe("300.00");
    expect(res.waivedPkr).toBe("100.00");
    expect(res.paidPkr).toBe("50.00");
    expect(res.netDuePkr).toBe("150.00");
  });

  it("zeros out surcharge when waived or booking is exempt (Surcharge Remove Policy)", () => {
    const summary = summarizeBookingSurcharges(
      [
        {
          amount: "200000.00",
          paidAmount: "0.00",
          dueDate: new Date("2026-01-01T00:00:00Z"),
          status: "OVERDUE",
        },
      ],
      true, // bookingSurchargeExempt
      new Date("2026-03-01T00:00:00Z"),
    );
    expect(summary.totalNetDuePkr).toBe("0.00");
    expect(parseDecimal(summary.totalWaivedPkr)).toBeGreaterThan(0n);
  });
});
