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

  const [salePrice, setSalePrice] = React.useState("");
  const [priceAdjustmentReason, setPriceAdjustmentReason] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("CASH");
  const [chequeNo, setChequeNo] = React.useState("");
  const [bank, setBank] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAdvancing, setIsAdvancing] = React.useState(false);
  const advancingRef = React.useRef(false);
  const [clientId, setClientId] = React.useState<string | null>(null);
  const [kinId, setKinId] = React.useState<string | null>(null);
  const [clientDocs, setClientDocs] = React.useState<DocSlotMap>({});
  const [kinDocs, setKinDocs] = React.useState<DocSlotMap>({});
  const [docErrors, setDocErrors] = React.useState<Partial<Record<string, string>>>({});

  React.useEffect(() => {
    if (selectedUnit && !salePrice) {
      setSalePrice(selectedUnit.computedPricePkr || "0.00");
    }
  }, [selectedUnit, salePrice]);

  const askingPrice = selectedUnit?.computedPricePkr || "0.00";
  const isCustomPrice = Boolean(
    salePrice &&
    Math.round(Number(salePrice.replace(/,/g, "")) * 100) !==
      Math.round(Number(askingPrice.replace(/,/g, "")) * 100),
  );
  const isAdmin = role === "ADMIN";

  async function handleConfirmSale() {
    if (!selectedUnit) return;
    const isClientCnicValid = CNIC_REGEX.test(formatCnic(client.cnic));
    const isKinCnicValid =
      !nextOfKin.cnic?.trim() || CNIC_REGEX.test(formatCnic(nextOfKin.cnic));

    if (client.fullName.trim().length < 2) {
      toast.error("Please enter the client's full name (at least 2 characters)");
      return;
    }
    if (client.relationName.trim().length < 2) {
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
    if (client.phone.trim().length < 10) {
      toast.error("Please enter a valid client phone number (at least 10 digits)");
      return;
    }
    if (client.homeAddress.trim().length < 5 || client.postalAddress.trim().length < 5) {
      toast.error("Home and postal addresses must each be at least 5 characters");
      return;
    }
    if (
      nextOfKin.name.trim().length < 2 ||
      nextOfKin.relationName.trim().length < 2 ||
      nextOfKin.relation.trim().length < 2
    ) {
      toast.error("Please fill in next of kin name, S/O or W/O name, and relation");
      return;
    }
    if (nextOfKin.phone.trim().length < 10) {
      toast.error("Please enter a valid nominee phone number (at least 10 digits)");
      return;
    }
    if (!nextOfKin.cnic?.trim() || !isKinCnicValid) {
      const digits = (nextOfKin.cnic || "").replace(/\D/g, "").length;
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
      let docUploadWarning: string | null = null;
      const pending = collectPending({ client: clientDocs, kin: kinDocs });
      if (pending.length > 0) {
        try {
          const saved = await flushPendingUploads({
            pending,
            client,
            nextOfKin,
            clientId,
            kinId,
          });
          setClientId(saved.clientId);
          if (saved.kinId) setKinId(saved.kinId);
        } catch (docErr: any) {
          const msg =
            typeof docErr?.message === "string" &&
            !docErr.message.includes("Minified React error")
              ? docErr.message
              : "Document storage is unavailable right now";
          docUploadWarning = msg;
        }
      }

      const response = await createDirectSale({
        unitId: selectedUnit.id,
        client,
        nextOfKin,
        salePricePkr: salePrice,
        priceAdjustmentReason: isCustomPrice ? priceAdjustmentReason : undefined,
        paymentMethod,
        chequeNo: chequeNo || undefined,
        bank: bank || undefined,
        notes: notes || undefined,
      });

      if (!response.ok) {
        toast.error(response.error || "Failed to complete direct sale");
        setIsSubmitting(false);
        return;
      }

      const result = response.data;
      if (docUploadWarning) {
        toast.warning(
          `Sale completed, but documents were not uploaded (${docUploadWarning}). You can upload them on the sale page.`,
        );
      }

      toast.success(`Unit ${selectedUnit.unitCode} sold successfully!`, {
        action: result?.id
          ? {
              label: "Download receipt",
              onClick: () => {
                window.location.href = `/api/documents/sale/${result.id}/receipt.pdf`;
              },
            }
          : undefined,
      });
      if (result?.id) {
        router.push(`/sold/${result.id}` as never);
      }
    } catch (err: any) {
      const msg =
        typeof err?.message === "string" && !err.message.includes("Minified React error")
          ? err.message
          : "Failed to complete direct sale. Please check all fields and try again.";
      toast.error(msg);
      setIsSubmitting(false);
    }
  }

  async function handleNextStep() {
    if (advancingRef.current || isSubmitting) return;
    advancingRef.current = true;
    const step = currentStep;
    setIsAdvancing(true);
    try {
      if (step === 1 && !selectedUnit) {
        toast.error("Please select a unit to sell");
        return;
      }
      if (step === 2) {
        if (
          client.fullName.trim().length < 2 ||
          client.relationName.trim().length < 2 ||
          !client.cnic.trim() ||
          client.phone.trim().length < 10
        ) {
          toast.error("Please fill in required buyer details (phone min 10 digits)");
          return;
        }
        if (!CNIC_REGEX.test(formatCnic(client.cnic))) {
          const digits = client.cnic.replace(/\D/g, "").length;
          toast.error(
            `Client CNIC must be 13 digits matching format 12345-1234567-1 (currently ${digits} digits)`,
          );
          return;
        }
        if (
          client.homeAddress.trim().length < 5 ||
          client.postalAddress.trim().length < 5
        ) {
          toast.error("Home and postal addresses must each be at least 5 characters");
          return;
        }
        if (
          nextOfKin.name.trim().length < 2 ||
          nextOfKin.relationName.trim().length < 2 ||
          nextOfKin.relation.trim().length < 2 ||
          nextOfKin.phone.trim().length < 10 ||
          !nextOfKin.cnic?.trim()
        ) {
          toast.error(
            "Please fill in required next of kin details (phone min 10 digits)",
          );
          return;
        }
        if (!CNIC_REGEX.test(formatCnic(nextOfKin.cnic))) {
          const digits = nextOfKin.cnic.replace(/\D/g, "").length;
          toast.error(
            `Nominee CNIC must be 13 digits matching format 12345-1234567-1 (currently ${digits} digits)`,
          );
          return;
        }
        setDocErrors({});
      }
      setCurrentStep(step + 1);
    } finally {
      advancingRef.current = false;
      setIsAdvancing(false);
    }
  }

  function renderActionButtons() {
    return (
      <>
        {currentStep < 3 ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => void handleNextStep()}
            loading={isAdvancing}
            disabled={
              isAdvancing ||
              (currentStep === 1 && !selectedUnit) ||
              (currentStep === 2 &&
                (!client.fullName.trim() ||
                  !client.cnic.trim() ||
                  !nextOfKin.name.trim() ||
                  !nextOfKin.cnic?.trim()))
            }
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
        <div className="card space-y-6 p-6">
          <ClientForm
            client={client}
            nextOfKin={nextOfKin}
            onChangeClient={setClient}
            onChangeNextOfKin={setNextOfKin}
            showNextOfKin={true}
            kinCnicRequired
            onMatched={(match) => {
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
            }}
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
                <p className="unit-code font-sans tabular-nums font-bold text-primary">
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
                  disabled={isAdvancing || isSubmitting}
                >
                  <ArrowLeft weight="light" className="mr-1.5 size-4" />
                  Previous
                </Button>
              ) : selectedUnit ? (
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="text-ink-muted">Selected Unit:</span>
                  <span className="unit-code rounded bg-subtle px-2 py-0.5 font-sans tabular-nums text-[13px] font-bold text-ink">
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
