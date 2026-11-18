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
import { formatPkr, parseDecimal } from "@/lib/money";
import { effectivePricingArea, formatUnitDisplayCode } from "@/lib/area";
import { cn } from "@/lib/cn";
import { toast } from "sonner";
import type {
  UserRole,
  PaymentPlan,
  DiscountType,
  DocumentType,
  PaymentMethod,
} from "@/db/schema/enums";
import {
  ClientDocumentFields,
  KinDocumentFields,
  type DocSlotMap,
} from "@/features/documents/components/document-fields";
import type { ExistingDocument } from "@/features/documents/components/document-upload";
import {
  collectPending,
  flushPendingUploads,
  isDocReady,
} from "@/features/documents/upload-client";
import { createBooking } from "../actions";
import { CNIC_REGEX, formatCnic, type ClientInput, type NextOfKinInput } from "../schema";
import { ClientForm } from "./client-form";
import { PaymentPlanPanel } from "./payment-plan-panel";
import { UnitSelector, type SelectableUnit } from "./unit-selector";
import {
  DEFAULT_BALLOON_PERCENT,
  DEFAULT_DOWN_PAYMENT_PERCENT,
  DEFAULT_POSSESSION_PERCENT,
  generateSchedule,
} from "../calculator";

interface BookingWizardProps {
  units: SelectableUnit[];
  floors: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  role: UserRole;
  preselectedUnitId?: string;
  preselectedClientId?: string;
  reservationId?: string;
  reservationTokenAmount?: string;
  reservationTokenReceiptNo?: string;
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
  reservationTokenAmount = "0",
  reservationTokenReceiptNo,
  initialClient,
  initialNextOfKin,
}: BookingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(preselectedUnitId ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAdvancing, setIsAdvancing] = React.useState(false);
  const advancingRef = React.useRef(false);
  const submittingRef = React.useRef(false);

  // Form State
  const [selectedUnit, setSelectedUnit] = React.useState<SelectableUnit | null>(() => {
    return units.find((u) => u.id === preselectedUnitId) ?? null;
  });

  const [paymentState, setPaymentState] = React.useState({
    discountType: "" as DiscountType | "",
    discountValue: "",
    discountReason: "",
    downPaymentType: "PERCENT" as DiscountType,
    downPaymentValue: DEFAULT_DOWN_PAYMENT_PERCENT,
    possessionType: "PERCENT" as DiscountType,
    possessionValue: DEFAULT_POSSESSION_PERCENT,
    balloonType: "PERCENT" as DiscountType,
    balloonValue: DEFAULT_BALLOON_PERCENT,
    adjustTokenAmount: true,
    plan: "MONTHLY" as PaymentPlan,
    installmentCount: 36,
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    paymentMethod: "CASH" as PaymentMethod,
    chequeNo: "",
    bank: "",
    notes: "",
  });

  const [client, setClient] = React.useState<ClientInput>(() => ({
    fullName: "",
    relationPrefix: "S/O",
    relationName: "",
    cnic: "",
    phone: "",
    phoneOffice: "",
    phoneRes: "",
    mobile2: "",
    email: "",
    homeAddress: "",
    postalAddress: "",
    ...initialClient,
  }));

  const [nextOfKin, setNextOfKin] = React.useState<NextOfKinInput>(() => ({
    name: "",
    relationPrefix: "S/O",
    relationName: "",
    relation: "",
    cnic: "",
    phone: "",
    address: "",
    ...initialNextOfKin,
  }));
  const [clientId, setClientId] = React.useState<string | null>(
    preselectedClientId ?? null,
  );
  const [kinId, setKinId] = React.useState<string | null>(null);
  const [clientDocs, setClientDocs] = React.useState<DocSlotMap>({});
  const [kinDocs, setKinDocs] = React.useState<DocSlotMap>({});
  const [docErrors, setDocErrors] = React.useState<Partial<Record<string, string>>>({});

  const liveSchedule = React.useMemo(() => {
    if (!selectedUnit) return null;
    return generateSchedule({
      listPricePkr: selectedUnit.computedPricePkr || "0",
      discountType: paymentState.discountType || null,
      discountValue: paymentState.discountValue || null,
      downPaymentType: paymentState.downPaymentType,
      downPaymentValue: paymentState.downPaymentValue || "0",
      possessionType: paymentState.possessionType,
      possessionValue: paymentState.possessionValue || "0",
      balloonType: paymentState.balloonType,
      balloonValue: paymentState.balloonValue || "0",
      tokenAdjustedPkr: paymentState.adjustTokenAmount ? reservationTokenAmount : "0",
      plan: paymentState.plan,
      installmentCount: paymentState.installmentCount,
      startDate: paymentState.startDate ? new Date(paymentState.startDate) : new Date(),
    });
  }, [selectedUnit, paymentState, reservationTokenAmount]);

  // Validation per step
  const canProceedStep1 = Boolean(selectedUnit);
  const canProceedStep2 = Boolean(
    liveSchedule &&
    liveSchedule.isValid &&
    parseDecimal(liveSchedule.downPaymentPkr) > 0n &&
    parseDecimal(liveSchedule.possessionAmountPkr) > 0n &&
    paymentState.installmentCount > 0,
  );

  const isClientCnicValid = CNIC_REGEX.test(formatCnic(client.cnic));
  const isKinCnicValid =
    !nextOfKin.cnic?.trim() || CNIC_REGEX.test(formatCnic(nextOfKin.cnic));

  const canProceedStep3 = Boolean(
    client.fullName.trim().length >= 2 &&
    client.relationName.trim().length >= 2 &&
    isClientCnicValid &&
    client.phone.trim().length >= 10 &&
    client.homeAddress.trim().length >= 5 &&
    client.postalAddress.trim().length >= 5,
  );
  const canProceedStep4 = Boolean(
    nextOfKin.name.trim().length >= 2 &&
    nextOfKin.relationName.trim().length >= 2 &&
    nextOfKin.relation.trim().length >= 2 &&
    nextOfKin.phone.trim().length >= 10 &&
    isKinCnicValid &&
    Boolean(nextOfKin.cnic?.trim()),
  );

  function applyMatchedDocs(match: {
    clientId: string;
    kinId: string | null;
    documents: {
      id: string;
      ownerType: "CLIENT" | "KIN";
      docType: DocumentType;
      mimeType: string;
    }[];
  }) {
    setClientId(match.clientId);
    setKinId(match.kinId);
    const nextClient: DocSlotMap = {};
    const nextKin: DocSlotMap = {};
    for (const doc of match.documents) {
      const slot: ExistingDocument = {
        id: doc.id,
        mimeType: doc.mimeType,
        usedExisting: true,
      };
      if (doc.ownerType === "CLIENT") nextClient[doc.docType] = slot;
      else nextKin[doc.docType] = slot;
    }
    setClientDocs(nextClient);
    setKinDocs(nextKin);
  }

  async function flushWizardDocs(scope: "client" | "kin" | "all") {
    const pending = collectPending({ client: clientDocs, kin: kinDocs }).filter(
      (item) => {
        if (scope === "client") return item.ownerType === "CLIENT";
        if (scope === "kin") return item.ownerType === "KIN";
        return true;
      },
    );
    if (pending.length === 0) return;
    const saved = await flushPendingUploads({
      pending,
      client,
      nextOfKin: scope === "client" ? undefined : nextOfKin,
      clientId,
      kinId,
    });
    setClientId(saved.clientId);
    if (saved.kinId) setKinId(saved.kinId);
    setClientDocs((prev) => {
      const next = { ...prev };
      for (const row of saved.documents) {
        if (row.ownerType === "CLIENT") {
          next[row.docType] = { id: row.id, mimeType: row.mimeType };
        }
      }
      return next;
    });
    setKinDocs((prev) => {
      const next = { ...prev };
      for (const row of saved.documents) {
        if (row.ownerType === "KIN") {
          next[row.docType] = { id: row.id, mimeType: row.mimeType };
        }
      }
      return next;
    });
  }

  async function nextStep() {
    if (advancingRef.current || isSubmitting) return;
    advancingRef.current = true;
    const step = currentStep;
    setIsAdvancing(true);
    try {
      if (step === 1 && !canProceedStep1) {
        toast.error("Please select a unit to proceed");
        return;
      }
      if (step === 2 && !canProceedStep2) {
        if (liveSchedule && !liveSchedule.isValid && liveSchedule.validationError) {
          toast.error(liveSchedule.validationError);
        } else if (liveSchedule && parseDecimal(liveSchedule.possessionAmountPkr) <= 0n) {
          toast.error("Possession payment is required and must be greater than 0");
        } else {
          toast.error("Please enter valid down payment and possession amounts");
        }
        return;
      }
      if (step === 3) {
        if (client.fullName.trim().length < 2) {
          toast.error("Please enter the client's full name (at least 2 characters)");
          return;
        }
        if (client.relationName.trim().length < 2) {
          toast.error("Please enter the client's S/O or W/O name");
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
        if (client.phone.trim().length < 10) {
          toast.error("Please enter a valid phone number (at least 10 digits)");
          return;
        }
        if (
          client.homeAddress.trim().length < 5 ||
          client.postalAddress.trim().length < 5
        ) {
          toast.error("Home and postal addresses must each be at least 5 characters");
          return;
        }
        setDocErrors({});
      }
      if (step === 4) {
        if (
          nextOfKin.name.trim().length < 2 ||
          nextOfKin.relationName.trim().length < 2 ||
          nextOfKin.relation.trim().length < 2
        ) {
          toast.error("Please fill in nominee name, S/O or W/O name, and relation");
          return;
        }
        if (nextOfKin.phone.trim().length < 10) {
          toast.error("Please enter a valid nominee phone number (at least 10 digits)");
          return;
        }
        if (!nextOfKin.cnic?.trim() || !isKinCnicValid) {
          const digits = (nextOfKin.cnic || "").replace(/\D/g, "").length;
          toast.error(
            `Nominee CNIC must be 13 digits (format: 12345-1234567-1, currently ${digits} digits)`,
          );
          return;
        }
        setDocErrors({});
      }
      setCurrentStep(Math.min(5, step + 1));
    } finally {
      advancingRef.current = false;
      setIsAdvancing(false);
    }
  }

  function prevStep() {
    if (advancingRef.current || isSubmitting) return;
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }

  async function handleConfirmBooking() {
    if (!selectedUnit || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      let docUploadWarning: string | null = null;
      try {
        await flushWizardDocs("all");
      } catch (docErr: any) {
        const msg =
          typeof docErr?.message === "string" &&
          !docErr.message.includes("Minified React error")
            ? docErr.message
            : "Document storage is unavailable right now";
        docUploadWarning = msg;
      }

      const response = await createBooking({
        unitId: selectedUnit.id,
        reservationId,
        client,
        nextOfKin,
        discountType: paymentState.discountType || undefined,
        discountValue: paymentState.discountValue || undefined,
        discountReason: paymentState.discountReason || undefined,
        downPaymentType: paymentState.downPaymentType,
        downPaymentValue: paymentState.downPaymentValue,
        possessionType: paymentState.possessionType,
        possessionValue: paymentState.possessionValue,
        balloonType: paymentState.balloonType,
        balloonValue: paymentState.balloonValue,
        adjustTokenAmount: paymentState.adjustTokenAmount,
        plan: paymentState.plan,
        installmentCount: paymentState.installmentCount,
        startDate: paymentState.startDate,
        paymentMethod: paymentState.paymentMethod,
        chequeNo: paymentState.chequeNo || undefined,
        bank: paymentState.bank || undefined,
        notes: paymentState.notes || undefined,
      });

      if (!response.ok) {
        toast.error(response.error || "Failed to create booking");
        submittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      const result = response.data;
      if (docUploadWarning) {
        toast.warning(
          `Booking created, but documents were not uploaded (${docUploadWarning}). You can upload them on the booking page.`,
        );
      }

      toast.success(`Booking ${result?.bookingNo || ""} created successfully!`, {
        action: result?.id
          ? {
              label: "Download receipt",
              onClick: () => {
                window.location.href = `/api/documents/booking/${result.id}/receipt.pdf`;
              },
            }
          : undefined,
      });
      if (result?.id) {
        router.push(`/bookings/${result.id}` as never);
      }
    } catch (err: any) {
      const msg =
        typeof err?.message === "string" && !err.message.includes("Minified React error")
          ? err.message
          : "Failed to create booking. Please check all fields and try again.";
      toast.error(msg);
      submittingRef.current = false;
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
            onClick={() => void nextStep()}
            disabled={!canProceedStep1 || isAdvancing}
            loading={isAdvancing}
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
            onClick={() => void nextStep()}
            disabled={!canProceedStep2 || isAdvancing}
            loading={isAdvancing}
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
            onClick={() => void nextStep()}
            disabled={!canProceedStep3 || isAdvancing}
            loading={isAdvancing}
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
            onClick={() => void nextStep()}
            disabled={!canProceedStep4 || isAdvancing}
            loading={isAdvancing}
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
                  if (!isAdvancing && !isSubmitting && step.id < currentStep)
                    setCurrentStep(step.id);
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
            downPaymentType={paymentState.downPaymentType}
            downPaymentValue={paymentState.downPaymentValue}
            possessionType={paymentState.possessionType}
            possessionValue={paymentState.possessionValue}
            balloonType={paymentState.balloonType}
            balloonValue={paymentState.balloonValue}
            reservationTokenAmount={reservationTokenAmount}
            reservationTokenReceiptNo={reservationTokenReceiptNo}
            adjustTokenAmount={paymentState.adjustTokenAmount}
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
          <div className="card space-y-6 p-6">
            <ClientForm
              client={client}
              nextOfKin={nextOfKin}
              onChangeClient={setClient}
              onChangeNextOfKin={setNextOfKin}
              showNextOfKin={false}
              onMatched={applyMatchedDocs}
            />
            <div>
              <h3 className="mb-3 text-[14px] font-semibold text-ink">
                Client documents{" "}
                <span className="font-normal text-ink-muted">(Optional)</span>
              </h3>
              <ClientDocumentFields
                clientId={clientId}
                docs={clientDocs}
                errors={{
                  PHOTO: docErrors.PHOTO,
                  CNIC_FRONT: docErrors.CNIC_FRONT,
                  CNIC_BACK: docErrors.CNIC_BACK,
                }}
                onChange={(docType, doc) => {
                  setClientDocs((prev) => ({ ...prev, [docType]: doc }));
                  setDocErrors((prev) => ({ ...prev, [docType]: undefined }));
                }}
              />
            </div>
          </div>
        )}

        {/* Step 4: Next of Kin */}
        {currentStep === 4 && (
          <div className="card space-y-6 p-6">
            <ClientForm
              client={client}
              nextOfKin={nextOfKin}
              onChangeClient={setClient}
              onChangeNextOfKin={setNextOfKin}
              showNextOfKin={true}
              kinCnicRequired
              onMatched={applyMatchedDocs}
            />
            <div>
              <h3 className="mb-3 text-[14px] font-semibold text-ink">
                Nominee documents{" "}
                <span className="font-normal text-ink-muted">(Optional)</span>
              </h3>
              <KinDocumentFields
                clientId={clientId}
                kinId={kinId}
                docs={kinDocs}
                errors={{
                  KIN_PHOTO: docErrors.KIN_PHOTO,
                  CNIC_FRONT: docErrors.KIN_CNIC_FRONT,
                  CNIC_BACK: docErrors.KIN_CNIC_BACK,
                }}
                onChange={(docType, doc) => {
                  setKinDocs((prev) => ({ ...prev, [docType]: doc }));
                  setDocErrors((prev) => ({
                    ...prev,
                    [docType === "KIN_PHOTO" ? "KIN_PHOTO" : `KIN_${docType}`]: undefined,
                  }));
                }}
              />
            </div>
          </div>
        )}

        {/* Step 5: Review & Confirm */}
        {currentStep === 5 && selectedUnit && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Unit Card (Gross Area ONLY — never Net Sq Ft on booking form) */}
              <div className="card space-y-3 p-5">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <h4 className="text-[14px] font-semibold text-ink">Unit Summary</h4>
                  <span className="unit-code font-mono text-[14px] font-bold text-primary">
                    {formatUnitDisplayCode(
                      selectedUnit.unitCode,
                      selectedUnit.categoryName,
                    )}
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
                    <span className="text-ink-muted">Gross Area:</span>
                    <p className="font-medium text-ink tabular-nums">
                      {effectivePricingArea(
                        selectedUnit.grossAreaSqft,
                        selectedUnit.netAreaSqft,
                      )}{" "}
                      sq ft
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
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-[8px] bg-subtle/50 p-3">
                  <span className="text-[11px] text-ink-muted uppercase">Net Price</span>
                  <p className="text-[14px] font-bold text-ink tabular-nums">
                    {formatPkr(
                      liveSchedule?.netPricePkr || selectedUnit.computedPricePkr || "0",
                    )}
                  </p>
                </div>
                <div className="rounded-[8px] bg-subtle/50 p-3">
                  <span className="text-[11px] text-ink-muted uppercase">
                    Down Payment
                  </span>
                  <p className="text-[14px] font-bold text-primary tabular-nums">
                    {formatPkr(liveSchedule?.downPaymentPkr || "0")}
                  </p>
                  {liveSchedule && liveSchedule.tokenAdjustedPkr !== "0.00" && (
                    <p className="text-[11px] text-available tabular-nums">
                      Payable now: {formatPkr(liveSchedule.payableDownPaymentNowPkr)}
                    </p>
                  )}
                </div>
                <div className="rounded-[8px] bg-subtle/50 p-3">
                  <span className="text-[11px] text-ink-muted uppercase">
                    Annual Balloon
                  </span>
                  <p className="text-[14px] font-semibold text-ink tabular-nums">
                    {formatPkr(liveSchedule?.balloonTotalAmountPkr || "0")}
                  </p>
                  <p className="text-[11px] text-ink-muted tabular-nums">
                    {liveSchedule?.balloonCount ?? 0} ×{" "}
                    {formatPkr(liveSchedule?.balloonAmountPerYearPkr || "0")}
                  </p>
                </div>
                <div className="rounded-[8px] bg-subtle/50 p-3">
                  <span className="text-[11px] text-ink-muted uppercase">Possession</span>
                  <p className="text-[14px] font-semibold text-ink tabular-nums">
                    {formatPkr(liveSchedule?.possessionAmountPkr || "0")}
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
                  disabled={isSubmitting || isAdvancing}
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
