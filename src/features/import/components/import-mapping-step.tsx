"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ColumnMapping, ImportColumnKey, ImportMode } from "../types";

interface ImportMappingStepProps {
  fileName: string;
  totalRows: number;
  headers: string[];
  rawRows: Record<string, unknown>[];
  initialMapping: ColumnMapping;
  initialMode: ImportMode;
  onProceed: (mapping: ColumnMapping, mode: ImportMode) => void;
  onBack: () => void;
}

interface FieldDef {
  key: ImportColumnKey;
  label: string;
  required: boolean;
  description: string;
}

const FIELDS: FieldDef[] = [
  {
    key: "unitNumber",
    label: "Unit Number",
    required: true,
    description: "Alphanumeric unit identifier (e.g. RA33, S12, OF6)",
  },
  {
    key: "unitCode",
    label: "Unit Code",
    required: false,
    description: "Unique code. Auto-generated from Floor + Unit No if unmapped",
  },
  {
    key: "floor",
    label: "Floor",
    required: true,
    description: "Floor name or level (e.g. Ground, 1st, 6th)",
  },
  {
    key: "block",
    label: "Block",
    required: false,
    description: "Architectural block name (defaults to 'Main')",
  },
  {
    key: "netAreaSqft",
    label: "Net Area (sq ft)",
    required: true,
    description: "Primary sellable area in square feet",
  },
  {
    key: "grossAreaSqft",
    label: "Gross Area (sq ft)",
    required: false,
    description: "Overall gross floor area in square feet",
  },
  {
    key: "ratePerSqftPkr",
    label: "Rate per sq ft (PKR)",
    required: true,
    description: "Unit asking rate in Pakistani Rupees",
  },
  {
    key: "status",
    label: "Status",
    required: false,
    description: "Availability status (AVAILABLE / SOLD)",
  },
  {
    key: "soldPricePkr",
    label: "Sold Price (PKR)",
    required: false,
    description: "Frozen transaction price (required if status is SOLD)",
  },
  {
    key: "category",
    label: "Category",
    required: false,
    description: "Asset class: Shop, Food Court, Kiosk, Office, Amenities",
  },
  {
    key: "buyer",
    label: "Buyer / Ownership",
    required: false,
    description: "Purchaser, booking reference, or ownership group",
  },
  {
    key: "notes",
    label: "Notes",
    required: false,
    description: "Internal ledger comments and spatial observations",
  },
];

export function ImportMappingStep({
  fileName,
  totalRows,
  headers,
  rawRows,
  initialMapping,
  initialMode,
  onProceed,
  onBack,
}: ImportMappingStepProps) {
  const [mapping, setMapping] = React.useState<ColumnMapping>(initialMapping);
  const [mode, setMode] = React.useState<ImportMode>(initialMode);

  const sampleRow = rawRows[0] ?? {};

  const handleSelect = (key: ImportColumnKey, val: string) => {
    setMapping((prev) => ({
      ...prev,
      [key]: val === "__none__" ? null : val,
    }));
  };

  const handleContinue = () => {
    onProceed(mapping, mode);
  };

  return (
    <div className="space-y-6">
      {/* File summary and mode selection */}
      <div className="flex flex-col gap-4 rounded-[8px] border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            Uploaded file
          </span>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-[13px] font-medium text-ink">{fileName}</span>
            <span className="text-[12px] text-ink-muted">({totalRows} data rows)</span>
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            Import mode
          </span>
          <div className="inline-flex rounded-[6px] border border-line bg-subtle p-0.5">
            <button
              type="button"
              onClick={() => setMode("CREATE_ONLY")}
              className={`rounded-[4px] px-3 py-1 text-[12px] font-medium transition-colors ${
                mode === "CREATE_ONLY"
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Create new only
            </button>
            <button
              type="button"
              onClick={() => setMode("CREATE_AND_UPDATE")}
              className={`rounded-[4px] px-3 py-1 text-[12px] font-medium transition-colors ${
                mode === "CREATE_AND_UPDATE"
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Create + update existing
            </button>
          </div>
        </div>
      </div>

      {/* Column mapping grid */}
      <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
        <div className="border-b border-line bg-subtle/30 px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-ink">Column Mapping</h2>
          <p className="text-[11px] text-ink-muted">
            Review auto-detected headers and adjust assignments using the dropdowns.
          </p>
        </div>

        <div className="divide-y divide-line">
          {FIELDS.map((field) => {
            const currentSelected = mapping[field.key] ?? "__none__";
            const sampleValue =
              currentSelected !== "__none__" && sampleRow[currentSelected] !== undefined
                ? String(sampleRow[currentSelected])
                : null;

            return (
              <div
                key={field.key}
                className="grid grid-cols-1 items-center gap-4 px-5 py-3 transition-colors hover:bg-subtle/20 md:grid-cols-12"
              >
                <div className="md:col-span-5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-ink">
                      {field.label}
                    </span>
                    {field.required ? (
                      <span className="text-[11px] font-medium text-sold">*required</span>
                    ) : (
                      <span className="text-[11px] text-ink-faint">optional</span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-muted">{field.description}</p>
                </div>

                <div className="md:col-span-4">
                  <Select
                    value={currentSelected}
                    onValueChange={(val) => handleSelect(field.key, val)}
                  >
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        <span className="text-ink-muted">
                          {field.key === "unitCode"
                            ? "(Auto-generate from floor + unit)"
                            : "(Unmapped)"}
                        </span>
                      </SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="truncate text-[12px] md:col-span-3">
                  {sampleValue !== null && sampleValue !== "" ? (
                    <span className="rounded-[4px] border border-line bg-subtle px-1.5 py-0.5 font-mono text-ink-muted">
                      Sample:{" "}
                      {sampleValue.length > 24
                        ? `${sampleValue.slice(0, 24)}…`
                        : sampleValue}
                    </span>
                  ) : (
                    <span className="text-[11px] text-ink-faint">No sample value</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation action bar */}
      <div className="flex items-center justify-between border-t border-line pt-4">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft weight="light" className="size-4" />}
          onClick={onBack}
        >
          Back to file
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          rightIcon={<ArrowRight weight="light" className="size-4" />}
          onClick={handleContinue}
        >
          Proceed to validation preview
        </Button>
      </div>
    </div>
  );
}
