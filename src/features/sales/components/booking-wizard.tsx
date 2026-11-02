/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  CurrencyDollar,
  Receipt,
  User,
  Users,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { formatPkr } from "@/lib/money";
import { cn } from "@/lib/cn";
import { toast } from "sonner";
import type {
  UserRole,
  PaymentPlan,
  DiscountType,
  PaymentMethod,
} from "@/db/schema/enums";
import { createBooking } from "../actions";
import { CNIC_REGEX, formatCnic, type ClientInput, type NextOfKinInput } from "../schema";
import { ClientForm } from "./client-form";
import { PaymentPlanPanel } from "./payment-plan-panel";
import { UnitSelector, type SelectableUnit } from "./unit-selector";
import { calculateDiscount, generateSchedule } from "../calculator";

interface BookingWizardProps {
  units: SelectableUnit[];
  floors: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  role: UserRole;
  preselectedUnitId?: string;
  preselectedClientId?: string;
  reservationId?: string;
  initialClient?: ClientInput;
  initialNextOfKin?: NextOfKinInput;
}

const STEPS = [
  { id: 1, label: "Unit Selection", icon: Receipt },
  { id: 2, label: "Payment Plan", icon: CurrencyDollar },
  { id: 3, label: "Client Details", icon: User },
  { id: 4, label: "Next of Kin", icon: Users },
  { id: 5, label: "Review & Confirm", icon: CheckCircle },
];

