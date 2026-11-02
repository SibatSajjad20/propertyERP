/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { Warning, Check, Calculator } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPkr, formatPkrCompact } from "@/lib/money";
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

interface PaymentPlanPanelProps {
  listPricePkr: string;
  role?: UserRole;
  discountType?: DiscountType | "";
  discountValue: string;
  discountReason: string;
  downPaymentPkr: string;
  possessionAmountPkr: string;
  plan: PaymentPlan;
  installmentCount: number;
  startDate: string;
  paymentMethod: PaymentMethod;
  chequeNo?: string;
  bank?: string;
  notes?: string;
  onChange: (
    fields: Partial<{
      discountType: DiscountType | "";
      discountValue: string;
      discountReason: string;
      downPaymentPkr: string;
      possessionAmountPkr: string;
      plan: PaymentPlan;
      installmentCount: number;
      startDate: string;
      paymentMethod: PaymentMethod;
      chequeNo: string;
      bank: string;
      notes: string;
    }>,
  ) => void;
}

export function PaymentPlanPanel({
  listPricePkr,
  role = "SALES",
  discountType,
  discountValue,
  discountReason,
  downPaymentPkr,
  possessionAmountPkr,
  plan,
  installmentCount,
  startDate,
  paymentMethod,
  chequeNo = "",
  bank = "",
  notes = "",
  onChange,
}: PaymentPlanPanelProps) {
  // Live schedule computation
  const schedule: PaymentSchedule = React.useMemo(() => {
    return generateSchedule({
      listPricePkr,
      discountType: discountType || null,
      discountValue: discountValue || null,
      downPaymentPkr: downPaymentPkr || "0",
      possessionAmountPkr: possessionAmountPkr || "0",
      plan,
      installmentCount: installmentCount || 1,
      startDate: startDate ? new Date(startDate) : new Date(),
    });
  }, [
    listPricePkr,
    discountType,
    discountValue,
    downPaymentPkr,
    possessionAmountPkr,
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
          <h3 className="text-[14px] font-semibold text-ink">Pricing & Discount</h3>

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
                  onChange={(e) => onChange({ discountValue: e.target.value })}
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

          {/* Discount warning or reason */}
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

        {/* Payment Plan Config Card */}
        <div className="card space-y-4 p-5">
          <h3 className="text-[14px] font-semibold text-ink">Payment Structure</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="down-payment" className="mb-1 block text-[12px]">
                Down Payment (PKR) <span className="text-sold">*</span>
              </Label>
              <MoneyInput
                id="down-payment"
                value={downPaymentPkr}
                onChange={(e) => onChange({ downPaymentPkr: e.target.value })}
                placeholder="e.g. 5,00,000"
                className="tabular-nums"
              />
              <span className="text-[11px] text-ink-muted">
                Initial deposit received upon booking confirmation.
              </span>
            </div>

            <div>
              <Label htmlFor="possession-amount" className="mb-1 block text-[12px]">
                Possession Amount (Optional)
              </Label>
              <MoneyInput
                id="possession-amount"
                value={possessionAmountPkr}
                onChange={(e) => onChange({ possessionAmountPkr: e.target.value })}
                placeholder="e.g. 2,00,000"
                className="tabular-nums"
              />
              <span className="text-[11px] text-ink-muted">
                Amount payable on key handover/possession.
              </span>
            </div>
          </div>

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
                Number of Installments
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
                    <SelectItem value="BANK_TRANSFER">
                      Bank Transfer / Pay Order
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(paymentMethod === "CHEQUE" || paymentMethod === "BANK_TRANSFER") && (
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
                      Bank Name & Branch
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

        {/* Live Installments Schedule Table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-subtle/40 px-4 py-2.5">
            <div>
              <h4 className="text-[13px] font-semibold text-ink">Installment Schedule</h4>
              <p className="text-[11px] text-ink-muted">
                Rounded to nearest Rs 100 with remainder on the final installment.
              </p>
            </div>
            <span className="font-mono text-[11px] text-ink-muted">
              {schedule.installments.length} installments
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto">
            <table className="w-full border-collapse text-left text-[12px]">
              <thead className="sticky top-0 border-b border-line bg-surface text-ink-muted select-none">
                <tr>
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Due Date</th>
                  <th className="px-4 py-2 text-right font-medium">Installment Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {schedule.installments.map((inst) => (
                  <tr key={inst.seq} className="hover:bg-subtle/30">
                    <td className="px-4 py-2 text-ink-muted">Inst. {inst.seq}</td>
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
              <span className="text-ink-muted">Down Payment</span>
              <span className="font-medium text-ink tabular-nums">
                {formatPkr(schedule.downPaymentPkr)}
              </span>
            </div>

            {schedule.possessionAmountPkr !== "0.00" && (
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Possession Due</span>
                <span className="font-medium text-ink tabular-nums">
                  {formatPkr(schedule.possessionAmountPkr)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Installments Total</span>
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
              {/* Progress bar */}
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
