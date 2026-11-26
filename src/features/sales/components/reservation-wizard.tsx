/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ClockCountdown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/ui/panel";
import { DefinitionList } from "@/components/ui/definition-list";
import { FormSection } from "@/components/ui/form-section";
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
import type { PaymentMethod } from "@/db/schema/enums";
import { formatUnitDisplayCode } from "@/lib/area";
import { cn } from "@/lib/cn";
import { formatPkr } from "@/lib/money";
import { toast } from "sonner";
import { createReservation } from "../actions";
import { CNIC_REGEX, formatCnic, type ClientInput, type NextOfKinInput } from "../schema";
import { ClientForm } from "./client-form";
import { UnitSelector, type SelectableUnit } from "./unit-selector";

interface ReservationWizardProps {
  units: SelectableUnit[];
  floors: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

const DURATION_PRESETS = [
  { label: "24 Hours (1 Day)", days: 1 },
  { label: "3 Days", days: 3 },
  { label: "7 Days (1 Week)", days: 7 },
  { label: "15 Days", days: 15 },
  { label: "30 Days (1 Month)", days: 30 },
];

export function ReservationWizard({ units, floors, categories }: ReservationWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [selectedUnit, setSelectedUnit] = React.useState<SelectableUnit | null>(null);

  const [client, setClient] = React.useState<ClientInput>({
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
  });

  const [nextOfKin, setNextOfKin] = React.useState<NextOfKinInput>({
    name: "",
    relationPrefix: "S/O",
    relationName: "",
    relation: "",
    cnic: "",
    phone: "",
    address: "",
  });

  const [durationDays, setDurationDays] = React.useState(7);
  const [isCustomDate, setIsCustomDate] = React.useState(false);
  const [customExpiryDate, setCustomExpiryDate] = React.useState("");
  const [includeToken, setIncludeToken] = React.useState(false);
  const [tokenAmount, setTokenAmount] = React.useState("");
  const [tokenPaymentMethod, setTokenPaymentMethod] =
    React.useState<PaymentMethod>("CASH");
  const [tokenChequeNo, setTokenChequeNo] = React.useState("");
  const [tokenBank, setTokenBank] = React.useState("");
  const [tokenReference, setTokenReference] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const canProceedStep1 = Boolean(selectedUnit);
  const isClientCnicValid = CNIC_REGEX.test(formatCnic(client.cnic));
  const isKinCnicValid =
    !nextOfKin.cnic?.trim() || CNIC_REGEX.test(formatCnic(nextOfKin.cnic));

  const canProceedStep2 = Boolean(
    client.fullName.trim() &&
    client.relationName.trim() &&
    isClientCnicValid &&
    client.phone.trim() &&
    client.homeAddress.trim() &&
    client.postalAddress.trim() &&
    isKinCnicValid,
  );

  async function handleConfirmReservation() {
    if (!selectedUnit) return;
    if (!client.fullName.trim()) {
      toast.error("Please enter the client's full name");
      return;
    }
    if (!client.relationName.trim()) {
      toast.error("Please enter the client's S/O or W/O name");
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
      toast.error("Please fill in client addresses");
      return;
    }
    if (nextOfKin.cnic?.trim() && !isKinCnicValid) {
      const digits = nextOfKin.cnic.replace(/\D/g, "").length;
      toast.error(
        `Nominee CNIC must be 13 digits (format 12345-1234567-1, currently ${digits} digits)`,
      );
      return;
    }

    if (
      includeToken &&
      (!tokenAmount.trim() || Number(tokenAmount.replace(/,/g, "")) <= 0)
    ) {
      toast.error(
        "Please enter a valid token amount greater than 0, or uncheck Token Payment.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createReservation({
        unitId: selectedUnit.id,
        client,
        nextOfKin: nextOfKin.name ? nextOfKin : undefined,
        durationDays,
        customExpiryDate: isCustomDate ? customExpiryDate : undefined,
        tokenAmount: includeToken ? tokenAmount : "0",
        tokenPaymentMethod: includeToken ? tokenPaymentMethod : undefined,
        tokenChequeNo: includeToken && tokenChequeNo ? tokenChequeNo : undefined,
        tokenBank: includeToken && tokenBank ? tokenBank : undefined,
        tokenReference: includeToken && tokenReference ? tokenReference : undefined,
        notes: notes || undefined,
      });

      toast.success(`Unit ${selectedUnit.unitCode} reserved successfully!`);
      if (res?.id) {
        router.push(`/reservations/${res.id}` as never);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create reservation");
      setIsSubmitting(false);
    }
  }

  function handleNextStep() {
    if (currentStep === 1) {
      if (!canProceedStep1) {
        toast.error("Please select a unit to hold");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!canProceedStep2) {
        toast.error("Please enter required client details");
        return;
      }
      setCurrentStep(3);
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
            onClick={() => setCurrentStep((p) => Math.max(1, p - 1))}
            disabled={isSubmitting}
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
            onClick={handleNextStep}
            disabled={!canProceedStep1}
          >
            Next: Client Details
            <ArrowRight weight="light" className="ml-1.5 size-4" />
          </Button>
        )}

        {currentStep === 2 && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleNextStep}
            disabled={!canProceedStep2}
          >
            Next: Duration & Notes
            <ArrowRight weight="light" className="ml-1.5 size-4" />
          </Button>
        )}

        {currentStep === 3 && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleConfirmReservation}
            disabled={isSubmitting}
          >
            <Check weight="bold" className="mr-1.5 size-4" />
            {isSubmitting ? "Holding Unit..." : "Confirm Reservation"}
          </Button>
        )}
      </div>
    );
  }

  const expiryDate = React.useMemo(() => {
    if (isCustomDate && customExpiryDate) {
      return new Date(customExpiryDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    const d = new Date();
    d.setDate(d.getDate() + durationDays);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [isCustomDate, customExpiryDate, durationDays]);

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="New Reservation"
        back={{ label: "Reservations", href: "/reservations" }}
        meta={
          [
            selectedUnit ? `Unit ${selectedUnit.unitCode}` : null,
            client.fullName.trim() ? client.fullName.trim() : null,
          ].filter(Boolean) as React.ReactNode[]
        }
        actions={renderActionButtons()}
      />

      {/* 3-Step Stepper Panel */}
      <div className="steps mb-6 flex rounded-[12px] border border-line bg-surface p-1">
        {[
          { id: 1, label: "Select Unit" },
          { id: 2, label: "Client & Nominee" },
          { id: 3, label: "Duration & Confirmation" },
        ].map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isDone && !isCurrent}
              onClick={() => {
                if (isDone) setCurrentStep(step.id);
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

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Step Content */}
        <div
          className={cn(selectedUnit ? "lg:col-span-8" : "lg:col-span-12", "space-y-6")}
        >
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

          {/* Step 2: Client Form */}
          {currentStep === 2 && (
            <FormSection
              title="Prospective Buyer Identity"
              description="Personal and contact details of the applicant reserving the unit."
            >
              <ClientForm
                client={client}
                nextOfKin={nextOfKin}
                onChangeClient={setClient}
                onChangeNextOfKin={setNextOfKin}
                showNextOfKin={true}
              />
            </FormSection>
          )}

          {/* Step 3: Duration & Notes */}
          {currentStep === 3 && selectedUnit && (
            <div className="space-y-6">
              <FormSection
                title="Hold Period"
                description="Select temporary hold duration before the unit expires back to available."
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                    {DURATION_PRESETS.map((p) => {
                      const isSelected = !isCustomDate && durationDays === p.days;
                      return (
                        <button
                          key={p.days}
                          type="button"
                          onClick={() => {
                            setIsCustomDate(false);
                            setDurationDays(p.days);
                          }}
                          className={cn(
                            "rounded-[8px] border p-3 text-center text-[12.5px] font-medium transition-all",
                            isSelected
                              ? "border-primary bg-primary-soft/40 font-semibold text-primary shadow-xs"
                              : "border-line bg-surface text-ink hover:border-line-strong",
                          )}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-ink">
                      <input
                        type="checkbox"
                        checked={isCustomDate}
                        onChange={(e) => setIsCustomDate(e.target.checked)}
                        className="rounded border-line"
                      />
                      Specify custom expiration date & time
                    </label>

                    {isCustomDate && (
                      <div className="mt-2 max-w-xs">
                        <Input
                          type="datetime-local"
                          value={customExpiryDate}
                          onChange={(e) => setCustomExpiryDate(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </FormSection>

              <FormSection
                title="Reservation Notes"
                description="Internal remarks or client requirements for this reservation."
              >
                <Input
                  id="res-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Client visiting on weekend to review payment terms"
                  className="h-9"
                />
              </FormSection>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Sticky Hold Summary */}
        {selectedUnit && (
          <div className="space-y-5 lg:col-span-4">
            <div className="sticky top-20 space-y-5">
              <Panel title="Hold Summary" hint="Reservation overview">
                <DefinitionList
                  items={[
                    {
                      label: "Unit Code",
                      value: (
                        <span className="font-sans font-medium text-ink tabular-nums">
                          {formatUnitDisplayCode(
                            selectedUnit.unitCode,
                            selectedUnit.categoryName,
                          )}
                        </span>
                      ),
                    },
                    {
                      label: "Floor / Block",
                      value: `${selectedUnit.floorName} · ${selectedUnit.blockName}`,
                    },
                    {
                      label: "Category",
                      value: selectedUnit.categoryName,
                    },
                    {
                      label: "List Price",
                      value: (
                        <span className="font-semibold text-ink tabular-nums">
                          {formatPkr(selectedUnit.computedPricePkr || "0")}
                        </span>
                      ),
                    },
                    {
                      label: "Hold Period",
                      value: isCustomDate ? "Custom" : `${durationDays} days`,
                    },
                    {
                      label: "Expires At",
                      value: (
                        <span className="font-sans font-medium text-primary tabular-nums">
                          {expiryDate}
                        </span>
                      ),
                    },
                  ]}
                />
              </Panel>

              <div className="rounded-[10px] border border-line bg-subtle/30 p-4 text-[12px] text-ink-muted">
                <p>
                  Reserving a unit marks its status as{" "}
                  <strong className="text-ink">RESERVED</strong> and takes it off the
                  market until the expiration deadline.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
