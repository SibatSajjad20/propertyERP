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
import { Panel } from "@/components/ui/panel";
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
import { collectPending, flushPendingUploads } from "@/features/documents/upload-client";
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
    title: "Mr",
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
      <div className="flex items-center gap-2">
        {currentStep > 1 && (
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
        )}

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
      </div>
    );
  }

  // Grouped installments for schedule preview
  const regularInsts = React.useMemo(() => {
    if (!liveSchedule) return [];
    return liveSchedule.installments.filter((i) => i.type === "REGULAR");
  }, [liveSchedule]);

  const inst1 = regularInsts[0];
  const inst2 = regularInsts[1];
  const remainingRegular = regularInsts.slice(2);
  const remainingRegularTotal = React.useMemo(() => {
    return remainingRegular.reduce((acc, i) => acc + parseDecimal(i.amountPkr), 0n);
  }, [remainingRegular]);

  // Only Step 2 (Payment Plan) displays the sticky Schedule Preview side card.
  // All other steps (Step 1 Unit Selection, Step 3 Client, Step 4 Kin, Step 5 Review) are full-width (col-span-12).
  const isStep2 = currentStep === 2 && Boolean(selectedUnit);

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="New Booking"
        back={{ label: "Bookings", href: "/bookings" }}
        meta={
          [
            selectedUnit
              ? `Unit ${formatUnitDisplayCode(selectedUnit.unitCode, selectedUnit.categoryName)}`
              : null,
            client.fullName.trim() ? client.fullName.trim() : null,
          ].filter(Boolean) as React.ReactNode[]
        }
        actions={renderActionButtons()}
      />

      {/* 5-Step Stepper Panel */}
      <div className="steps mb-6 flex overflow-x-auto rounded-[12px] border border-line bg-surface p-1">
        {STEPS.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <button
              key={step.id}
              type="button"
              disabled={isSubmitting || isAdvancing || (!isDone && !isCurrent)}
              onClick={() => {
                if (!isAdvancing && !isSubmitting && isDone) {
                  setCurrentStep(step.id);
                }
              }}
              className={cn(
                "step relative flex flex-1 items-center gap-2.5 px-3.5 py-3 text-[13px] font-medium transition-colors select-none",
                isDone && "cursor-pointer text-ink hover:text-primary",
                isCurrent && "font-semibold text-primary",
                !isDone && !isCurrent && "cursor-not-allowed text-ink-muted",
              )}
            >
              <span
                className={cn(
                  "n flex size-5.5 shrink-0 items-center justify-center rounded-full text-[11.5px] transition-colors",
                  isDone && "bg-primary font-bold text-white",
                  isCurrent &&
                    "border-[1.5px] border-primary bg-primary-soft/40 font-bold text-primary",
                  !isDone &&
                    !isCurrent &&
                    "border border-line-strong bg-surface text-ink-muted",
                )}
              >
                {isDone ? <Check weight="bold" className="size-3" /> : step.id}
              </span>
              <span className="truncate">{step.label}</span>
              {isCurrent && (
                <span className="absolute right-3.5 bottom-[-1px] left-3.5 h-[2px] bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Step Label Tracker for test compatibility */}
      <div className="mb-2 text-[12px] font-semibold tracking-wide text-ink-muted uppercase">
        Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]?.label}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (7 cols on Step 2, 12 cols on Steps 1, 3, 4, 5): Step Forms */}
        <div className={cn(isStep2 ? "lg:col-span-7" : "lg:col-span-12", "space-y-6")}>
          {/* Step 1: Unit Selector */}
          {currentStep === 1 && (
            <Panel title="Select Unit" hint="Filter by floor, category, or code">
              <UnitSelector
                units={units}
                selectedUnitId={selectedUnit?.id}
                onSelectUnit={(u) => setSelectedUnit(u)}
                floors={floors}
                categories={categories}
              />
            </Panel>
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
            <div className="space-y-6">
              <Panel
                title="Applicant Identity"
                hint="Primary client personal and legal information"
              >
                <ClientForm
                  client={client}
                  nextOfKin={nextOfKin}
                  onChangeClient={setClient}
                  onChangeNextOfKin={setNextOfKin}
                  showNextOfKin={false}
                  onMatched={applyMatchedDocs}
                />
              </Panel>

              <Panel
                title="Client Documents"
                hint="Identification documents (Photo, CNIC front and back)"
              >
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
              </Panel>
            </div>
          )}

          {/* Step 4: Next of Kin */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Panel
                title="Nominee Identity"
                hint="Next of kin designated as legal heir or representative"
              >
                <ClientForm
                  client={client}
                  nextOfKin={nextOfKin}
                  onChangeClient={setClient}
                  onChangeNextOfKin={setNextOfKin}
                  showNextOfKin={true}
                  kinCnicRequired
                  onMatched={applyMatchedDocs}
                />
              </Panel>

              <Panel
                title="Nominee Documents"
                hint="Identification documents for designated next of kin"
              >
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
                      [docType === "KIN_PHOTO" ? "KIN_PHOTO" : `KIN_${docType}`]:
                        undefined,
                    }));
                  }}
                />
              </Panel>
            </div>
          )}

          {/* Step 5: Review & Confirm */}
          {currentStep === 5 && selectedUnit && (
            <div className="space-y-6">
              {/* Unit Details */}
              <Panel title="Property Unit Details" hint={selectedUnit.categoryName}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  <div className="rounded-[8px] border border-line bg-subtle/30 p-3">
                    <span className="text-[11px] font-medium text-ink-muted uppercase">
                      Unit Code
                    </span>
                    <p className="mt-1 font-sans text-[14px] font-bold text-ink tabular-nums">
                      {formatUnitDisplayCode(
                        selectedUnit.unitCode,
                        selectedUnit.categoryName,
                      )}
                    </p>
                  </div>
                  <div className="rounded-[8px] border border-line bg-subtle/30 p-3">
                    <span className="text-[11px] font-medium text-ink-muted uppercase">
                      Floor / Block
                    </span>
                    <p className="mt-1 text-[13px] font-semibold text-ink">
                      {selectedUnit.floorName} · {selectedUnit.blockName}
                    </p>
                  </div>
                  <div className="rounded-[8px] border border-line bg-subtle/30 p-3">
                    <span className="text-[11px] font-medium text-ink-muted uppercase">
                      Category
                    </span>
                    <p className="mt-1 text-[13px] font-semibold text-ink">
                      {selectedUnit.categoryName}
                    </p>
                  </div>
                  <div className="rounded-[8px] border border-line bg-subtle/30 p-3">
                    <span className="text-[11px] font-medium text-ink-muted uppercase">
                      Gross Area
                    </span>
                    <p className="mt-1 text-[13px] font-semibold text-ink tabular-nums">
                      {effectivePricingArea(
                        selectedUnit.grossAreaSqft,
                        selectedUnit.netAreaSqft,
                      )}{" "}
                      sq ft
                    </p>
                  </div>
                  <div className="rounded-[8px] border border-line bg-subtle/30 p-3">
                    <span className="text-[11px] font-medium text-ink-muted uppercase">
                      Rate / sq ft
                    </span>
                    <p className="mt-1 text-[13px] font-semibold text-ink tabular-nums">
                      {formatPkr(selectedUnit.ratePerSqftPkr)}
                    </p>
                  </div>
                  <div className="rounded-[8px] border border-line bg-subtle/30 p-3">
                    <span className="text-[11px] font-medium text-ink-muted uppercase">
                      List Price
                    </span>
                    <p className="mt-1 text-[13px] font-bold text-ink tabular-nums">
                      {formatPkr(selectedUnit.computedPricePkr || "0")}
                    </p>
                  </div>
                </div>
              </Panel>

              {/* Applicant & Nominee */}
              <Panel
                title="Applicant & Nominee"
                hint="Confirmed identity and ownership information"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-[10px] border border-line bg-surface p-4">
                    <span className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
                      Applicant
                    </span>
                    <p className="mt-1 text-[14.5px] font-bold text-ink">
                      {client.title} {client.fullName}
                    </p>
                    <p className="text-[12.5px] text-ink-muted">
                      {client.relationPrefix} {client.relationName}
                    </p>
                    <div className="mt-3 space-y-1 text-[12px]">
                      <p className="font-medium text-ink tabular-nums">
                        CNIC: {client.cnic}
                      </p>
                      <p className="text-ink-muted tabular-nums">Phone: {client.phone}</p>
                      <p className="text-ink-muted">Address: {client.homeAddress}</p>
                    </div>
                  </div>

                  <div className="rounded-[10px] border border-line bg-surface p-4">
                    <span className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
                      Designated Nominee
                    </span>
                    <p className="mt-1 text-[14.5px] font-bold text-ink">
                      {nextOfKin.name} ({nextOfKin.relation})
                    </p>
                    <p className="text-[12.5px] text-ink-muted">
                      {nextOfKin.relationPrefix} {nextOfKin.relationName}
                    </p>
                    <div className="mt-3 space-y-1 text-[12px]">
                      <p className="font-medium text-ink tabular-nums">
                        CNIC: {nextOfKin.cnic}
                      </p>
                      <p className="text-ink-muted tabular-nums">
                        Phone: {nextOfKin.phone}
                      </p>
                      {nextOfKin.address && (
                        <p className="text-ink-muted">Address: {nextOfKin.address}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Enhanced Financial Summary */}
              <Panel
                title="Financial Summary & Payment Plan"
                hint="Complete price breakdown, payment schedule, and terms"
              >
                <div className="space-y-6">
                  {/* Summary Stat Tiles */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <div className="rounded-[8px] border border-line bg-subtle/30 p-3">
                      <span className="text-[11px] font-medium text-ink-muted uppercase">
                        List Price
                      </span>
                      <p className="text-[14px] font-semibold text-ink tabular-nums">
                        {formatPkr(selectedUnit.computedPricePkr || "0")}
                      </p>
                    </div>

                    <div className="rounded-[8px] border border-line bg-subtle/30 p-3">
                      <span className="text-[11px] font-medium text-ink-muted uppercase">
                        Discount
                      </span>
                      <p className="text-[14px] font-semibold text-ink tabular-nums">
                        {liveSchedule?.discountAmountPkr &&
                        liveSchedule.discountAmountPkr !== "0.00"
                          ? formatPkr(liveSchedule.discountAmountPkr)
                          : "None"}
                      </p>
                    </div>

                    <div className="rounded-[8px] border border-primary/30 bg-primary-soft/20 p-3">
                      <span className="text-[11px] font-medium text-primary uppercase">
                        Net Price
                      </span>
                      <p className="text-[16px] font-bold text-primary tabular-nums">
                        {formatPkr(liveSchedule?.netPricePkr || "0")}
                      </p>
                    </div>

                    <div className="rounded-[8px] border border-line bg-subtle/30 p-3">
                      <span className="text-[11px] font-medium text-ink-muted uppercase">
                        Down Payment ({liveSchedule?.downPaymentPercent}%)
                      </span>
                      <p className="text-[14px] font-bold text-ink tabular-nums">
                        {formatPkr(liveSchedule?.downPaymentPkr || "0")}
                      </p>
                      {liveSchedule && liveSchedule.tokenAdjustedPkr !== "0.00" && (
                        <p className="mt-0.5 text-[11px] font-medium text-available tabular-nums">
                          Payable now: {formatPkr(liveSchedule.payableDownPaymentNowPkr)}
                        </p>
                      )}
                    </div>

                    <div className="rounded-[8px] border border-line bg-subtle/30 p-3">
                      <span className="text-[11px] font-medium text-ink-muted uppercase">
                        Possession ({liveSchedule?.possessionPercent}%)
                      </span>
                      <p className="text-[14px] font-semibold text-ink tabular-nums">
                        {formatPkr(liveSchedule?.possessionAmountPkr || "0")}
                      </p>
                    </div>

                    <div className="rounded-[8px] border border-line bg-subtle/30 p-3">
                      <span className="text-[11px] font-medium text-ink-muted uppercase">
                        Installments
                      </span>
                      <p className="text-[13px] font-semibold text-ink">
                        {paymentState.installmentCount} {paymentState.plan.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  {/* Complete Schedule Breakdown Table */}
                  <div className="overflow-hidden rounded-[10px] border border-line">
                    <div className="border-b border-line bg-subtle/50 px-4 py-2.5">
                      <h4 className="text-[12.5px] font-semibold text-ink">
                        Payment Schedule Breakdown
                      </h4>
                    </div>
                    <table className="w-full border-collapse text-[13px]">
                      <thead className="border-b border-line bg-surface text-[11.5px] text-ink-muted uppercase">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">
                            Stage / Milestone
                          </th>
                          <th className="px-4 py-2 text-left font-medium">
                            Timeline / Due Date
                          </th>
                          <th className="px-4 py-2 text-right font-medium">
                            Amount (PKR)
                          </th>
                          <th className="px-4 py-2 text-right font-medium">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {/* Down Payment Row */}
                        <tr>
                          <td className="px-4 py-2.5 font-medium text-ink">
                            Down Payment
                          </td>
                          <td className="px-4 py-2.5 text-ink-muted">On Booking</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-primary tabular-nums">
                            {formatPkr(liveSchedule?.downPaymentPkr || "0")}
                          </td>
                          <td className="px-4 py-2.5 text-right text-ink-muted tabular-nums">
                            {liveSchedule?.downPaymentPercent}%
                          </td>
                        </tr>

                        {/* Inst 1 */}
                        {inst1 && (
                          <tr>
                            <td className="px-4 py-2.5 font-medium text-ink">
                              Installment #01
                            </td>
                            <td className="px-4 py-2.5 text-ink-muted">
                              {inst1.dueDate.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium text-ink tabular-nums">
                              {formatPkr(inst1.amountPkr)}
                            </td>
                            <td className="px-4 py-2.5 text-right text-ink-muted">—</td>
                          </tr>
                        )}

                        {/* Inst 2 */}
                        {inst2 && (
                          <tr>
                            <td className="px-4 py-2.5 font-medium text-ink">
                              Installment #02
                            </td>
                            <td className="px-4 py-2.5 text-ink-muted">
                              {inst2.dueDate.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium text-ink tabular-nums">
                              {formatPkr(inst2.amountPkr)}
                            </td>
                            <td className="px-4 py-2.5 text-right text-ink-muted">—</td>
                          </tr>
                        )}

                        {/* Remaining Regular Installments */}
                        {remainingRegular.length > 0 && (
                          <tr>
                            <td className="px-4 py-2.5 text-ink-muted">
                              Remaining Installments (#03–{liveSchedule?.installmentCount}
                              )
                            </td>
                            <td className="px-4 py-2.5 text-ink-muted">
                              {remainingRegular.length} regular payments
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium text-ink tabular-nums">
                              {formatPkr(
                                remainingRegularTotal.toString().slice(0, -2) +
                                  "." +
                                  remainingRegularTotal.toString().slice(-2),
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right text-ink-muted">—</td>
                          </tr>
                        )}

                        {/* Annual Balloons */}
                        {liveSchedule && liveSchedule.balloonCount > 0 && (
                          <tr>
                            <td className="px-4 py-2.5 font-medium text-ink">
                              Annual Balloons ({liveSchedule.balloonCount} payments)
                            </td>
                            <td className="px-4 py-2.5 text-ink-muted">
                              Every 12 months
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium text-ink tabular-nums">
                              {formatPkr(liveSchedule.balloonTotalAmountPkr)}
                            </td>
                            <td className="px-4 py-2.5 text-right text-ink-muted tabular-nums">
                              {liveSchedule.balloonPercent}%
                            </td>
                          </tr>
                        )}

                        {/* Possession */}
                        {liveSchedule &&
                          parseDecimal(liveSchedule.possessionAmountPkr) > 0n && (
                            <tr>
                              <td className="px-4 py-2.5 font-medium text-ink">
                                On Possession
                              </td>
                              <td className="px-4 py-2.5 text-ink-muted">Handover</td>
                              <td className="px-4 py-2.5 text-right font-medium text-ink tabular-nums">
                                {formatPkr(liveSchedule.possessionAmountPkr)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-ink-muted tabular-nums">
                                {liveSchedule.possessionPercent}%
                              </td>
                            </tr>
                          )}

                        {/* Total Net Price */}
                        <tr className="border-t-2 border-line bg-subtle/30 font-semibold">
                          <td className="px-4 py-3 text-ink">Total Net Price</td>
                          <td className="px-4 py-3 text-ink-muted">
                            100% of agreed purchase value
                          </td>
                          <td className="px-4 py-3 text-right text-[14px] font-bold text-ink tabular-nums">
                            {formatPkr(liveSchedule?.netPricePkr || "0")}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-ink tabular-nums">
                            100%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Payment Collection Details */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-line bg-subtle/20 p-3 text-[12.5px]">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink-muted">
                        Initial Payment Method:
                      </span>
                      <span className="font-semibold text-ink">
                        {paymentState.paymentMethod}
                      </span>
                      {paymentState.chequeNo && (
                        <span className="text-ink-muted">
                          · Cheque #{paymentState.chequeNo}
                          {paymentState.bank ? ` (${paymentState.bank})` : ""}
                        </span>
                      )}
                    </div>
                    {paymentState.notes && (
                      <div className="text-ink-muted italic">
                        Note: {paymentState.notes}
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Sticky Schedule Preview (Step 2 only) */}
        {isStep2 && liveSchedule ? (
          <div className="space-y-5 lg:col-span-5">
            <div className="sticky top-20">
              <Panel
                title="Schedule Preview"
                hint={`${liveSchedule.installmentCount} installments`}
              >
                <table className="w-full border-collapse text-[12.5px]">
                  <tbody className="divide-y divide-line/60">
                    <tr>
                      <td className="py-2 text-ink-muted">On Booking (Down Payment)</td>
                      <td className="py-2 text-right font-semibold text-primary tabular-nums">
                        {formatPkr(liveSchedule.downPaymentPkr)}
                      </td>
                    </tr>
                    {inst1 && (
                      <tr>
                        <td className="py-2 text-ink-muted">
                          Inst #01 (
                          {inst1.dueDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}
                          )
                        </td>
                        <td className="py-2 text-right font-medium text-ink tabular-nums">
                          {formatPkr(inst1.amountPkr)}
                        </td>
                      </tr>
                    )}
                    {inst2 && (
                      <tr>
                        <td className="py-2 text-ink-muted">
                          Inst #02 (
                          {inst2.dueDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}
                          )
                        </td>
                        <td className="py-2 text-right font-medium text-ink tabular-nums">
                          {formatPkr(inst2.amountPkr)}
                        </td>
                      </tr>
                    )}
                    {remainingRegular.length > 0 && (
                      <tr>
                        <td className="py-2 text-ink-muted">
                          Inst #03–{liveSchedule.installmentCount} (
                          {remainingRegular.length} payments)
                        </td>
                        <td className="py-2 text-right font-medium text-ink tabular-nums">
                          {formatPkr(
                            remainingRegularTotal.toString().slice(0, -2) +
                              "." +
                              remainingRegularTotal.toString().slice(-2),
                          )}
                        </td>
                      </tr>
                    )}
                    {liveSchedule.balloonCount > 0 && (
                      <tr>
                        <td className="py-2 text-ink-muted">
                          Annual Balloons ({liveSchedule.balloonCount} payments)
                        </td>
                        <td className="py-2 text-right font-medium text-ink tabular-nums">
                          {formatPkr(liveSchedule.balloonTotalAmountPkr)}
                        </td>
                      </tr>
                    )}
                    {parseDecimal(liveSchedule.possessionAmountPkr) > 0n && (
                      <tr>
                        <td className="py-2 text-ink-muted">On Possession</td>
                        <td className="py-2 text-right font-medium text-ink tabular-nums">
                          {formatPkr(liveSchedule.possessionAmountPkr)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-line font-semibold">
                      <td className="py-2.5 text-ink">Total Net Price</td>
                      <td className="py-2.5 text-right font-bold text-ink tabular-nums">
                        {formatPkr(liveSchedule.netPricePkr)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Panel>
            </div>
          </div>
        ) : null}
      </div>

      {/* Floating Bottom Navigation Bar */}
      <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-30 sm:right-6 sm:left-6 lg:right-8 lg:left-[264px]">
        <div className="pointer-events-auto mx-auto w-full max-w-[1440px]">
          <div className="flex items-center justify-between gap-3 rounded-[12px] border border-line bg-surface/95 p-3.5 shadow-floating backdrop-blur-md">
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
                  <span className="rounded bg-subtle px-2 py-0.5 font-sans text-[13px] font-bold text-ink tabular-nums">
                    {formatUnitDisplayCode(
                      selectedUnit.unitCode,
                      selectedUnit.categoryName,
                    )}
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