export function BookingWizard({
  units,
  floors,
  categories,
  role,
  preselectedUnitId,
  preselectedClientId,
  reservationId,
  initialClient,
  initialNextOfKin,
}: BookingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(preselectedUnitId ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [selectedUnit, setSelectedUnit] = React.useState<SelectableUnit | null>(() => {
    return units.find((u) => u.id === preselectedUnitId) ?? null;
  });

  const [paymentState, setPaymentState] = React.useState({
    discountType: "" as DiscountType | "",
    discountValue: "",
    discountReason: "",
    downPaymentPkr: "",
    possessionAmountPkr: "",
    plan: "MONTHLY" as PaymentPlan,
    installmentCount: 12,
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    paymentMethod: "CASH" as PaymentMethod,
    chequeNo: "",
    bank: "",
    notes: "",
  });

  const [client, setClient] = React.useState<ClientInput>(
    () =>
      initialClient ?? {
        fullName: "",
        cnic: "",
        phone: "",
        email: "",
        homeAddress: "",
        postalAddress: "",
      },
  );

  const [nextOfKin, setNextOfKin] = React.useState<NextOfKinInput>(
    () =>
      initialNextOfKin ?? {
        name: "",
        relation: "",
        cnic: "",
        phone: "",
        address: "",
      },
  );

  // Automatically set default down payment when unit is selected
  React.useEffect(() => {
    if (selectedUnit && !paymentState.downPaymentPkr) {
      const price = selectedUnit.computedPricePkr || "0";
      // Default down payment e.g. 20%
      const rawPrice = Number(price);
      if (!isNaN(rawPrice) && rawPrice > 0) {
        const twentyPercent = Math.round((rawPrice * 0.2) / 100) * 100;
        setPaymentState((prev) => ({
          ...prev,
          downPaymentPkr: twentyPercent.toString(),
        }));
      }
    }
  }, [selectedUnit]);

  // Validation per step
  const canProceedStep1 = Boolean(selectedUnit);
  const canProceedStep2 = Boolean(
    paymentState.downPaymentPkr &&
    Number(paymentState.downPaymentPkr) > 0 &&
    paymentState.installmentCount > 0,
  );

  const isClientCnicValid = CNIC_REGEX.test(formatCnic(client.cnic));
  const isKinCnicValid =
    !nextOfKin.cnic?.trim() || CNIC_REGEX.test(formatCnic(nextOfKin.cnic));

  const canProceedStep3 = Boolean(
    client.fullName.trim() &&
    isClientCnicValid &&
    client.phone.trim() &&
    client.homeAddress.trim() &&
    client.postalAddress.trim(),
  );
  const canProceedStep4 = Boolean(
    !nextOfKin.name.trim() ||
    (nextOfKin.name.trim() &&
      nextOfKin.relation.trim() &&
      nextOfKin.phone.trim() &&
      isKinCnicValid),
  );

  function nextStep() {
    if (currentStep === 1 && !canProceedStep1) {
      toast.error("Please select a unit to proceed");
      return;
    }
    if (currentStep === 2 && !canProceedStep2) {
      toast.error("Please enter a valid down payment amount");
      return;
    }
    if (currentStep === 3) {
      if (!client.fullName.trim()) {
        toast.error("Please enter the client's full name");
        return;
      }
      if (!client.cnic.trim()) {
        toast.error("Please enter the client's CNIC");
        return;
      }
      if (!isClientCnicValid) {
        const digits = client.cnic.replace(/\D/g, "").length;
        toast.error(
          `CNIC must be 13 digits matching format 12345-1234567-1 (currently ${digits} digits)`,
        );
        return;
      }
      if (!client.phone.trim()) {
        toast.error("Please enter the client's phone number");
        return;
      }
      if (!client.homeAddress.trim() || !client.postalAddress.trim()) {
        toast.error("Please fill in both home and postal addresses");
        return;
      }
    }
    if (currentStep === 4) {
      if (nextOfKin.name.trim()) {
        if (!nextOfKin.relation.trim() || !nextOfKin.phone.trim()) {
          toast.error("Please fill in nominee name, relation, and phone");
          return;
        }
        if (nextOfKin.cnic?.trim() && !isKinCnicValid) {
          const digits = nextOfKin.cnic.replace(/\D/g, "").length;
          toast.error(
            `Nominee CNIC must be 13 digits (format: 12345-1234567-1, currently ${digits} digits)`,
          );
          return;
        }
      }
    }
    setCurrentStep((prev) => Math.min(5, prev + 1));
  }

  function prevStep() {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }

  async function handleConfirmBooking() {
    if (!selectedUnit) return;
    setIsSubmitting(true);
    try {
      const result = await createBooking({
        unitId: selectedUnit.id,
        reservationId,
        client,
        nextOfKin: nextOfKin.name.trim() ? nextOfKin : undefined,
        discountType: paymentState.discountType || undefined,
        discountValue: paymentState.discountValue || undefined,
        discountReason: paymentState.discountReason || undefined,
        downPaymentPkr: paymentState.downPaymentPkr,
        possessionAmountPkr: paymentState.possessionAmountPkr || undefined,
        plan: paymentState.plan,
        installmentCount: paymentState.installmentCount,
        startDate: paymentState.startDate,
        paymentMethod: paymentState.paymentMethod,
        chequeNo: paymentState.chequeNo || undefined,
        bank: paymentState.bank || undefined,
        notes: paymentState.notes || undefined,
      });

      toast.success(`Booking ${result?.bookingNo || ""} created successfully!`);
      if (result?.id) {
        router.push(`/bookings/${result.id}` as never);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create booking");
      setIsSubmitting(false);
    }
  }

  function renderActionButtons() {
    return (
      <>
        {currentStep === 1 && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={nextStep}
            disabled={!canProceedStep1}
          >
            Next: Payment Plan
            <ArrowRight weight="light" className="ml-1.5 size-4" />
          </Button>
        )}

        {currentStep === 2 && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={nextStep}
            disabled={!canProceedStep2}
          >
            Next: Client Details
            <ArrowRight weight="light" className="ml-1.5 size-4" />
          </Button>
        )}

        {currentStep === 3 && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={nextStep}
            disabled={!canProceedStep3}
          >
            Next: Next of Kin
            <ArrowRight weight="light" className="ml-1.5 size-4" />
          </Button>
        )}

        {currentStep === 4 && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={nextStep}
            disabled={!canProceedStep4}
          >
            Next: Review & Confirm
            <ArrowRight weight="light" className="ml-1.5 size-4" />
          </Button>
        )}

        {currentStep === 5 && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleConfirmBooking}
            disabled={isSubmitting}
          >
            <Check weight="bold" className="mr-1.5 size-4" />
            {isSubmitting ? "Processing Booking..." : "Confirm & Create Booking"}
          </Button>
        )}
      </>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="New Booking"
        description="Book a commercial unit with custom installment plan, down payment, and client registration."
      />

      {/* Step Indicators */}
      <div className="card p-3">
        <div className="flex items-center justify-between overflow-x-auto">
          {STEPS.map((step) => {
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const Icon = isDone ? Check : step.icon;

            return (
              <div
                key={step.id}
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-[13px] whitespace-nowrap transition-colors",
                  step.id < currentStep && "cursor-pointer hover:text-ink",
                  isCurrent
                    ? "font-semibold text-primary"
                    : isDone
                      ? "text-ink"
                      : "text-ink-faint",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[11px]",
                    isCurrent
                      ? "bg-primary text-white"
                      : isDone
                        ? "bg-primary/10 font-bold text-primary"
                        : "bg-subtle text-ink-muted",
                  )}
                >
                  {isDone ? <Check weight="bold" className="size-3.5" /> : step.id}
                </span>
                <span>{step.label}</span>
                {step.id < STEPS.length && (
                  <span className="mx-2 text-line-strong select-none">/</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[420px]">
        <div className="mb-3 text-[12px] font-semibold tracking-wide text-ink-muted uppercase">
          Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]?.label}
        </div>
        {/* Step 1: Unit Selector */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <UnitSelector
              units={units}
              selectedUnitId={selectedUnit?.id}
              onSelectUnit={(u) => {
                setSelectedUnit(u);
              }}
              floors={floors}
              categories={categories}
            />
          </div>
        )}

        {/* Step 2: Payment Plan */}
        {currentStep === 2 && selectedUnit && (
          <PaymentPlanPanel
            listPricePkr={selectedUnit.computedPricePkr || "0.00"}
            role={role}
            discountType={paymentState.discountType}
            discountValue={paymentState.discountValue}
            discountReason={paymentState.discountReason}
            downPaymentPkr={paymentState.downPaymentPkr}
            possessionAmountPkr={paymentState.possessionAmountPkr}
            plan={paymentState.plan}
            installmentCount={paymentState.installmentCount}
            startDate={paymentState.startDate}
            paymentMethod={paymentState.paymentMethod}
            chequeNo={paymentState.chequeNo}
            bank={paymentState.bank}
            notes={paymentState.notes}
            onChange={(fields) => setPaymentState((prev) => ({ ...prev, ...fields }))}
          />
        )}

        {/* Step 3: Client Details */}
        {currentStep === 3 && (
          <div className="card p-6">
            <ClientForm
              client={client}
              nextOfKin={nextOfKin}
              onChangeClient={setClient}
              onChangeNextOfKin={setNextOfKin}
              showNextOfKin={false}
            />
          </div>
        )}

        {/* Step 4: Next of Kin */}
        {currentStep === 4 && (
          <div className="card p-6">
            <ClientForm
              client={client}
              nextOfKin={nextOfKin}
              onChangeClient={setClient}
              onChangeNextOfKin={setNextOfKin}
              showNextOfKin={true}
            />
          </div>
        )}

        {/* Step 5: Review & Confirm */}
        {currentStep === 5 && selectedUnit && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Unit Card */}
              <div className="card space-y-3 p-5">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <h4 className="text-[14px] font-semibold text-ink">Unit Summary</h4>
                  <span className="unit-code font-mono text-[14px] font-bold text-primary">
                    {selectedUnit.unitCode}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <span className="text-ink-muted">Floor / Block:</span>
                    <p className="font-medium text-ink">
                      {selectedUnit.floorName} · {selectedUnit.blockName}
                    </p>
                  </div>
                  <div>
                    <span className="text-ink-muted">Category:</span>
                    <p className="font-medium text-ink">{selectedUnit.categoryName}</p>
                  </div>
                  <div>
                    <span className="text-ink-muted">Net Area:</span>
                    <p className="font-medium text-ink tabular-nums">
                      {selectedUnit.netAreaSqft} sq ft
                    </p>
                  </div>
                  <div>
                    <span className="text-ink-muted">Rate / sq ft:</span>
                    <p className="font-medium text-ink tabular-nums">
                      {formatPkr(selectedUnit.ratePerSqftPkr)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client & Kin Card */}
              <div className="card space-y-3 p-5">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <h4 className="text-[14px] font-semibold text-ink">
                    Applicant Details
                  </h4>
                  <span className="font-mono text-[12px] text-ink-muted">
                    {client.cnic}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <span className="text-ink-muted">Name:</span>
                    <p className="font-medium text-ink">{client.fullName}</p>
                  </div>
                  <div>
                    <span className="text-ink-muted">Phone:</span>
                    <p className="font-medium text-ink tabular-nums">{client.phone}</p>
                  </div>
                  <div>
                    <span className="text-ink-muted">Nominee:</span>
                    <p className="font-medium text-ink">
                      {nextOfKin.name} ({nextOfKin.relation})
                    </p>
                  </div>
                  <div>
                    <span className="text-ink-muted">Nominee Phone:</span>
                    <p className="font-medium text-ink tabular-nums">{nextOfKin.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Overview Card */}
            <div className="card p-5">
              <h4 className="mb-3 border-b border-line pb-2 text-[14px] font-semibold text-ink">
                Financial Schedule & Deposit
              </h4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-[8px] bg-subtle/50 p-3">
                  <span className="text-[11px] text-ink-muted uppercase">List Price</span>
                  <p className="text-[14px] font-bold text-ink tabular-nums">
                    {formatPkr(selectedUnit.computedPricePkr || "0")}
                  </p>
                </div>
                <div className="rounded-[8px] bg-subtle/50 p-3">
                  <span className="text-[11px] text-ink-muted uppercase">
                    Down Payment
                  </span>
                  <p className="text-[14px] font-bold text-primary tabular-nums">
                    {formatPkr(paymentState.downPaymentPkr)}
                  </p>
                </div>
                <div className="rounded-[8px] bg-subtle/50 p-3">
                  <span className="text-[11px] text-ink-muted uppercase">Frequency</span>
                  <p className="text-[14px] font-semibold text-ink">
                    {paymentState.installmentCount} {paymentState.plan.toLowerCase()}
                  </p>
                </div>
                <div className="rounded-[8px] bg-subtle/50 p-3">
                  <span className="text-[11px] text-ink-muted uppercase">
                    Payment Mode
                  </span>
                  <p className="text-[14px] font-semibold text-ink">
                    {paymentState.paymentMethod}
                    {paymentState.chequeNo && ` (${paymentState.chequeNo})`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Navigation Footer - Sticky / Fixed at bottom of screen */}
      <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-30 sm:right-6 sm:left-6 lg:right-8 lg:left-[264px]">
        <div className="pointer-events-auto mx-auto w-full max-w-[1440px]">
          <div className="card flex items-center justify-between gap-3 border border-line bg-surface/95 p-4 shadow-floating backdrop-blur-md">
            <div>
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  <ArrowLeft weight="light" className="mr-1.5 size-4" />
                  Previous
                </Button>
              ) : selectedUnit ? (
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="text-ink-muted">Selected Unit:</span>
                  <span className="unit-code rounded bg-subtle px-2 py-0.5 font-mono text-[13px] font-bold text-ink">
                    {selectedUnit.unitCode}
                  </span>
                  <span className="hidden text-ink-muted sm:inline">
                    • {selectedUnit.categoryName} • {selectedUnit.floorName}
                  </span>
                  {selectedUnit.computedPricePkr && (
                    <span className="font-semibold text-primary tabular-nums">
                      ({formatPkr(selectedUnit.computedPricePkr)})
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[13px] text-ink-muted">
                  Select a unit to continue
                </span>
              )}
            </div>

            <div>{renderActionButtons()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
