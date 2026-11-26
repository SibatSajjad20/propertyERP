"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/cn";
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
  MappingFieldMeta,
  ParsedSpreadsheet,
} from "../types";
import { EMPTY_COLUMN_MAPPING } from "../types";
import { validateImportBatch, type ImportDbContext } from "../validation";
import { ImportBatchHistory } from "./import-batch-history";
import { ImportMappingStep } from "./import-mapping-step";
import { ImportPreviewTable } from "./import-preview-table";
import { ImportUploadDropzone } from "./import-upload-dropzone";
import type { ImportColumnKey } from "../types";

interface ImportScreenProps {
  initialBatches: ImportBatchSummary[];
}

type ImportStep = "upload" | "mapping" | "preview";

type ParsedUpload = ParsedSpreadsheet & {
  mappingFields?: Record<ImportColumnKey, MappingFieldMeta>;
};

export function ImportScreen({ initialBatches }: ImportScreenProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<ImportStep>("upload");
  const [batches, setBatches] = React.useState<ImportBatchSummary[]>(initialBatches);
  const [sourceFile, setSourceFile] = React.useState<File | null>(null);

  const [parsedData, setParsedData] = React.useState<ParsedUpload | null>(null);
  const [context, setContext] = React.useState<ImportDbContext | null>(null);
  const [mapping, setMapping] = React.useState<ColumnMapping | null>(null);
  const [mappingFields, setMappingFields] = React.useState<
    Record<ImportColumnKey, MappingFieldMeta> | undefined
  >();
  const [mode, setMode] = React.useState<ImportMode>("CREATE_AND_UPDATE");
  const [createMissingStructure, setCreateMissingStructure] = React.useState(true);
  const [validationResult, setValidationResult] =
    React.useState<ImportValidationResult | null>(null);

  const [uploading, setUploading] = React.useState(false);
  const [committing, setCommitting] = React.useState(false);
  const [rollingBack, setRollingBack] = React.useState(false);

  const applyParseResult = (
    res: Awaited<ReturnType<typeof uploadAndParseSpreadsheet>>,
  ) => {
    setParsedData({
      fileName: res.fileName,
      sheetName: res.sheetName,
      sheetNames: res.sheetNames,
      headers: res.headers,
      rawRows: res.rawRows,
      totalRows: res.totalRows,
      headerRow: res.headerRow,
      dataRows: res.dataRows,
      blankSkipped: res.blankSkipped,
      summarySkipped: res.summarySkipped,
      mappingFields: res.mappingFields,
    });
    setContext(res.context);
    setMapping(res.mapping);
    setMappingFields(res.mappingFields);
  };

  const parseFile = async (file: File, sheetName?: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (sheetName) formData.append("sheetName", sheetName);

      const res = await uploadAndParseSpreadsheet(formData);
      applyParseResult(res);
      setStep("mapping");
      toast.success(
        `Spreadsheet parsed: ${res.sheetName} · ${res.dataRows} data rows (header row ${res.headerRow}).`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to parse file.";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelected = async (file: File) => {
    setSourceFile(file);
    await parseFile(file);
  };

  const handleSheetChange = async (sheetName: string) => {
    if (!sourceFile) return;
    await parseFile(sourceFile, sheetName);
  };

  const handleProceedFromMapping = (
    newMapping: ColumnMapping,
    newMode: ImportMode,
    options: { createMissingStructure: boolean },
  ) => {
    if (!parsedData || !context) return;

    setMapping(newMapping);
    setMode(newMode);
    setCreateMissingStructure(options.createMissingStructure);

    const valResult = validateImportBatch(
      parsedData.rawRows,
      newMapping,
      context,
      newMode,
      { createMissingStructure: options.createMissingStructure },
    );

    setValidationResult(valResult);
    setStep("preview");

    const sum =
      valResult.validCount +
      valResult.warningCount +
      valResult.errorCount +
      valResult.skippedCount;
    toast[valResult.errorCount > 0 ? "warning" : "success"](
      `Preview ready: ${valResult.validCount} valid, ${valResult.warningCount} warnings, ${valResult.errorCount} errors, ${valResult.skippedCount} skipped (${sum}/${valResult.totalCount}).`,
    );
  };

  const handleCommit = async () => {
    if (!parsedData || !validationResult || !mapping) return;

    setCommitting(true);
    try {
      const importableRows = validationResult.rows
        .filter((r) => r.status === "VALID" || r.status === "WARNING")
        .map((r) => r.cleaned)
        .filter((r): r is NonNullable<typeof r> => r !== null);

      const res = await commitImportBatch({
        fileName: parsedData.fileName,
        mode,
        mapping,
        rows: importableRows,
        createMissingStructure,
      });

      toast.success(
        `Import complete: ${res.totalCount} rows · ${res.createdCount} created, ${res.updatedCount} updated, ${res.skippedCount} skipped, ${res.errorCount} errors.`,
      );

      setBatches(await getImportBatches());
      router.refresh();

      setStep("upload");
      setParsedData(null);
      setValidationResult(null);
      setMapping(null);
      setSourceFile(null);
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
      toast.success("Latest import batch reverted successfully.");
      setBatches(await getImportBatches());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to rollback batch.";
      toast.error(msg);
      throw err;
    } finally {
      setRollingBack(false);
    }
  };

  const currentStepIdx = committing
    ? 3
    : step === "preview"
      ? 2
      : step === "mapping"
        ? 1
        : 0;

  const stepperItems = [
    { id: "upload", label: "Upload file" },
    { id: "mapping", label: "Map columns" },
    { id: "preview", label: "Review rows" },
    { id: "import", label: "Import" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      <PageHeader
        title="Batch Import Pipeline"
        description="Upload spreadsheets (.xlsx or .csv) to create or update units, map columns, and verify data before importing."
        actions={
          <Button variant="secondary" size="md" asChild>
            <a href="/api/export/full">Full export</a>
          </Button>
        }
      />

      {/* 4-Step Stepper */}
      <div className="flex items-center gap-6 border-b border-line pb-3">
        {stepperItems.map((s, idx) => {
          const isDone = idx < currentStepIdx;
          const isActive = idx === currentStepIdx;

          return (
            <div
              key={s.id}
              className={cn(
                "relative flex items-center gap-2 pb-2 text-[13px] transition-colors select-none",
                isActive
                  ? "font-semibold text-primary after:absolute after:inset-x-0 after:bottom-[-13px] after:h-[2px] after:bg-primary"
                  : isDone
                    ? "font-medium text-ink"
                    : "text-muted",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[11px] font-semibold",
                  isDone
                    ? "bg-primary text-white"
                    : isActive
                      ? "border border-primary text-primary"
                      : "border border-line text-muted",
                )}
              >
                {isDone ? <Check weight="bold" className="size-3" /> : idx + 1}
              </span>
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>

      {step === "upload" && (
        <ImportUploadDropzone onFileSelected={handleFileSelected} loading={uploading} />
      )}

      {step === "mapping" && parsedData && (
        <ImportMappingStep
          fileName={parsedData.fileName}
          totalRows={parsedData.dataRows}
          headerRow={parsedData.headerRow}
          blankSkipped={parsedData.blankSkipped}
          summarySkipped={parsedData.summarySkipped}
          sheetName={parsedData.sheetName}
          sheetNames={parsedData.sheetNames}
          onSheetChange={handleSheetChange}
          headers={parsedData.headers}
          rawRows={parsedData.rawRows}
          initialMapping={mapping ?? EMPTY_COLUMN_MAPPING}
          mappingFields={mappingFields}
          initialMode={mode}
          initialCreateMissing={createMissingStructure}
          onProceed={handleProceedFromMapping}
          onBack={() => setStep("upload")}
        />
      )}

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

      <ImportBatchHistory
        batches={batches}
        onRollback={handleRollback}
        rollingBack={rollingBack}
      />
    </div>
  );
}
