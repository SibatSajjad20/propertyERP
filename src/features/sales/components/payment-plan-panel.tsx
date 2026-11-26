"use client";

import * as React from "react";
import { Warning, Calculator } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPkr, parseDecimal } from "@/lib/money";
import type {
  PaymentPlan,
  DiscountType,
  PaymentMethod,
  UserRole,
} from "@/db/schema/enums";
import {
  calculateDiscount,
  generateSchedule,
  MAX_SALES_DISCOUNT_PERCENT,
  type PaymentSchedule,
} from "../calculator";

export interface PaymentPlanStateFields {
  discountType: DiscountType | "";
  discountValue: string;
  discountReason: string;
  downPaymentType: DiscountType;
  downPaymentValue: string;
  possessionType: DiscountType;
  possessionValue: string;
  balloonType: DiscountType;
  balloonValue: string;
  adjustTokenAmount: boolean;
  plan: PaymentPlan;
  installmentCount: number;
  startDate: string;
  paymentMethod: PaymentMethod;
  chequeNo: string;
  bank: string;
  notes: string;
}

interface PaymentPlanPanelProps {
  listPricePkr: string;
  role?: UserRole;
  discountType?: DiscountType | "";
  discountValue: string;
  discountReason: string;
  downPaymentType: DiscountType;
  downPaymentValue: string;
  possessionType: DiscountType;
  possessionValue: string;
  balloonType: DiscountType;
  balloonValue: string;
  reservationTokenAmount?: string;
  reservationTokenReceiptNo?: string;
  adjustTokenAmount?: boolean;
  plan: PaymentPlan;
  installmentCount: number;
  startDate: string;
  paymentMethod: PaymentMethod;
  chequeNo?: string;
  bank?: string;
  notes?: string;
  onChange: (fields: Partial<PaymentPlanStateFields>) => void;
}

