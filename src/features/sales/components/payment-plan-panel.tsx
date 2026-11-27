"use client";

import * as React from "react";
import { Warning, Info } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Panel } from "@/components/ui/panel";
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
      <Panel
        title="Pricing & Discount"
        hint="Base list price and applicable promotional discount"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-1.5 block text-[12px] font-medium text-ink-muted">
                List Price
              </Label>
              <div className="flex h-10 items-center rounded-[8px] border border-line bg-subtle/50 px-3 font-sans text-[13.5px] font-semibold text-ink tabular-nums">
                {formatPkr(listPricePkr)}
              </div>
            </div>

            <div>
              <Label
                htmlFor="discount-type"
                className="mb-1.5 block text-[12px] font-medium text-ink"
              >
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
                <SelectTrigger id="discount-type" className="h-10">
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
              <Label
                htmlFor="discount-val"
                className="mb-1.5 block text-[12px] font-medium text-ink"
              >
                Discount Value
              </Label>
              {discountType === "AMOUNT" ? (
                <MoneyInput
                  id="discount-val"
                  disabled={!discountType}
                  value={discountValue}
                  onValueChange={(v) => onChange({ discountValue: v })}
                  placeholder="e.g. 50,000"
                  className="h-10 tabular-nums"
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
                  className="h-10 tabular-nums"
                />
              )}
            </div>
          </div>

          {discountCalc.requiresAdmin && (
            <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-3.5 text-amber-900">
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <Warning weight="fill" className="size-4 shrink-0 text-amber-600" />
                <span>
                  High Discount Warning: {discountCalc.effectivePercent}% discount exceeds
                  the {MAX_SALES_DISCOUNT_PERCENT}% sales limit.
                  {!isAdmin && " Requires Administrator authorization."}
                </span>
              </div>
              <div className="mt-2.5">
                <Label
                  htmlFor="discount-reason"
                  className="text-[12px] font-medium text-amber-950"
                >
                  Discount Approval Reason <span className="text-sold">*</span>
                </Label>
                <Input
                  id="discount-reason"
                  value={discountReason}
                  onChange={(e) => onChange({ discountReason: e.target.value })}
                  placeholder="Explain reason for special concession or approval"
                  className="mt-1 h-10 bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </Panel>

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
      <Panel
        title="Payment Structure"
        hint="Down payment, possession milestone, and optional annual balloons"
      >
        <div className="space-y-4">
          {/* Down Payment */}
          <div className="rounded-[10px] border border-line bg-subtle/30 p-4">
            <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <Label
                  htmlFor="down-type"
                  className="mb-1.5 block text-[12px] font-medium text-ink"
                >
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
                  <SelectTrigger id="down-type" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Percentage (%)</SelectItem>
                    <SelectItem value="AMOUNT">Fixed Amount (PKR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-4">
                <Label
                  htmlFor="down-val"
                  className="mb-1.5 block text-[12px] font-medium text-ink"
                >
                  Down Payment {downPaymentType === "PERCENT" ? "(%)" : "(PKR)"}{" "}
                  <span className="text-sold">*</span>
                </Label>
                {downPaymentType === "AMOUNT" ? (
                  <MoneyInput
                    id="down-val"
                    value={downPaymentValue}
                    onValueChange={(v) => onChange({ downPaymentValue: v })}
                    placeholder="e.g. 25,00,000"
                    className="h-10 tabular-nums"
                  />
                ) : (
                  <Input
                    id="down-val"
                    value={downPaymentValue}
                    onChange={(e) => onChange({ downPaymentValue: e.target.value })}
                    placeholder="e.g. 25"
                    className="h-10 tabular-nums"
                  />
                )}
              </div>

              <div className="sm:col-span-4">
                <div className="flex h-[60px] flex-col justify-center rounded-[8px] border border-line/60 bg-surface px-3.5 py-2">
                  <span className="text-[11px] font-medium text-ink-muted">
                    Computed Down Payment
                  </span>
                  <span className="text-[14px] font-bold text-primary tabular-nums">
                    {formatPkr(schedule.downPaymentPkr)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Possession Payment */}
          <div className="rounded-[10px] border border-line bg-subtle/30 p-4">
            <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <Label
                  htmlFor="poss-type"
                  className="mb-1.5 block text-[12px] font-medium text-ink"
                >
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
                  <SelectTrigger id="poss-type" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Percentage (%)</SelectItem>
                    <SelectItem value="AMOUNT">Fixed Amount (PKR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-4">
                <Label
                  htmlFor="poss-val"
                  className="mb-1.5 block text-[12px] font-medium text-ink"
                >
                  Possession {possessionType === "PERCENT" ? "(%)" : "(PKR)"}{" "}
                  <span className="text-sold">*</span>
                </Label>
                {possessionType === "AMOUNT" ? (
                  <MoneyInput
                    id="poss-val"
                    value={possessionValue}
                    onValueChange={(v) => onChange({ possessionValue: v })}
                    placeholder="e.g. 15,00,000"
                    className="h-10 tabular-nums"
                  />
                ) : (
                  <Input
                    id="poss-val"
                    value={possessionValue}
                    onChange={(e) => onChange({ possessionValue: e.target.value })}
                    placeholder="e.g. 15"
                    className="h-10 tabular-nums"
                  />
                )}
              </div>

              <div className="sm:col-span-4">
                <div className="flex h-[60px] flex-col justify-center rounded-[8px] border border-line/60 bg-surface px-3.5 py-2">
                  <span className="text-[11px] font-medium text-ink-muted">
                    Computed Possession
                  </span>
                  <span className="text-[14px] font-bold text-ink tabular-nums">
                    {formatPkr(schedule.possessionAmountPkr)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Balloon Payment */}
          <div className="rounded-[10px] border border-line bg-subtle/30 p-4">
            <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <Label
                  htmlFor="balloon-type"
                  className="mb-1.5 block text-[12px] font-medium text-ink"
                >
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
                  <SelectTrigger id="balloon-type" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Remaining Balance (%)</SelectItem>
                    <SelectItem value="AMOUNT">Total Fixed Amount (PKR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-4">
                <Label
                  htmlFor="balloon-val"
                  className="mb-1.5 block text-[12px] font-medium text-ink"
                >
                  {balloonType === "PERCENT"
                    ? "Balloon Payment %"
                    : "Balloon Payment (PKR)"}
                </Label>
                {balloonType === "AMOUNT" ? (
                  <MoneyInput
                    id="balloon-val"
                    value={balloonValue}
                    onValueChange={(v) => onChange({ balloonValue: v })}
                    placeholder="e.g. 18,00,000"
                    className="h-10 tabular-nums"
                  />
                ) : (
                  <Input
                    id="balloon-val"
                    value={balloonValue}
                    onChange={(e) => onChange({ balloonValue: e.target.value })}
                    placeholder="e.g. 10"
                    className="h-10 tabular-nums"
                  />
                )}
              </div>

              <div className="sm:col-span-4">
                <div className="flex h-[60px] flex-col justify-center rounded-[8px] border border-line/60 bg-surface px-3.5 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-ink-muted">
                      Computed Balloon
                    </span>
                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="Balloon details"
                            className="inline-flex cursor-pointer items-center justify-center text-ink-muted hover:text-ink focus:outline-none"
                          >
                            <Info className="size-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="flex flex-col items-start gap-1 p-2.5 text-[11.5px] leading-snug">
                          <span className="font-medium text-white/90">
                            Divided Annually ({schedule.balloonCount} ×{" "}
                            {formatPkr(schedule.balloonAmountPerYearPkr)})
                          </span>
                          <span className="font-bold text-white tabular-nums">
                            {formatPkr(schedule.balloonTotalAmountPkr)}
                          </span>
                          <span className="text-white/80 tabular-nums">
                            {schedule.balloonPercent}% of remaining (
                            {schedule.balloonPercentPerYear}% / yr)
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-[14px] font-bold text-ink tabular-nums">
                    {formatPkr(schedule.balloonTotalAmountPkr)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!schedule.isValid && schedule.validationError && (
            <div className="flex items-center gap-2 rounded-[8px] border border-sold/30 bg-sold/10 p-3 text-[12px] font-medium text-sold">
              <Warning weight="fill" className="size-4 shrink-0" />
              <span>{schedule.validationError}</span>
            </div>
          )}
        </div>
      </Panel>

      {/* 3. Payment Frequency & Schedule Section */}
      <Panel
        title="Payment Frequency & Schedule"
        hint="Choose regular installment intervals and count"
      >
        <div className="space-y-4">
          {/* Radio Cards for Frequency */}
          <div>
            <Label className="mb-2 block text-[12px] font-medium text-ink-muted">
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
                    <span className="text-[13px] font-semibold text-primary tabular-nums">
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
          <div className="grid grid-cols-1 gap-4 border-t border-line/60 pt-3 sm:grid-cols-2">
            <div>
              <Label
                htmlFor="installment-count"
                className="mb-1.5 block text-[12px] font-medium text-ink"
              >
                Number of Regular Installments
              </Label>
              <Select
                value={installmentCount.toString()}
                onValueChange={(val) => onChange({ installmentCount: Number(val) })}
              >
                <SelectTrigger id="installment-count" className="h-10">
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
              <Label
                htmlFor="start-date"
                className="mb-1.5 block text-[12px] font-medium text-ink"
              >
                First Due Date
              </Label>
              <DatePicker
                id="start-date"
                value={startDate}
                onChange={(val) => onChange({ startDate: val })}
                triggerClassName="h-10"
              />
            </div>
          </div>
        </div>
      </Panel>

      {/* 4. Down Payment Receipt & Instrument Section */}
      <Panel
        title="Down Payment Collection"
        hint="Payment mode and bank instrument for initial deposit"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label
                htmlFor="pay-method"
                className="mb-1.5 block text-[12px] font-medium text-ink"
              >
                Payment Method
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => onChange({ paymentMethod: val as PaymentMethod })}
              >
                <SelectTrigger id="pay-method" className="h-10">
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
                  <Label
                    htmlFor="cheque-no"
                    className="mb-1.5 block text-[12px] font-medium text-ink"
                  >
                    Instrument / Cheque No
                  </Label>
                  <Input
                    id="cheque-no"
                    value={chequeNo}
                    onChange={(e) => onChange({ chequeNo: e.target.value })}
                    placeholder="e.g. CHQ-987654"
                    className="h-10"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="bank-name"
                    className="mb-1.5 block text-[12px] font-medium text-ink"
                  >
                    Bank Name &amp; Branch
                  </Label>
                  <Input
                    id="bank-name"
                    value={bank}
                    onChange={(e) => onChange({ bank: e.target.value })}
                    placeholder="e.g. Meezan Bank"
                    className="h-10"
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <Label
              htmlFor="booking-notes"
              className="mb-1.5 block text-[12px] font-medium text-ink"
            >
              Notes / Remarks (Optional)
            </Label>
            <Input
              id="booking-notes"
              value={notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="e.g. Client requested payment reminders via SMS"
              className="h-10"
            />
          </div>
        </div>
      </Panel>
    </div>
  );
}
