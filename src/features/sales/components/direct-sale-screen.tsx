/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Tag } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
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
import { formatPkr } from "@/lib/money";
import { cn } from "@/lib/cn";
import { toast } from "sonner";
import type { UserRole, PaymentMethod } from "@/db/schema/enums";
import { createDirectSale } from "../actions";
import { CNIC_REGEX, formatCnic, type ClientInput, type NextOfKinInput } from "../schema";
import { ClientForm } from "./client-form";
import { UnitSelector, type SelectableUnit } from "./unit-selector";

interface DirectSaleScreenProps {
  units: SelectableUnit[];
  floors: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  role: UserRole;
}

export function DirectSaleScreen({
  units,
  floors,
  categories,
  role,
}: DirectSaleScreenProps) {
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

  const [salePrice, setSalePrice] = React.useState("");
  const [priceAdjustmentReason, setPriceAdjustmentReason] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("CASH");
  const [chequeNo, setChequeNo] = React.useState("");
  const [bank, setBank] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (selectedUnit && !salePrice) {
      setSalePrice(selectedUnit.computedPricePkr || "0.00");
    }
  }, [selectedUnit, salePrice]);

  const askingPrice = selectedUnit?.computedPricePkr || "0.00";
  const isCustomPrice = salePrice && salePrice !== askingPrice;
  const isAdmin = role === "ADMIN";

  async function handleConfirmSale() {
    if (!selectedUnit) return;
    const isClientCnicValid = CNIC_REGEX.test(formatCnic(client.cnic));
    const isKinCnicValid =
      !nextOfKin.cnic?.trim() || CNIC_REGEX.test(formatCnic(nextOfKin.cnic));

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

    if (isCustomPrice && !isAdmin) {
      toast.error("Custom sale price requires Administrator authorization.");
      return;
    }
    if (isCustomPrice && !priceAdjustmentReason.trim()) {
      toast.error("Please enter a reason for modifying the sale price.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createDirectSale({
        unitId: selectedUnit.id,
        client,
        nextOfKin: nextOfKin.name ? nextOfKin : undefined,
        salePricePkr: salePrice,
        priceAdjustmentReason: isCustomPrice ? priceAdjustmentReason : undefined,
        paymentMethod,
        chequeNo: chequeNo || undefined,
        bank: bank || undefined,
        notes: notes || undefined,
      });

      toast.success(`Unit ${selectedUnit.unitCode} sold successfully!`);
      if (result?.id) {
        router.push(`/sold/${result.id}` as never);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to complete direct sale");
      setIsSubmitting(false);
    }
  }

  function handleNextStep() {
    if (currentStep === 1 && !selectedUnit) {
      toast.error("Please select a unit to sell");
      return;
    }
    if (
      currentStep === 2 &&
      (!client.fullName.trim() || !client.cnic.trim() || !client.phone.trim())
    ) {
      toast.error("Please fill in required buyer details");
      return;
    }
    setCurrentStep((prev) => prev + 1);
  }

  function renderActionButtons() {
    return (
      <>
        {currentStep < 3 ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleNextStep}
            disabled={currentStep === 1 && !selectedUnit}
          >
            Next Step
            <ArrowRight weight="light" className="ml-1.5 size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleConfirmSale}
            disabled={isSubmitting}
            className="bg-sold hover:bg-sold/90"
          >
            <Check weight="bold" className="mr-1.5 size-4" />
            {isSubmitting ? "Finalizing Sale..." : "Confirm & Mark Unit SOLD"}
          </Button>
        )}
      </>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Direct Sale"
        description="Mark a commercial unit as sold immediately with full upfront payment."
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
          Buyer Information
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
          Pricing & Settlement
        </span>
      </div>

      {/* Step 1: Unit Selector */}
      {currentStep === 1 && (
        <UnitSelector
          units={units}
          selectedUnitId={selectedUnit?.id}
          onSelectUnit={(u) => {
            setSelectedUnit(u);
            setSalePrice(u.computedPricePkr || "0.00");
          }}
          floors={floors}
          categories={categories}
        />
      )}

      {/* Step 2: Buyer Form */}
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

      {/* Step 3: Pricing & Settlement */}
      {currentStep === 3 && selectedUnit && (
        <div className="space-y-6">
          <div className="card space-y-4 p-5">
            <h3 className="text-[14px] font-semibold text-ink">Sale Price & Payment</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="asking-p" className="mb-1 block text-[12px]">
                  Asking Price
                </Label>
                <div className="flex h-9 items-center rounded border border-line bg-subtle px-3 font-semibold text-ink tabular-nums">
                  {formatPkr(askingPrice)}
                </div>
              </div>

              <div>
                <Label htmlFor="sale-p" className="mb-1 block text-[12px]">
                  Final Sale Price (PKR) <span className="text-sold">*</span>
                </Label>
                <MoneyInput
                  id="sale-p"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="font-bold tabular-nums"
                />
              </div>
            </div>

            {isCustomPrice && (
              <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-3">
                <span className="block text-[12px] font-semibold text-amber-900">
                  Price Modification Note
                </span>
                <p className="mb-2 text-[11px] text-amber-800">
                  The sale price differs from the asking price ({formatPkr(askingPrice)}).
                </p>
                <Input
                  value={priceAdjustmentReason}
                  onChange={(e) => setPriceAdjustmentReason(e.target.value)}
                  placeholder="Reason for price negotiation or concession (Required)"
                  className="bg-white"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 border-t border-line/60 pt-3 sm:grid-cols-3">
              <div>
                <Label className="mb-1 block text-[12px]">Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(val) => setPaymentMethod(val as any)}
                >
                  <SelectTrigger>
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
                    <Label className="mb-1 block text-[12px]">
                      Cheque / Instrument No
                    </Label>
                    <Input
                      value={chequeNo}
                      onChange={(e) => setChequeNo(e.target.value)}
                      placeholder="e.g. 7861234"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-[12px]">Bank Name</Label>
                    <Input
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      placeholder="e.g. Allied Bank"
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <Label className="mb-1 block text-[12px]">Remarks / Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Walk-in investor, full payment cleared"
              />
            </div>
          </div>

          {/* Review Summary */}
          <div className="card p-5">
            <h4 className="mb-3 border-b border-line pb-2 text-[14px] font-semibold text-ink">
              Confirmation Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-[12px] sm:grid-cols-4">
              <div>
                <span className="text-ink-muted">Unit:</span>
                <p className="font-mono font-bold text-primary">
                  {selectedUnit.unitCode}
                </p>
              </div>
              <div>
                <span className="text-ink-muted">Buyer:</span>
                <p className="font-medium text-ink">{client.fullName}</p>
              </div>
              <div>
                <span className="text-ink-muted">Agreed Price:</span>
                <p className="font-bold text-ink tabular-nums">{formatPkr(salePrice)}</p>
              </div>
              <div>
                <span className="text-ink-muted">Unit Status:</span>
                <p className="font-bold text-sold">AVAILABLE → SOLD</p>
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