export function PaymentPlanPanel({
  listPricePkr,
  role = "SALES",
  discountType,
  discountValue,
  discountReason,
  downPaymentType,
  downPaymentValue,
  possessionType,
  possessionValue,
  balloonType,
  balloonValue,
  reservationTokenAmount = "0",
  reservationTokenReceiptNo,
  adjustTokenAmount = true,
  plan,
  installmentCount,
  startDate,
  paymentMethod,
  chequeNo = "",
  bank = "",
  onChange,
}: PaymentPlanPanelProps) {
  const hasReservationToken = React.useMemo(() => {
    try {
      return parseDecimal(reservationTokenAmount || "0") > 0n;
    } catch {
      return false;
    }
  }, [reservationTokenAmount]);

  // Live schedule computation
  const schedule: PaymentSchedule = React.useMemo(() => {
    return generateSchedule({
      listPricePkr,
      discountType: discountType || null,
      discountValue: discountValue || null,
      downPaymentType,
      downPaymentValue: downPaymentValue || "0",
      possessionType,
      possessionValue: possessionValue || "0",
      balloonType,
      balloonValue: balloonValue || "0",
      tokenAdjustedPkr:
        hasReservationToken && adjustTokenAmount ? reservationTokenAmount : "0",
      plan,
      installmentCount: installmentCount || 1,
      startDate: startDate ? new Date(startDate) : new Date(),
    });
  }, [
    listPricePkr,
    discountType,
    discountValue,
    downPaymentType,
    downPaymentValue,
    possessionType,
    possessionValue,
    balloonType,
    balloonValue,
    hasReservationToken,
    adjustTokenAmount,
    reservationTokenAmount,
    plan,
    installmentCount,
    startDate,
  ]);

  const discountCalc = React.useMemo(() => {
    return calculateDiscount(listPricePkr, discountType || null, discountValue || null);
  }, [listPricePkr, discountType, discountValue]);

  const isAdmin = role === "ADMIN";
  const needsAdminDiscountApproval = discountCalc.requiresAdmin && !isAdmin;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Column: Form & Schedule Table (8 cols) */}
      <div className="space-y-6 lg:col-span-8">
        {/* Financial Inputs Card */}
        <div className="card space-y-4 p-5">
          <h3 className="text-[14px] font-semibold text-ink">Pricing &amp; Discount</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-1 block text-[12px]">List / Asking Price</Label>
              <div className="flex h-9 items-center rounded-[8px] border border-line bg-subtle/50 px-3 font-sans font-semibold text-ink tabular-nums">
                {formatPkr(listPricePkr)}
              </div>
            </div>

            <div>
              <Label htmlFor="discount-type" className="mb-1 block text-[12px]">
                Discount Type
              </Label>
              <Select
                value={discountType || "NONE"}
                onValueChange={(val) =>
                  onChange({
                    discountType: val === "NONE" ? "" : (val as DiscountType),
                    discountValue: val === "NONE" ? "" : discountValue,
                  })
                }
              >
                <SelectTrigger id="discount-type">
                  <SelectValue placeholder="No discount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No discount</SelectItem>
                  <SelectItem value="PERCENT">Percentage (%)</SelectItem>
                  <SelectItem value="AMOUNT">Fixed Amount (PKR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="discount-val" className="mb-1 block text-[12px]">
                Discount Value
              </Label>
              {discountType === "AMOUNT" ? (
                <MoneyInput
                  id="discount-val"
                  disabled={!discountType}
                  value={discountValue}
                  onValueChange={(v) => onChange({ discountValue: v })}
                  placeholder="e.g. 50,000"
                  className="tabular-nums"
                />
              ) : (
                <Input
                  id="discount-val"
                  disabled={!discountType}
                  value={discountValue}
                  onChange={(e) => onChange({ discountValue: e.target.value })}
                  placeholder={
                    discountType === "PERCENT" ? "e.g. 5.00" : "Select type first"
                  }
                  className="tabular-nums"
                />
              )}
            </div>
          </div>

          {discountCalc.requiresAdmin && (
            <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <Warning weight="fill" className="size-4 shrink-0 text-amber-600" />
                <span>
                  High Discount Warning: {discountCalc.effectivePercent}% discount exceeds
                  the {MAX_SALES_DISCOUNT_PERCENT}% sales limit. Requires Administrator
                  authorization.
                </span>
              </div>
              <div className="mt-2">
                <Label htmlFor="discount-reason" className="text-[12px] text-amber-950">
                  Discount Approval Reason <span className="text-sold">*</span>
                </Label>
                <Input
                  id="discount-reason"
                  value={discountReason}
                  onChange={(e) => onChange({ discountReason: e.target.value })}
                  placeholder="Explain reason for special concession or approval"
                  className="mt-1 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Reservation Token Deduction Notice */}
        {hasReservationToken && (
          <div className="card space-y-3 border-primary/30 bg-primary-soft/25 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-[13px] font-semibold text-primary">
                  Reservation Token Recorded
                </h4>
                <p className="text-[12px] text-ink-muted">
                  Token of{" "}
                  <strong className="text-ink tabular-nums">
                    {formatPkr(reservationTokenAmount)}
                  </strong>{" "}
                  {reservationTokenReceiptNo
                    ? `(Receipt ${reservationTokenReceiptNo})`
                    : ""}{" "}
                  was collected on reservation.
                </p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-[8px] border border-primary/30 bg-surface px-3 py-2 text-[12px] font-medium text-ink">
                <Checkbox
                  checked={adjustTokenAmount}
                  onCheckedChange={(v) => onChange({ adjustTokenAmount: Boolean(v) })}
                />
                <span>Deduct Token from Down Payment</span>
              </label>
            </div>
          </div>
        )}

        {/* Payment Plan Config Card */}
        <div className="card space-y-5 p-5">
          <h3 className="text-[14px] font-semibold text-ink">Payment Structure</h3>

          {/* 1. Down Payment (% or Fixed PKR) — Required */}
          <div className="grid grid-cols-1 gap-3 rounded-[8px] border border-line bg-subtle/25 p-3.5 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <Label htmlFor="down-type" className="mb-1 block text-[12px]">
                Down Payment Type <span className="text-sold">*</span>
              </Label>
              <Select
                value={downPaymentType}
                onValueChange={(val) =>
                  onChange({
                    downPaymentType: val as DiscountType,
                    downPaymentValue:
                      val === "PERCENT"
                        ? String(schedule.downPaymentPercent || 25)
                        : schedule.downPaymentPkr,
                  })
                }
              >
                <SelectTrigger id="down-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Percentage (%)</SelectItem>
                  <SelectItem value="AMOUNT">Fixed Amount (PKR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-4">
              <Label htmlFor="down-val" className="mb-1 block text-[12px]">
                Down Payment {downPaymentType === "PERCENT" ? "(%)" : "(PKR)"}{" "}
                <span className="text-sold">*</span>
              </Label>
              {downPaymentType === "AMOUNT" ? (
                <MoneyInput
                  id="down-val"
                  value={downPaymentValue}
                  onValueChange={(v) => onChange({ downPaymentValue: v })}
                  placeholder="e.g. 25,00,000"
                  className="tabular-nums"
                />
              ) : (
                <Input
                  id="down-val"
                  value={downPaymentValue}
                  onChange={(e) => onChange({ downPaymentValue: e.target.value })}
                  placeholder="e.g. 25"
                  className="tabular-nums"
                />
              )}
            </div>
            <div className="flex flex-col justify-center sm:col-span-4">
              <span className="text-[11px] text-ink-muted">Computed Down Payment</span>
              <span className="text-[14px] font-semibold text-primary tabular-nums">
                {formatPkr(schedule.downPaymentPkr)}
              </span>
              <span className="text-[11px] text-ink-muted tabular-nums">
                {schedule.downPaymentPercent}% of Net Price
              </span>
            </div>
          </div>

          {/* 2. Possession Payment (% or Fixed PKR) — NOT Optional, default 15% */}
          <div className="grid grid-cols-1 gap-3 rounded-[8px] border border-line bg-subtle/25 p-3.5 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <Label htmlFor="poss-type" className="mb-1 block text-[12px]">
                Possession Payment Type <span className="text-sold">*</span>
              </Label>
              <Select
                value={possessionType}
                onValueChange={(val) =>
                  onChange({
                    possessionType: val as DiscountType,
                    possessionValue:
                      val === "PERCENT"
                        ? String(schedule.possessionPercent || 15)
                        : schedule.possessionAmountPkr,
                  })
                }
              >
                <SelectTrigger id="poss-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Percentage (%)</SelectItem>
                  <SelectItem value="AMOUNT">Fixed Amount (PKR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-4">
              <Label htmlFor="poss-val" className="mb-1 block text-[12px]">
                Possession {possessionType === "PERCENT" ? "(%)" : "(PKR)"}{" "}
                <span className="text-sold">*</span>
              </Label>
              {possessionType === "AMOUNT" ? (
                <MoneyInput
                  id="poss-val"
                  value={possessionValue}
                  onValueChange={(v) => onChange({ possessionValue: v })}
                  placeholder="e.g. 15,00,000"
                  className="tabular-nums"
                />
              ) : (
                <Input
                  id="poss-val"
                  value={possessionValue}
                  onChange={(e) => onChange({ possessionValue: e.target.value })}
                  placeholder="e.g. 15"
                  className="tabular-nums"
                />
              )}
            </div>
            <div className="flex flex-col justify-center sm:col-span-4">
              <span className="text-[11px] text-ink-muted">Computed Possession</span>
              <span className="text-[14px] font-semibold text-ink tabular-nums">
                {formatPkr(schedule.possessionAmountPkr)}
              </span>
              <span className="text-[11px] text-ink-muted tabular-nums">
                {schedule.possessionPercent}% · Payable on handover (required)
              </span>
            </div>
          </div>

          {/* 3. Balloon Payment (% of remaining balance or Fixed PKR) — divided across years */}
          <div className="grid grid-cols-1 gap-3 rounded-[8px] border border-line bg-subtle/25 p-3.5 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <Label htmlFor="balloon-type" className="mb-1 block text-[12px]">
                Balloon Payment Type
              </Label>
              <Select
                value={balloonType}
                onValueChange={(val) =>
                  onChange({
                    balloonType: val as DiscountType,
                    balloonValue:
                      val === "PERCENT"
                        ? String(schedule.balloonPercent || 10)
                        : schedule.balloonTotalAmountPkr,
                  })
                }
              >
                <SelectTrigger id="balloon-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Remaining Balance (%)</SelectItem>
                  <SelectItem value="AMOUNT">Total Fixed Amount (PKR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-4">
              <Label htmlFor="balloon-val" className="mb-1 block text-[12px]">
                Balloon Payment{" "}
                {balloonType === "PERCENT" ? "(% of remaining balance)" : "(PKR)"}
              </Label>
              {balloonType === "AMOUNT" ? (
                <MoneyInput
                  id="balloon-val"
                  value={balloonValue}
                  onValueChange={(v) => onChange({ balloonValue: v })}
                  placeholder="e.g. 18,000"
                  className="tabular-nums"
                />
              ) : (
                <Input
                  id="balloon-val"
                  value={balloonValue}
                  onChange={(e) => onChange({ balloonValue: e.target.value })}
                  placeholder="e.g. 10"
                  className="tabular-nums"
                />
              )}
            </div>
            <div className="flex flex-col justify-center sm:col-span-4">
              <span className="text-[11px] text-ink-muted">
                Divided Annually ({schedule.balloonCount} ×{" "}
                {formatPkr(schedule.balloonAmountPerYearPkr)})
              </span>
              <span className="text-[14px] font-semibold text-ink tabular-nums">
                {formatPkr(schedule.balloonTotalAmountPkr)}
              </span>
              <span className="text-[11px] text-ink-muted tabular-nums">
                {schedule.balloonPercent}% of remaining balance (
                {schedule.balloonPercentPerYear}% / yr)
              </span>
            </div>
          </div>

          {!schedule.isValid && schedule.validationError && (
            <div className="flex items-center gap-2 rounded-[8px] border border-sold/30 bg-sold/10 p-3 text-[12px] font-medium text-sold">
              <Warning weight="fill" className="size-4 shrink-0" />
              <span>{schedule.validationError}</span>
            </div>
          )}

          {/* Frequency, Installment Count, Start Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="plan-interval" className="mb-1 block text-[12px]">
                Payment Frequency
              </Label>
              <Select
                value={plan}
                onValueChange={(val) => onChange({ plan: val as PaymentPlan })}
              >
                <SelectTrigger id="plan-interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly (3 mo)</SelectItem>
                  <SelectItem value="SEMI_ANNUAL">Semi-Annual (6 mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="installment-count" className="mb-1 block text-[12px]">
                Number of Regular Installments
              </Label>
              <Select
                value={installmentCount.toString()}
                onValueChange={(val) => onChange({ installmentCount: Number(val) })}
              >
                <SelectTrigger id="installment-count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 6, 12, 18, 24, 30, 36, 48, 60].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} installments
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date" className="mb-1 block text-[12px]">
                First Due Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => onChange({ startDate: e.target.value })}
              />
            </div>
          </div>

          {/* Payment Method for Down Payment */}
          <div className="border-t border-line/60 pt-3">
            <h4 className="text-[13px] font-medium text-ink">
              Down Payment Collection Method
            </h4>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="pay-method" className="mb-1 block text-[12px]">
                  Method
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(val) =>
                    onChange({ paymentMethod: val as PaymentMethod })
                  }
                >
                  <SelectTrigger id="pay-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Online</SelectItem>
                    <SelectItem value="PAY_ORDER">Pay Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(paymentMethod === "CHEQUE" ||
                paymentMethod === "BANK_TRANSFER" ||
                paymentMethod === "PAY_ORDER") && (
                <>
                  <div>
                    <Label htmlFor="cheque-no" className="mb-1 block text-[12px]">
                      Cheque / Instrument No
                    </Label>
                    <Input
                      id="cheque-no"
                      value={chequeNo}
                      onChange={(e) => onChange({ chequeNo: e.target.value })}
                      placeholder="e.g. CHQ-987654"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bank-name" className="mb-1 block text-[12px]">
                      Bank Name &amp; Branch
                    </Label>
                    <Input
                      id="bank-name"
                      value={bank}
                      onChange={(e) => onChange({ bank: e.target.value })}
                      placeholder="e.g. HBL Blue Area"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Schedule Table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-subtle/40 px-4 py-2.5">
            <div>
              <h4 className="text-[13px] font-semibold text-ink">
                Complete Payment Schedule
              </h4>
              <p className="text-[11px] text-ink-muted">
                Includes regular installments (rounded to Rs 100), annual balloon
                payments, and possession payment.
              </p>
            </div>
            <span className="font-sans text-[11px] text-ink-muted tabular-nums">
              {schedule.installments.length} entries
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            <table className="w-full border-collapse text-left text-[12px]">
              <thead className="sticky top-0 border-b border-line bg-surface text-ink-muted select-none">
                <tr>
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Payment Item</th>
                  <th className="px-4 py-2 font-medium">Due Date</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {schedule.installments.map((inst) => (
                  <tr
                    key={`${inst.seq}-${inst.type}`}
                    className={
                      inst.type === "BALLOON"
                        ? "bg-amber-50/50 hover:bg-amber-50"
                        : inst.type === "POSSESSION"
                          ? "bg-primary-soft/30 hover:bg-primary-soft/50"
                          : "hover:bg-subtle/30"
                    }
                  >
                    <td className="px-4 py-2 font-sans text-[11px] text-ink-muted tabular-nums">
                      {inst.seq}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{inst.label}</span>
                        {inst.type === "BALLOON" && (
                          <Badge tone="accent">Annual Balloon</Badge>
                        )}
                        {inst.type === "POSSESSION" && (
                          <Badge tone="primary">Possession</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 font-sans text-ink tabular-nums">
                      {inst.dueDate.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2 text-right font-sans font-medium text-ink tabular-nums">
                      {formatPkr(inst.amountPkr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Sticky Summary Panel (4 cols) */}
      <div className="lg:col-span-4">
        <div className="card sticky top-20 space-y-4 p-5 shadow-card">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <div className="flex items-center gap-2">
              <Calculator weight="light" className="size-4 text-primary" />
              <h4 className="text-[14px] font-semibold text-ink">Financial Summary</h4>
            </div>
            <span className="text-[11px] font-medium text-ink-muted uppercase">Live</span>
          </div>

          <div className="space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">List Price</span>
              <span className="font-medium text-ink tabular-nums">
                {formatPkr(schedule.listPricePkr)}
              </span>
            </div>

            {discountCalc.discountAmountPkr !== "0.00" && (
              <div className="flex items-center justify-between text-available">
                <span>Discount ({discountCalc.effectivePercent}%)</span>
                <span className="font-medium tabular-nums">
                  - {formatPkr(discountCalc.discountAmountPkr)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-line/60 pt-2 text-[14px] font-bold text-ink">
              <span>Net Price</span>
              <span className="text-primary tabular-nums">
                {formatPkr(schedule.netPricePkr)}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-line/60 pt-2">
              <span className="text-ink-muted">
                Down Payment ({schedule.downPaymentPercent}%)
              </span>
              <span className="font-medium text-ink tabular-nums">
                {formatPkr(schedule.downPaymentPkr)}
              </span>
            </div>

            {schedule.tokenAdjustedPkr !== "0.00" && (
              <>
                <div className="flex items-center justify-between text-available">
                  <span>Less: Reservation Token</span>
                  <span className="font-medium tabular-nums">
                    - {formatPkr(schedule.tokenAdjustedPkr)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-[6px] bg-primary-soft/50 px-2.5 py-1.5 text-[12px] font-semibold text-primary">
                  <span>Payable Down Payment Now</span>
                  <span className="tabular-nums">
                    {formatPkr(schedule.payableDownPaymentNowPkr)}
                  </span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <span className="text-ink-muted">
                Annual Balloons ({schedule.balloonPercent}%)
              </span>
              <span className="font-medium text-ink tabular-nums">
                {formatPkr(schedule.balloonTotalAmountPkr)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-ink-muted">
                Possession ({schedule.possessionPercent}%)
              </span>
              <span className="font-medium text-ink tabular-nums">
                {formatPkr(schedule.possessionAmountPkr)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Regular Installments</span>
              <span className="font-medium text-ink tabular-nums">
                {formatPkr(schedule.totalInstallmentsPkr)}
              </span>
            </div>

            <div className="border-t border-line/60 pt-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-ink-muted">Booked / Paid</span>
                <span className="font-semibold text-ink tabular-nums">
                  {schedule.paidPercent}%
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-subtle">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${schedule.paidPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-[8px] bg-subtle/80 p-2.5">
              <span className="text-[12px] font-medium text-ink-muted">
                Remaining Balance
              </span>
              <span className="font-sans text-[14px] font-bold text-ink tabular-nums">
                {formatPkr(schedule.remainingBalancePkr)}
              </span>
            </div>
          </div>

          {needsAdminDiscountApproval && (
            <div className="rounded-[6px] bg-sold/10 p-2 text-center text-[11px] font-medium text-sold">
              Discount exceeds limit — requires Admin credentials to finalize.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
