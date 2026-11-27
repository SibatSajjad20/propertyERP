"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Buildings,
  CheckCircle,
  MagnifyingGlass,
  ArrowLeft,
  X,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pill } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { formatPkr } from "@/lib/money";
import type { AgreementCandidate } from "../queries";
import { createAgreement } from "../actions";

interface NewAgreementScreenProps {
  candidates: AgreementCandidate[];
  preselectedBookingId?: string;
  preselectedSaleId?: string;
}

export function NewAgreementScreen({
  candidates,
  preselectedBookingId,
  preselectedSaleId,
}: NewAgreementScreenProps) {
  const router = useRouter();

  const [selectedCandidateKey, setSelectedCandidateKey] = React.useState(() => {
    if (preselectedBookingId) return `BOOKING:${preselectedBookingId}`;
    if (preselectedSaleId) return `SALE:${preselectedSaleId}`;
    return candidates[0] ? `${candidates[0].kind}:${candidates[0].id}` : "";
  });

  const [candidateSearch, setCandidateSearch] = React.useState("");
  const [sellerName, setSellerName] = React.useState("Mr. Afnan Khan");
  const [agreementDate, setAgreementDate] = React.useState(
    new Date().toISOString().slice(0, 10),
  );
  const [completionDate, setCompletionDate] = React.useState("Feb-2029");
  const [buyerNationality, setBuyerNationality] = React.useState("Pakistani");
  const [nomineeNationality, setNomineeNationality] = React.useState("Pakistani");
  const [witness1Name, setWitness1Name] = React.useState("");
  const [witness2Name, setWitness2Name] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const selectedCandidate = React.useMemo(() => {
    if (!selectedCandidateKey) return null;
    const [kind, id] = selectedCandidateKey.split(":");
    return candidates.find((c) => c.kind === kind && c.id === id) ?? null;
  }, [candidates, selectedCandidateKey]);

  const filteredCandidates = React.useMemo(() => {
    const q = candidateSearch.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        c.refNo.toLowerCase().includes(q) ||
        c.clientName.toLowerCase().includes(q) ||
        c.clientCnic.toLowerCase().includes(q) ||
        c.unitDisplay.toLowerCase().includes(q) ||
        c.floorName.toLowerCase().includes(q),
    );
  }, [candidates, candidateSearch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCandidateKey) {
      toast.error("Please select a linked booking or sale record.");
      return;
    }

    const [kind, id] = selectedCandidateKey.split(":");
    setSubmitting(true);
    try {
      const created = await createAgreement({
        bookingId: kind === "BOOKING" ? id : null,
        saleId: kind === "SALE" ? id : null,
        sellerName,
        agreementDate,
        anticipatedCompletionDate: completionDate,
        buyerNationality,
        nomineeNationality,
        witness1Name: witness1Name || null,
        witness2Name: witness2Name || null,
        notes: notes || null,
      });

      toast.success(`Agreement ${created.agreementNo} generated successfully!`);
      router.push(`/agreements/${created.id}` as never);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate agreement");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6 pb-16">
      <PageHeader
        back={{ href: "/agreements", label: "Agreements" }}
        title="New Agreement"
        description="Generate an official Sale & Purchase Agreement linked to an active booking or direct sale."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Linked Booking or Sale Record */}
        <Panel
          title="1. Linked Booking or Direct Sale"
          hint="Select the active customer booking or direct sale for which this agreement is prepared"
        >
          <div className="space-y-4">
            {/* Search candidate */}
            <div className="relative">
              <MagnifyingGlass
                weight="light"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
              />
              <Input
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                placeholder="Search candidates by Client name, CNIC, Unit code, or Ref No..."
                className="pl-9"
              />
              {candidateSearch && (
                <button
                  type="button"
                  onClick={() => setCandidateSearch("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-muted hover:text-ink"
                >
                  <X weight="bold" className="size-3.5" />
                </button>
              )}
            </div>

            {/* Candidate selection dropdown or list */}
            {candidates.length === 0 ? (
              <div className="rounded-[8px] border border-line bg-subtle/40 p-4 text-center text-[13px] text-ink-muted">
                No active bookings or sales available to create an agreement for.
              </div>
            ) : (
              <div className="max-h-56 divide-y divide-line/60 overflow-y-auto rounded-[8px] border border-line bg-surface p-1.5">
                {filteredCandidates.length === 0 ? (
                  <div className="p-4 text-center text-[12px] text-ink-muted">
                    No matching records found for &ldquo;{candidateSearch}&rdquo;
                  </div>
                ) : (
                  filteredCandidates.map((c) => {
                    const key = `${c.kind}:${c.id}`;
                    const isSelected = key === selectedCandidateKey;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedCandidateKey(key)}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-[6px] p-2.5 text-left text-[12.5px] transition-colors ${
                          isSelected
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-ink hover:bg-subtle/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-subtle text-ink-muted"
                            }`}
                          >
                            <Buildings weight="bold" className="size-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-ink">
                                {c.unitDisplay}
                              </span>
                              <span className="text-[11px] text-ink-muted">
                                ({c.floorName})
                              </span>
                              <Pill
                                tone={c.kind === "BOOKING" ? "primary" : "accent"}
                                className="py-0 text-[10px]"
                              >
                                {c.kind === "BOOKING" ? "Booking" : "Direct Sale"}
                              </Pill>
                            </div>
                            <div className="text-[11.5px] text-ink-muted">
                              {c.clientName} · CNIC: {c.clientCnic} · Ref #{c.refNo}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-sans font-semibold text-ink tabular-nums">
                            {formatPkr(c.totalPricePkr)}
                          </div>
                          {isSelected && (
                            <span className="flex items-center justify-end gap-1 text-[11px] text-primary">
                              <CheckCircle weight="bold" className="size-3.5" />
                              Selected
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Selected candidate banner preview */}
            {selectedCandidate && (
              <div className="rounded-[8px] border border-primary/20 bg-primary/5 p-3.5">
                <span className="text-[11px] font-semibold tracking-wider text-primary uppercase">
                  Selected Record Preview
                </span>
                <div className="mt-2 grid grid-cols-2 gap-3 text-[12.5px] sm:grid-cols-4">
                  <div>
                    <span className="block text-[11px] text-ink-muted">Unit / Floor</span>
                    <strong className="text-ink">
                      {selectedCandidate.unitDisplay} ({selectedCandidate.floorName})
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[11px] text-ink-muted">Buyer Name</span>
                    <strong className="text-ink">{selectedCandidate.clientName}</strong>
                  </div>
                  <div>
                    <span className="block text-[11px] text-ink-muted">
                      National CNIC
                    </span>
                    <span className="font-sans text-ink tabular-nums">
                      {selectedCandidate.clientCnic}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-ink-muted">
                      Contract Price
                    </span>
                    <strong className="font-sans text-ink tabular-nums">
                      {formatPkr(selectedCandidate.totalPricePkr)}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Panel>

        {/* 2. Agreement Details & Key Dates */}
        <Panel
          title="2. Agreement Schedule & Dates"
          hint="Developer legal representative, agreement signing date, and anticipated project delivery"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="seller-name" className="mb-1 block text-[12px]">
                Developer Representative (Seller) *
              </Label>
              <Input
                id="seller-name"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="e.g. Mr. Afnan Khan"
                required
              />
            </div>

            <div>
              <Label htmlFor="agreement-date" className="mb-1 block text-[12px]">
                Agreement Date *
              </Label>
              <DatePicker
                id="agreement-date"
                value={agreementDate}
                onChange={setAgreementDate}
              />
            </div>

            <div>
              <Label htmlFor="completion-date" className="mb-1 block text-[12px]">
                Anticipated Completion Date *
              </Label>
              <Input
                id="completion-date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                placeholder="e.g. Feb-2029"
                required
              />
            </div>
          </div>
        </Panel>

        {/* 3. Parties & Nationalities */}
        <Panel
          title="3. Parties & Nationalities"
          hint="Jurisdiction and legal nationality details for Schedule A legal records"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="buyer-nat" className="mb-1 block text-[12px]">
                Buyer Nationality *
              </Label>
              <Input
                id="buyer-nat"
                value={buyerNationality}
                onChange={(e) => setBuyerNationality(e.target.value)}
                placeholder="e.g. Pakistani"
                required
              />
            </div>

            <div>
              <Label htmlFor="nominee-nat" className="mb-1 block text-[12px]">
                Nominee / Next of Kin Nationality *
              </Label>
              <Input
                id="nominee-nat"
                value={nomineeNationality}
                onChange={(e) => setNomineeNationality(e.target.value)}
                placeholder="e.g. Pakistani"
                required
              />
            </div>
          </div>
        </Panel>

        {/* 4. Witnesses */}
        <Panel
          title="4. Agreement Witnesses (Optional)"
          hint="Attesting witness information for the legal contract Schedule"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="witness1" className="mb-1 block text-[12px]">
                Witness 1 Full Name &amp; CNIC
              </Label>
              <Input
                id="witness1"
                value={witness1Name}
                onChange={(e) => setWitness1Name(e.target.value)}
                placeholder="e.g. Muhammad Aslam (37405-1234567-1)"
              />
            </div>

            <div>
              <Label htmlFor="witness2" className="mb-1 block text-[12px]">
                Witness 2 Full Name &amp; CNIC
              </Label>
              <Input
                id="witness2"
                value={witness2Name}
                onChange={(e) => setWitness2Name(e.target.value)}
                placeholder="e.g. Tariq Mehmood (37405-7654321-2)"
              />
            </div>
          </div>
        </Panel>

        {/* 5. Special Terms & Notes */}
        <Panel
          title="5. Additional Terms &amp; Notes (Optional)"
          hint="Internal notes or supplementary clauses recorded alongside this agreement"
        >
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any specific agreement clauses, remarks, or reference numbers..."
            rows={3}
          />
        </Panel>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between rounded-[12px] border border-line bg-surface p-4 shadow-xs">
          <Button variant="secondary" size="md" asChild>
            <Link href="/agreements">
              <ArrowLeft weight="bold" className="mr-1.5 size-4" />
              Cancel
            </Link>
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={submitting || !selectedCandidateKey}
            className="gap-2"
          >
            <FileText weight="bold" className="size-4" />
            <span>{submitting ? "Generating Agreement..." : "Generate Agreement"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
