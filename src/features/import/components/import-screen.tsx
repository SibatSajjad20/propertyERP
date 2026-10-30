"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  commitImportBatch,
  getImportBatches,
  rollbackLatestBatch,
  uploadAndParseSpreadsheet,
} from "../actions";
import type {
  ColumnMapping,
  ImportBatchSummary,
  ImportMode,
  ImportValidationResult,
  ParsedSpreadsheet,
} from "../types";
import { validateImportBatch, type ImportDbContext } from "../validation";
import { ImportBatchHistory } from "./import-batch-history";
import { ImportMappingStep } from "./import-mapping-step";
import { ImportPreviewTable } from "./import-preview-table";
import { ImportUploadDropzone } from "./import-upload-dropzone";

interface ImportScreenProps {
  initialBatches: ImportBatchSummary[];
}

type ImportStep = "upload" | "mapping" | "preview";

export function ImportScreen({ initialBatches }: ImportScreenProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<ImportStep>("upload");
  const [batches, setBatches] = React.useState<ImportBatchSummary[]>(initialBatches);

  const [parsedData, setParsedData] = React.useState<ParsedSpreadsheet | null>(null);
  const [context, setContext] = React.useState<ImportDbContext | null>(null);
  const [mapping, setMapping] = React.useState<ColumnMapping | null>(null);
  const [mode, setMode] = React.useState<ImportMode>("CREATE_AND_UPDATE");
  const [validationResult, setValidationResult] =
    React.useState<ImportValidationResult | null>(null);

  const [uploading, setUploading] = React.useState(false);
  const [committing, setCommitting] = React.useState(false);
  const [rollingBack, setRollingBack] = React.useState(false);

  const handleFileSelected = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadAndParseSpreadsheet(formData);

      setParsedData({
        fileName: res.fileName,
        sheetName: res.sheetName,
        headers: res.headers,
        rawRows: res.rawRows,
        totalRows: res.totalRows,
      });
      setContext(res.context);
      setMapping(res.mapping);
      setStep("mapping");
      toast.success(`Spreadsheet parsed: ${res.totalRows} records found.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to parse file.";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleProceedFromMapping = (newMapping: ColumnMapping, newMode: ImportMode) => {
    if (!parsedData || !context) return;

    setMapping(newMapping);
    setMode(newMode);

    const valResult = validateImportBatch(
      parsedData.rawRows,
      newMapping,
      context,
      newMode,
    );

    setValidationResult(valResult);
    setStep("preview");

    if (valResult.errorCount > 0) {
      toast.warning(
        `Preview ready: ${valResult.validCount} valid, ${valResult.warningCount} warnings, ${valResult.errorCount} errors.`,
      );
    } else {
      toast.success(
        `Preview ready: All ${valResult.validCount + valResult.warningCount} rows are ready to commit.`,
      );
    }
  };

  const handleCommit = async () => {
    if (!parsedData || !validationResult || !mapping) return;

    setCommitting(true);
    try {
      const validCleanedRows = validationResult.rows
        .map((r) => r.cleaned)
        .filter((r): r is NonNullable<typeof r> => r !== null);

      const res = await commitImportBatch({
        fileName: parsedData.fileName,
        mode,
        mapping,
        rows: validCleanedRows,
      });

      toast.success(
        `Import complete: ${res.createdCount} units created, ${res.updatedCount} updated.`,
      );

      setBatches(await getImportBatches());
      router.refresh();

      // Reset wizard to upload
      setStep("upload");
      setParsedData(null);
      setValidationResult(null);
      setMapping(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to commit import batch.";
      toast.error(msg);
    } finally {
      setCommitting(false);
    }
  };

  const handleDownloadErrors = async () => {
    if (!parsedData || !validationResult) return;

    const errorRows = validationResult.rows.filter((r) => r.status === "ERROR");
    if (errorRows.length === 0) return;

    try {
      const res = await fetch("/api/import/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers: parsedData.headers,
          errorRows,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to download error workbook.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `import-errors-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Error rows downloaded as .xlsx");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to download error rows.";
      toast.error(msg);
    }
  };

  const handleRollback = async (batchId: string) => {
    setRollingBack(true);
    try {
      await rollbackLatestBatch({ batchId });
      toast.success("Latest import batch soft-reverted successfully.");
      setBatches(await getImportBatches());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to rollback batch.";
      toast.error(msg);
      throw err;
    } finally {
      setRollingBack(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink">
            Batch Import Pipeline
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Ingest master property spreadsheets via SheetJS parser, map columns, and
            verify ledger invariants.
          </p>
        </div>
        <Button variant="secondary" size="md" asChild>
          <a href="/api/export/full">Full export</a>
        </Button>

        {/* Wizard step breadcrumb */}
        {step !== "upload" && (
          <div className="flex items-center gap-2 text-[12px] font-medium text-ink-muted">
            <span>Upload</span>
            <span>→</span>
            <span className={step === "mapping" ? "font-semibold text-primary" : ""}>
              Mapping
            </span>
            <span>→</span>
            <span className={step === "preview" ? "font-semibold text-primary" : ""}>
              Validation
            </span>
          </div>
        )}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <ImportUploadDropzone onFileSelected={handleFileSelected} loading={uploading} />
      )}

      {/* Step 2: Mapping */}
      {step === "mapping" && parsedData && (
        <ImportMappingStep
          fileName={parsedData.fileName}
          totalRows={parsedData.totalRows}
          headers={parsedData.headers}
          rawRows={parsedData.rawRows}
          initialMapping={
            mapping ?? {
              unitCode: null,
              unitNumber: null,
              floor: null,
              block: null,
              category: null,
              netAreaSqft: null,
              grossAreaSqft: null,
              ratePerSqftPkr: null,
              status: null,
              buyer: null,
              soldPricePkr: null,
              notes: null,
            }
          }
          initialMode={mode}
          onProceed={handleProceedFromMapping}
          onBack={() => setStep("upload")}
        />
      )}

      {/* Step 3: Validation Preview */}
      {step === "preview" && parsedData && validationResult && (
        <ImportPreviewTable
          fileName={parsedData.fileName}
          mode={mode}
          rows={validationResult.rows}
          headers={parsedData.headers}
          onCommit={handleCommit}
          onRemap={() => setStep("mapping")}
          onDownloadErrors={handleDownloadErrors}
          committing={committing}
        />
      )}

      {/* Batch history table */}
      <ImportBatchHistory
        batches={batches}
        onRollback={handleRollback}
        rollingBack={rollingBack}
      />
    </div>
  );
}
