"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowSquareOut,
  Check,
  DownloadSimple,
  FileText,
  Printer,
  UploadSimple,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatStrip, StatCell } from "@/components/ui/stat-strip";
import { Panel } from "@/components/ui/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { formatPkr } from "@/lib/money";
import {
  completeSignedAgreementUpload,
  createSignedAgreementUploadUrl,
  updateAgreement,
} from "../actions";
import type { getAgreementDetail } from "../queries";

type AgreementDetailData = NonNullable<Awaited<ReturnType<typeof getAgreementDetail>>>;

export function AgreementDetailScreen({ data }: { data: AgreementDetailData }) {
  const router = useRouter();
  const { agreement, unit, buyer, nominee, financials, scheduleRows, signedDownloadUrl } =
    data;

  const [sellerName, setSellerName] = React.useState(agreement.sellerName);
  const [agreementDate, setAgreementDate] = React.useState(
    agreement.agreementDate.slice(0, 10),
  );
  const [completionDate, setCompletionDate] = React.useState(
    agreement.anticipatedCompletionDate,
  );
  const [buyerNationality, setBuyerNationality] = React.useState(
    agreement.buyerNationality,
  );
  const [nomineeNationality, setNomineeNationality] = React.useState(
    agreement.nomineeNationality,
  );
  const [witness1Name, setWitness1Name] = React.useState(agreement.witness1Name ?? "");
  const [witness2Name, setWitness2Name] = React.useState(agreement.witness2Name ?? "");
  const [notes, setNotes] = React.useState(agreement.notes ?? "");
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAgreement({
        id: agreement.id,
        sellerName,
        agreementDate,
        anticipatedCompletionDate: completionDate,
        buyerNationality,
        nomineeNationality,
        witness1Name: witness1Name || null,
        witness2Name: witness2Name || null,
        notes: notes || null,
      });
      toast.success("Agreement details updated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save agreement");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadSignedFile(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Signed agreement file must be under 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const uploadMeta = await createSignedAgreementUploadUrl({
        agreementId: agreement.id,
        mimeType: file.type,
        fileName: file.name,
        sizeBytes: file.size,
      });

      const putRes = await fetch(uploadMeta.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error("Failed to upload signed agreement to storage.");
      }

      await completeSignedAgreementUpload({
        agreementId: agreement.id,
        storagePath: uploadMeta.storagePath,
        mimeType: file.type,
        fileName: file.name,
      });
      toast.success("Signed agreement uploaded successfully!");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload signed agreement",
      );
    } finally {
      setUploading(false);
    }
  }

  const pdfViewUrl = `/api/documents/agreement/${agreement.id}/pdf`;
  const pdfDownloadUrl = `/api/documents/agreement/${agreement.id}/pdf?download=1`;

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-5 pb-16">
      <PageHeader
        back={{ href: "/agreements", label: "Agreements" }}
        idTitle={true}
        title={agreement.agreementNo}
        badge={
          <Pill tone={agreement.status === "SIGNED_UPLOADED" ? "available" : "accent"}>
            {agreement.status === "SIGNED_UPLOADED" ? "Signed Uploaded" : "Generated"}
          </Pill>
        }
        description={`${buyer.title ? `${buyer.title}. ` : ""}${buyer.fullName} · ${unit.unitDisplay} (${unit.floorName})`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="md" asChild>
              <a href={pdfViewUrl} target="_blank" rel="noopener noreferrer">
                <Printer weight="light" className="mr-1.5 size-4" />
                View / Print PDF
              </a>
            </Button>
            <Button variant="primary" size="md" asChild>
              <a href={pdfDownloadUrl}>
                <DownloadSimple weight="light" className="mr-1.5 size-4" />
                Download Agreement PDF
              </a>
            </Button>
          </div>
        }
      />

      {/* Linked Unit, Customer & Financials StatStrip */}
      <StatStrip columns={3}>
        <StatCell
          label="Linked Unit"
          value={unit.unitDisplay}
          subLine={`${unit.floorName} · ${unit.categoryName} · ${unit.grossAreaSqft} sq ft`}
        />
        <StatCell
          label="Registered Buyer"
          value={buyer.fullName}
          subLine={`${buyer.cnic} · ${buyer.phone}${nominee ? ` · Nominee: ${nominee.name}` : ""}`}
        />
        <StatCell
          label="Schedule Summary"
          value={formatPkr(financials.totalPricePkr)}
          subLine={`Down Payment: ${formatPkr(financials.bookingAmountPkr)} · ${scheduleRows.length} milestones`}
        />
      </StatStrip>

      {/* Main 2-column layout: Agreement Details + Signed Upload & PDF Preview */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Left column: Template Fields */}
        <div className="lg:col-span-5">
          <Panel
            title="Agreement Details"
            hint="Template parameters used to populate legal clauses"
          >
            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div>
                <Label className="mb-1 block text-[12px]">Seller / Vendor Name</Label>
                <Input
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-[12px]">Agreement Date</Label>
                  <DatePicker
                    value={agreementDate}
                    onChange={(val) => setAgreementDate(val)}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-[12px]">Completion Date</Label>
                  <Input
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <Label className="mb-1 block text-[12px]">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional notes regarding execution or stamp paper…"
                />
              </div>

              <Button type="submit" variant="primary" size="md" disabled={saving}>
                <Check weight="bold" className="mr-1.5 size-4" />
                {saving ? "Saving…" : "Save Changes & Refresh PDF"}
              </Button>
            </form>
          </Panel>
        </div>

        {/* Right column: Signed Agreement Upload + Live PDF Preview */}
        <div className="space-y-5 lg:col-span-7">
          <Panel
            title="Signed Agreement Copy"
            hint="Wet-signed / stamped copy (PDF or image, max 5 MB)"
            actions={
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] border border-primary bg-primary px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:bg-primary/90">
                <UploadSimple weight="bold" className="size-3.5" />
                <span>
                  {uploading
                    ? "Uploading…"
                    : agreement.signedStoragePath
                      ? "Replace Signed Copy"
                      : "Upload Signed Copy"}
                </span>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    void handleUploadSignedFile(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
              </label>
            }
          >
            {agreement.signedStoragePath && signedDownloadUrl ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-available/30 bg-available/5 p-3.5">
                <div className="flex items-center gap-2.5">
                  <FileText weight="light" className="size-6 text-available" />
                  <div>
                    <p className="text-[13px] font-semibold text-ink">
                      {agreement.signedFileName || "Signed Agreement"}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      Uploaded{" "}
                      {agreement.signedUploadedAt
                        ? new Date(agreement.signedUploadedAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" asChild>
                    <a href={signedDownloadUrl} target="_blank" rel="noopener noreferrer">
                      View / Print
                      <ArrowSquareOut weight="light" className="ml-1 size-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-[8px] border border-dashed border-line bg-subtle/40 py-6 text-center text-[12px] text-ink-muted">
                No signed copy uploaded yet. Print the generated PDF below, collect
                signatures &amp; witness details, then upload the scanned copy here.
              </div>
            )}
          </Panel>

          {/* Live Generated Agreement PDF Preview */}
          <Panel
            title="Live Agreement PDF Preview"
            hint="Official Sardar's Mall template"
            actions={
              <a
                href={pdfViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-medium text-primary hover:underline"
              >
                Open full screen
              </a>
            }
          >
            <iframe
              title={`Agreement ${agreement.agreementNo}`}
              src={pdfViewUrl}
              className="h-[580px] w-full rounded-[6px] border border-[var(--line)] bg-subtle"
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
