"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowSquareOut,
  Check,
  DownloadSimple,
  FileText,
  Printer,
  UploadSimple,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" asChild>
            <Link href={"/agreements" as never}>
              <ArrowLeft weight="light" className="mr-1 size-3.5" />
              Agreements
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans tabular-nums text-[18px] font-bold text-primary">
                {agreement.agreementNo}
              </span>
              {agreement.status === "SIGNED_UPLOADED" ? (
                <Badge tone="available">Signed Uploaded</Badge>
              ) : (
                <Badge tone="accent">Generated</Badge>
              )}
            </div>
            <p className="text-[12px] text-ink-muted">
              {buyer.fullName} · {unit.unitDisplay} ({unit.floorName})
            </p>
          </div>
        </div>

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
      </div>

      {/* Linked Unit, Customer & Financials */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card space-y-2 p-4 text-[12px]">
          <div className="flex items-center justify-between border-b border-line pb-1.5">
            <h4 className="text-[13px] font-semibold text-ink">Linked Unit</h4>
            <Link
              href={`/units/${unit.id}` as never}
              className="unit-code font-sans tabular-nums font-bold text-primary hover:underline"
            >
              {unit.unitDisplay}
            </Link>
          </div>
          <p>
            <span className="text-ink-muted">Floor &amp; Category:</span>{" "}
            <strong>
              {unit.floorName} · {unit.categoryName}
            </strong>
          </p>
          <p>
            <span className="text-ink-muted">Gross Area:</span>{" "}
            <strong className="tabular-nums">{unit.grossAreaSqft} sq ft</strong>
          </p>
          {agreement.bookingId && (
            <p>
              <span className="text-ink-muted">Booking Ref:</span>{" "}
              <Link
                href={`/bookings/${agreement.bookingId}` as never}
                className="font-sans tabular-nums font-medium text-primary hover:underline"
              >
                {financials.bookingNo}
              </Link>
            </p>
          )}
        </div>

        <div className="card space-y-2 p-4 text-[12px]">
          <div className="flex items-center justify-between border-b border-line pb-1.5">
            <h4 className="text-[13px] font-semibold text-ink">Buyer &amp; Nominee</h4>
            <span className="font-sans tabular-nums text-[11px] text-ink-muted">{buyer.cnic}</span>
          </div>
          <p>
            <span className="text-ink-muted">Buyer:</span>{" "}
            <strong>
              {buyer.fullName} ({buyer.relationPrefix} {buyer.relationName})
            </strong>
          </p>
          <p>
            <span className="text-ink-muted">Contact:</span> {buyer.phone}
          </p>
          <p>
            <span className="text-ink-muted">Nominee:</span>{" "}
            {nominee ? `${nominee.name} (${nominee.cnic || "—"})` : "—"}
          </p>
        </div>

        <div className="card space-y-2 p-4 text-[12px]">
          <div className="flex items-center justify-between border-b border-line pb-1.5">
            <h4 className="text-[13px] font-semibold text-ink">Schedule Summary</h4>
            <span className="font-bold text-primary tabular-nums">
              {formatPkr(financials.totalPricePkr)}
            </span>
          </div>
          <p className="flex justify-between">
            <span className="text-ink-muted">Booking / Down Payment:</span>
            <strong className="tabular-nums">
              {formatPkr(financials.bookingAmountPkr)}
            </strong>
          </p>
          <p className="flex justify-between">
            <span className="text-ink-muted">Schedule Entries:</span>
            <strong className="tabular-nums">{scheduleRows.length} milestones</strong>
          </p>
          <p className="flex justify-between">
            <span className="text-ink-muted">Anticipated Completion:</span>
            <strong>{agreement.anticipatedCompletionDate}</strong>
          </p>
        </div>
      </div>

      {/* Main 2-column layout: Agreement Metadata Editor + Signed Copy Upload & PDF Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form onSubmit={handleSaveDetails} className="card space-y-4 p-5 lg:col-span-5">
          <h3 className="border-b border-line pb-2 text-[14px] font-semibold text-ink">
            Agreement Details (Template Fields)
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1 block text-[12px]">Seller / Vendor Name</Label>
              <Input
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="mb-1 block text-[12px]">Agreement Date</Label>
              <Input
                type="date"
                value={agreementDate}
                onChange={(e) => setAgreementDate(e.target.value)}
                required
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
              />
            </div>
            <div>
              <Label className="mb-1 block text-[12px]">Witness 2 Name</Label>
              <Input
                value={witness2Name}
                onChange={(e) => setWitness2Name(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1 block text-[12px]">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" disabled={saving}>
            <Check weight="bold" className="mr-1.5 size-4" />
            {saving ? "Saving…" : "Save Changes & Refresh PDF"}
          </Button>
        </form>

        {/* Signed Agreement Upload + Inline Preview */}
        <div className="space-y-6 lg:col-span-7">
          <div className="card space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
              <div>
                <h3 className="text-[14px] font-semibold text-ink">
                  Signed Agreement Copy
                </h3>
                <p className="text-[12px] text-ink-muted">
                  Upload the wet-signed / stamped copy (PDF or image, max 5 MB) to archive
                  against this customer and unit.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] border border-primary bg-primary px-3 py-1.5 text-[12px] font-medium text-white hover:bg-primary/90">
                <UploadSimple weight="bold" className="size-3.5" />
                <span>
                  {uploading
                    ? "Uploading…"
                    : agreement.signedStoragePath
                      ? "Replace Signed Copy"
                      : "Upload Signed Agreement"}
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
            </div>

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
          </div>

          {/* Live Generated Agreement PDF Preview */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-subtle/40 px-4 py-2.5">
              <span className="text-[13px] font-semibold text-ink">
                Live Agreement PDF Preview (Official Template)
              </span>
              <a
                href={pdfViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-medium text-primary hover:underline"
              >
                Open full screen
              </a>
            </div>
            <iframe
              title={`Agreement ${agreement.agreementNo}`}
              src={pdfViewUrl}
              className="h-[580px] w-full bg-subtle"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
