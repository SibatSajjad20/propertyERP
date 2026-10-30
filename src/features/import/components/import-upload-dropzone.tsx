"use client";

import * as React from "react";
import { FileXls, UploadSimple, DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

interface ImportUploadDropzoneProps {
  onFileSelected: (file: File) => void;
  loading: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export function ImportUploadDropzone({
  onFileSelected,
  loading,
}: ImportUploadDropzoneProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Max limit is 5 MB.`,
      );
      return;
    }
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".xlsx") && !ext.endsWith(".xls") && !ext.endsWith(".csv")) {
      toast.error("Invalid file format. Please upload a .xlsx, .xls, or .csv document.");
      return;
    }
    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      "Unit Code,Unit No,Floor,Block,Category,Net Area (sq ft),Gross Area (sq ft),Rate (PKR),Status,Sold Price,Buyer,Notes\n" +
      "6F-RA33,RA33,6th,Main,Shop,265.00,290.00,Rs 18,500,AVAILABLE,,,Corner unit facing atrium\n" +
      "6F-RA35,RA35,6th,Main,Shop,248.00,270.00,18500,AVAILABLE,,,Standard shop\n" +
      "GF-FC1,FC1,Ground,Main,Food Court,420.00,465.00,18500,SOLD,Rs 77,70,000,Khan Foods,Food court stall 1\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sardars-mall-units-sample.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Sample template downloaded");
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !loading && fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-[8px] border-2 border-dashed p-10 text-center transition-colors select-none",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-line-strong bg-surface hover:border-ink-muted",
          loading && "pointer-events-none cursor-wait opacity-50",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleChange}
          disabled={loading}
        />

        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-subtle text-primary">
          <FileXls weight="light" className="size-6" />
        </div>

        <h3 className="text-[14px] font-medium text-ink">
          {loading ? "Parsing spreadsheet..." : "Choose a spreadsheet or drag & drop"}
        </h3>
        <p className="mt-1 max-w-sm text-[12px] text-ink-muted">
          Upload an Excel (<span className="font-mono">.xlsx</span>,{" "}
          <span className="font-mono">.xls</span>) or{" "}
          <span className="font-mono">.csv</span> schedule. Max file size: 5 MB.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={loading}
            leftIcon={<UploadSimple weight="light" className="size-4 text-primary" />}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Browse files
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={<DownloadSimple weight="light" className="size-4 text-ink-muted" />}
            onClick={(e) => {
              e.stopPropagation();
              downloadSampleTemplate();
            }}
          >
            Sample template
          </Button>
        </div>
      </div>
    </div>
  );
}
