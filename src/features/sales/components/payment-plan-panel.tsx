"use client";

import * as React from "react";
import { Warning } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormSection } from "@/components/ui/form-section";
import { formatPkr, parseDecimal } from "@/lib/money";
import { cn } from "@/lib/cn";
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
  notes = "",
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

  // Pre-calculate installment amount preview for each frequency option
  const frequencyOptions = React.useMemo(() => {
    const plans: Array<{
      id: PaymentPlan;
      label: string;
      defaultCount: number;
      intervalLabel: string;
    }> = [
      { id: "MONTHLY", label: "Monthly", defaultCount: 36, intervalLabel: "month" },
      { id: "QUARTERLY", label: "Quarterly", defaultCount: 12, intervalLabel: "quarter" },
      { id: "SEMI_ANNUAL", label: "Semi-Annual", defaultCount: 6, intervalLabel: "6 mo" },
    ];

    return plans.map((p) => {
      try {
        const preview = generateSchedule({
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
          plan: p.id,
          installmentCount: plan === p.id ? installmentCount : p.defaultCount,
          startDate: startDate ? new Date(startDate) : new Date(),
        });
        const reg = preview.installments.find((i) => i.type === "REGULAR");
        return {
          ...p,
          count: plan === p.id ? installmentCount : p.defaultCount,
          amountStr: reg ? formatPkr(reg.amountPkr) : "—",
        };
      } catch {
        return {
          ...p,
          count: p.defaultCount,
          amountStr: "—",
        };
      }
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

  return (
    <div className="space-y-6">
      {/* 1. Pricing & Discount Section */}
      <FormSection
        title="Pricing & Discount"
        description="Base list price and applicable promotional discount."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-1 block text-[12px] text-ink-muted">List Price</Label>
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
                <SelectTrigger id="discount-type" className="h-9">
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
                  className="h-9 tabular-nums"
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
                  className="h-9 tabular-nums"
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
                  the {MAX_SALES_DISCOUNT_PERCENT}% sales limit.
                  {!isAdmin && " Requires Administrator authorization."}
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
      </FormSection>

      {/* Reservation Token Deduction Notice */}
      {hasReservationToken && (
        <div className="rounded-[10px] border border-primary/20 bg-primary-soft/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
            <label className="flex cursor-pointer items-center gap-2 rounded-[8px] border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink shadow-xs">
              <Checkbox
                checked={adjustTokenAmount}
                onCheckedChange={(v) => onChange({ adjustTokenAmount: Boolean(v) })}
              />
              <span>Deduct Token from Down Payment</span>
            </label>
          </div>
        </div>
      )}

      {/* 2. Payment Structure Section */}
      <FormSection
        title="Payment Structure"
        description="Down payment, possession milestone, and optional annual balloons."
      >
        <div className="space-y-4">
          {/* Down Payment */}
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
                <SelectTrigger id="down-type" className="h-9">
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
                  className="h-9 tabular-nums"
                />
              ) : (
                <Input
                  id="down-val"
                  value={downPaymentValue}
                  onChange={(e) => onChange({ downPaymentValue: e.target.value })}
                  placeholder="e.g. 25"
                  className="h-9 tabular-nums"
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

          {/* Possession Payment */}
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
                <SelectTrigger id="poss-type" className="h-9">
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
                  className="h-9 tabular-nums"
                />
              ) : (
                <Input
                  id="poss-val"
                  value={possessionValue}
                  onChange={(e) => onChange({ possessionValue: e.target.value })}
                  placeholder="e.g. 15"
                  className="h-9 tabular-nums"
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

          {/* Balloon Payment */}
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
                <SelectTrigger id="balloon-type" className="h-9">
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
                  className="h-9 tabular-nums"
                />
              ) : (
                <Input
                  id="balloon-val"
                  value={balloonValue}
                  onChange={(e) => onChange({ balloonValue: e.target.value })}
                  placeholder="e.g. 10"
                  className="h-9 tabular-nums"
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
        </div>
      </FormSection>

      {/* 3. Payment Frequency & Schedule Section */}
      <FormSection
        title="Payment Frequency"
        description="Choose regular installment intervals and count."
      >
        <div className="space-y-4">
          {/* Radio Cards for Frequency */}
          <div>
            <Label className="mb-2 block text-[12px] text-ink-muted">
              Select Schedule Frequency
            </Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {frequencyOptions.map((opt) => {
                const isSelected = plan === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        plan: opt.id,
                        installmentCount: opt.defaultCount,
                      })
                    }
                    className={cn(
                      "radio relative flex flex-col items-start gap-1 rounded-[10px] border p-3.5 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary-soft/30 shadow-[0_0_0_1px_var(--color-primary)]"
                        : "border-line bg-surface hover:border-line-strong",
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-[13px] font-semibold text-ink">
                        {opt.label}
                      </span>
                      <span
                        className={cn(
                          "size-4 rounded-full border transition-colors",
                          isSelected
                            ? "border-[4.5px] border-primary bg-surface"
                            : "border-line-strong bg-surface",
                        )}
                      />
                    </div>
                    <span className="text-[12.5px] font-semibold text-primary tabular-nums">
                      {opt.count} × {opt.amountStr}
                    </span>
                    <span className="text-[11px] text-ink-muted">
                      Per {opt.intervalLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Installment count and start date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="installment-count" className="mb-1 block text-[12px]">
                Number of Regular Installments
              </Label>
              <Select
                value={installmentCount.toString()}
                onValueChange={(val) => onChange({ installmentCount: Number(val) })}
              >
                <SelectTrigger id="installment-count" className="h-9">
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
                className="h-9"
              />
            </div>
          </div>
        </div>
      </FormSection>

      {/* 4. Down Payment Receipt & Instrument Section */}
      <FormSection
        title="Down Payment Collection"
        description="Payment mode and bank instrument for initial deposit."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="pay-method" className="mb-1 block text-[12px]">
                Payment Method
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => onChange({ paymentMethod: val as PaymentMethod })}
              >
                <SelectTrigger id="pay-method" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
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
                    Instrument / Cheque No
                  </Label>
                  <Input
                    id="cheque-no"
                    value={chequeNo}
                    onChange={(e) => onChange({ chequeNo: e.target.value })}
                    placeholder="e.g. CHQ-987654"
                    className="h-9"
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
                    placeholder="e.g. Meezan Bank"
                    className="h-9"
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <Label htmlFor="booking-notes" className="mb-1 block text-[12px]">
              Notes / Remarks (Optional)
            </Label>
            <Input
              id="booking-notes"
              value={notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="e.g. Client requested payment reminders via SMS"
              className="h-9"
            />
          </div>
        </div>
      </FormSection>
    </div>
  );
}
