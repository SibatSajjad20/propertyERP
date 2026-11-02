/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ClockCountdown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    fullName: "",
    cnic: "",
    phone: "",
    email: "",
    homeAddress: "",
    postalAddress: "",
  });

  const [nextOfKin, setNextOfKin] = React.useState<NextOfKinInput>({
    name: "",
    relation: "",
    cnic: "",
    phone: "",
    address: "",
  });

  const [durationDays, setDurationDays] = React.useState(7);
  const [isCustomDate, setIsCustomDate] = React.useState(false);
  const [customExpiryDate, setCustomExpiryDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const canProceedStep1 = Boolean(selectedUnit);
  const isClientCnicValid = CNIC_REGEX.test(formatCnic(client.cnic));
  const isKinCnicValid =
    !nextOfKin.cnic?.trim() || CNIC_REGEX.test(formatCnic(nextOfKin.cnic));

  const canProceedStep2 = Boolean(
    client.fullName.trim() &&
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

    setIsSubmitting(true);
    try {
      const res = await createReservation({
        unitId: selectedUnit.id,
        client,
        nextOfKin: nextOfKin.name ? nextOfKin : undefined,
        durationDays,
        customExpiryDate: isCustomDate ? customExpiryDate : undefined,
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
      <>
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
          <Button type="button" variant="primary" size="md" onClick={handleNextStep}>
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
            className="bg-accent hover:bg-accent/90"
          >
            <Check weight="bold" className="mr-1.5 size-4" />
            {isSubmitting ? "Holding Unit..." : "Confirm Reservation"}
          </Button>
        )}
      </>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="New Reservation"
        description="Hold an available unit for a prospective buyer with automated expiration."
      />

      {/* Step Indicator */}
      <div className="card flex items-center gap-3 p-3 text-[13px]">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-[11px] font-bold",
            currentStep === 1 ? "bg-primary text-white" : "bg-primary/10 text-primary",
          )}
        >
          1
        </span>
        <span className={currentStep === 1 ? "font-semibold text-primary" : "text-ink"}>
          Select Unit
        </span>
        <span className="text-line-strong">/</span>
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-[11px] font-bold",
            currentStep === 2
              ? "bg-primary text-white"
              : currentStep > 2
                ? "bg-primary/10 text-primary"
                : "bg-subtle text-ink-muted",
          )}
        >
          2
        </span>
        <span className={currentStep === 2 ? "font-semibold text-primary" : "text-ink"}>
          Client & Nominee
        </span>
        <span className="text-line-strong">/</span>
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-[11px] font-bold",
            currentStep === 3 ? "bg-primary text-white" : "bg-subtle text-ink-muted",
          )}
        >
          3
        </span>
        <span
          className={currentStep === 3 ? "font-semibold text-primary" : "text-ink-faint"}
        >
          Duration & Confirmation
        </span>
      </div>

      {/* Step 1: Unit Selector */}
      {currentStep === 1 && (
        <UnitSelector
          units={units}
          selectedUnitId={selectedUnit?.id}
          onSelectUnit={(u) => setSelectedUnit(u)}
          floors={floors}
          categories={categories}
        />
      )}

      {/* Step 2: Client Form */}
      {currentStep === 2 && (
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

      {/* Step 3: Duration & Confirm */}
      {currentStep === 3 && selectedUnit && (
        <div className="space-y-6">
          <div className="card space-y-4 p-5">
            <div className="flex items-center gap-2 border-b border-line pb-2.5">
              <ClockCountdown weight="light" className="size-5 text-accent" />
              <h3 className="text-[14px] font-semibold text-ink">Reservation Duration</h3>
            </div>

            <div>
              <Label className="mb-2 block text-[12px]">Choose Hold Period</Label>
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
                        "rounded-[8px] border p-3 text-center text-[12px] font-medium transition-all",
                        isSelected
                          ? "border-accent bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-accent shadow-sm"
                          : "border-line bg-surface text-ink hover:border-line-strong",
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
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
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="res-notes" className="mb-1 block text-[12px]">
                Notes / Special Conditions (Optional)
              </Label>
              <Input
                id="res-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Buyer pending token cheque clearance"
              />
            </div>
          </div>

          {/* Review Summary */}
          <div className="card p-5">
            <h4 className="mb-3 border-b border-line pb-2 text-[14px] font-semibold text-ink">
              Reservation Summary
            </h4>
            <div className="grid grid-cols-1 gap-4 text-[12px] sm:grid-cols-3">
              <div>
                <span className="text-ink-muted">Unit:</span>
                <p className="font-mono text-[14px] font-bold text-primary">
                  {selectedUnit.unitCode} ({selectedUnit.floorName})
                </p>
              </div>
              <div>
                <span className="text-ink-muted">Reserved For:</span>
                <p className="font-medium text-ink">
                  {client.fullName} ({client.phone})
                </p>
              </div>
              <div>
                <span className="text-ink-muted">Status Transition:</span>
                <p className="font-medium text-accent">AVAILABLE → RESERVED</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation - Sticky / Fixed at bottom of screen */}
      <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-30 sm:right-6 sm:left-6 lg:right-8 lg:left-[264px]">
        <div className="pointer-events-auto mx-auto w-full max-w-[1440px]">
          <div className="card flex items-center justify-between gap-3 border border-line bg-surface/95 p-4 shadow-floating backdrop-blur-md">
            <div>
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
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
