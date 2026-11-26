"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DownloadSimple,
  FileText,
  MagnifyingGlass,
  Plus,
  Printer,
  UploadSimple,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatStrip, StatCell } from "@/components/ui/stat-strip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPkr } from "@/lib/money";
import type { AgreementCandidate, AgreementListItem } from "../queries";
import { createAgreement } from "../actions";

interface AgreementsScreenProps {
  agreements: AgreementListItem[];
  candidates: AgreementCandidate[];
  preselectedBookingId?: string;
  preselectedSaleId?: string;
}

export function AgreementsScreen({
  agreements: initialAgreements,
  candidates,
  preselectedBookingId,
  preselectedSaleId,
}: AgreementsScreenProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  const [createOpen, setCreateOpen] = React.useState(
    Boolean(preselectedBookingId || preselectedSaleId),
  );
  const [selectedCandidateKey, setSelectedCandidateKey] = React.useState(() => {
    if (preselectedBookingId) return `BOOKING:${preselectedBookingId}`;
    if (preselectedSaleId) return `SALE:${preselectedSaleId}`;
    return "";
  });
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
  const [creating, setCreating] = React.useState(false);

  const signedCount = initialAgreements.filter(
    (a) => a.status === "SIGNED_UPLOADED",
  ).length;
  const generatedCount = initialAgreements.filter((a) => a.status === "GENERATED").length;

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialAgreements.filter((a) => {
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        a.agreementNo.toLowerCase().includes(q) ||
        a.clientName.toLowerCase().includes(q) ||
        a.clientCnic.toLowerCase().includes(q) ||
        a.unitCode.toLowerCase().includes(q) ||
        a.unitDisplay.toLowerCase().includes(q)
      );
    });
  }, [initialAgreements, search, statusFilter]);

  async function handleCreateAgreement(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCandidateKey) {
      toast.error("Please select a linked booking or sale record.");
      return;
    }
    const [kind, id] = selectedCandidateKey.split(":");
    setCreating(true);
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
      toast.success(`Agreement ${created.agreementNo} created!`);
      setCreateOpen(false);
      router.push(`/agreements/${created.id}` as never);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create agreement");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-5">
      <PageHeader
        title="Agreements"
        description="Maintain customer-wise Sale & Purchase Agreements linked to bookings and units. View, download, print, and upload signed copies."
        actions={
          <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
            <Plus weight="bold" className="mr-1.5 size-4" />
            New Agreement
          </Button>
        }
      />

      {/* KPI StatStrip */}
      <StatStrip columns={4}>
        <StatCell
          label="Total Agreements"
          value={initialAgreements.length}
          subLine="customer records"
        />
        <StatCell
          label="Signed & Uploaded"
          value={signedCount}
          subLine="executed copies on file"
          valueClassName="text-available"
        />
        <StatCell
          label="Awaiting Signature"
          value={generatedCount}
          subLine="generated from template"
          valueClassName="text-accent"
        />
        <StatCell
          label="Eligible Candidates"
          value={candidates.length}
          subLine="ready for agreement"
        />
      </StatStrip>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[260px] flex-1 sm:max-w-sm">
          <MagnifyingGlass
            weight="light"
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agreement #, customer, CNIC, or unit…"
            className="h-9 w-full rounded-[8px] border border-line bg-surface pr-3 pl-8 text-[13px] text-ink transition-colors outline-none placeholder:text-ink-faint focus:border-primary"
          />
        </div>
        <SegmentedControl
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={[
            {
              value: "ALL",
              label: (
                <span>
                  All{" "}
                  <span className="ml-1 text-[11px] opacity-70">
                    ({initialAgreements.length})
                  </span>
                </span>
              ),
            },
            {
              value: "SIGNED_UPLOADED",
              label: (
                <span>
                  Signed &amp; Uploaded{" "}
                  <span className="ml-1 text-[11px] opacity-70">({signedCount})</span>
                </span>
              ),
            },
            {
              value: "GENERATED",
              label: (
                <span>
                  Awaiting Sign{" "}
                  <span className="ml-1 text-[11px] opacity-70">({generatedCount})</span>
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* Customer-wise Agreements Table */}
      <div className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="h-[38px] border-b border-[var(--line)] bg-[#FAFBFC] text-[12px] font-medium text-[var(--ink-muted)] select-none">
              <tr>
                <th className="px-4 font-medium">Agreement #</th>
                <th className="px-4 font-medium">Customer</th>
                <th className="px-4 font-medium">Linked Unit / Booking</th>
                <th className="px-4 font-medium">Agreement Date</th>
                <th className="px-4 font-medium">Status</th>
                <th className="px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-muted">
                    <FileText
                      weight="light"
                      className="mx-auto mb-2 size-8 text-ink-faint"
                    />
                    <p className="font-medium text-ink">No agreements found</p>
                    <p className="mt-1 text-[12px]">
                      Click &ldquo;New Agreement&rdquo; to generate a Sale &amp; Purchase
                      Agreement from the official template.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="h-[44px] transition-colors hover:bg-[#F8FAFC]"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/agreements/${row.id}` as never}
                        className="font-sans font-semibold text-primary tabular-nums hover:underline"
                      >
                        {row.agreementNo}
                      </Link>
                      <p className="text-[11px] text-ink-muted">
                        Completion: {row.anticipatedCompletionDate}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink">{row.clientName}</p>
                      <p className="font-sans text-[11px] text-ink-muted tabular-nums">
                        {row.clientCnic} · {row.clientPhone}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/units/${row.unitId}` as never}
                        className="unit-code font-medium text-ink hover:text-primary hover:underline"
                      >
                        {row.unitDisplay}
                      </Link>
                      <p className="text-[11px] text-ink-muted">
                        {row.floorName} · {row.categoryName}
                        {row.bookingNo ? ` · ${row.bookingNo}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-ink tabular-nums">
                      {new Date(row.agreementDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.status === "SIGNED_UPLOADED" ? (
                        <Pill tone="available">Signed Uploaded</Pill>
                      ) : row.status === "GENERATED" ? (
                        <Pill tone="accent">Generated</Pill>
                      ) : (
                        <Pill tone="muted">Draft</Pill>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="secondary" size="sm" asChild>
                          <a
                            href={`/api/documents/agreement/${row.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View / Print Agreement PDF"
                          >
                            <Printer weight="light" className="mr-1 size-3.5" />
                            View / Print
                          </a>
                        </Button>
                        <Button variant="secondary" size="sm" asChild>
                          <a
                            href={`/api/documents/agreement/${row.id}/pdf?download=1`}
                            title="Download Agreement PDF"
                          >
                            <DownloadSimple weight="light" className="size-3.5" />
                          </a>
                        </Button>
                        <Button variant="primary" size="sm" asChild>
                          <Link href={`/agreements/${row.id}` as never}>
                            <UploadSimple weight="light" className="mr-1 size-3.5" />
                            Manage
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Agreement Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText weight="light" className="size-5 text-primary" />
              Create Sale &amp; Purchase Agreement
            </DialogTitle>
            <DialogDescription>
              Link a booking or sold unit to automatically populate the official
              SARDAR&apos;S MALL Sale &amp; Purchase Agreement, Schedule-A, and
              Schedule-B.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAgreement} className="space-y-4 py-2">
            <div>
              <Label className="mb-1 block text-[12px]">Linked Booking / Sale *</Label>
              <Select
                value={selectedCandidateKey}
                onValueChange={setSelectedCandidateKey}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a booking or sold unit…" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((c) => (
                    <SelectItem key={`${c.kind}:${c.id}`} value={`${c.kind}:${c.id}`}>
                      {c.unitDisplay} — {c.clientName} ({c.refNo} ·{" "}
                      {formatPkr(c.totalPricePkr)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-[12px]">Seller / Vendor Name *</Label>
                <Input
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label className="mb-1 block text-[12px]">Agreement Date *</Label>
                <Input
                  type="date"
                  value={agreementDate}
                  onChange={(e) => setAgreementDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label className="mb-1 block text-[12px]">
                  Anticipated Completion Date *
                </Label>
                <Input
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  placeholder="e.g. Feb-2029"
                  required
                />
              </div>
              <div>
                <Label className="mb-1 block text-[12px]">Buyer Nationality</Label>
                <Input
                  value={buyerNationality}
                  onChange={(e) => setBuyerNationality(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1 block text-[12px]">Nominee Nationality</Label>
                <Input
                  value={nomineeNationality}
                  onChange={(e) => setNomineeNationality(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1 block text-[12px]">Witness 1 Name</Label>
                <Input
                  value={witness1Name}
                  onChange={(e) => setWitness1Name(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label className="mb-1 block text-[12px]">Witness 2 Name</Label>
                <Input
                  value={witness2Name}
                  onChange={(e) => setWitness2Name(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1 block text-[12px]">Internal Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional notes regarding execution or stamp paper…"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={creating || !selectedCandidateKey}
              >
                {creating ? "Generating…" : "Create Agreement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
