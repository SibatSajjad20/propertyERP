"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ColumnMapping,
  ImportColumnKey,
  ImportMode,
  MappingFieldMeta,
} from "../types";
import { EMPTY_COLUMN_MAPPING } from "../types";

interface ImportMappingStepProps {
  fileName: string;
  totalRows: number;
  headerRow?: number;
  blankSkipped?: number;
  summarySkipped?: number;
  sheetName?: string;
  sheetNames?: string[];
  onSheetChange?: (sheetName: string) => void;
  headers: string[];
  rawRows: Record<string, unknown>[];
  initialMapping: ColumnMapping;
  mappingFields?: Record<ImportColumnKey, MappingFieldMeta>;
  initialMode: ImportMode;
  initialCreateMissing?: boolean;
  onProceed: (
    mapping: ColumnMapping,
    mode: ImportMode,
    options: { createMissingStructure: boolean },
  ) => void;
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
    description: "Unique Unit #. Auto-generated from Floor + Unit No if blank or '-'",
  },
  {
    key: "floor",
    label: "Floor",
    required: true,
    description: "Floor name or level (e.g. Ground, Ground-Floor, 1st, 6th)",
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
    description: "Overall gross floor area in square feet (0 is treated as empty)",
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
    description:
      "AVAILABLE / SOLD. Amenities and Meeting Room become available + not sellable",
  },
  {
    key: "soldPricePkr",
    label: "Sold Price (PKR)",
    required: false,
    description: "Frozen transaction price (rate × net used as a warning fallback)",
  },
  {
    key: "category",
    label: "Category",
    required: false,
    description: "Asset class. Unknown names are kept and can be auto-created",
  },
  {
    key: "buyer",
    label: "Buyer / Ownership-1",
    required: false,
    description: "Primary ownership group (Ownership-1)",
  },
  {
    key: "subOwner",
    label: "Sub-owner / Ownership-2",
    required: false,
    description: "Sub Ownership-2",
  },
  {
    key: "notes",
    label: "Notes",
    required: false,
    description: "Internal ledger comments and spatial observations",
  },
];

function confidenceClass(level: MappingFieldMeta["confidence"] | undefined) {
  if (level === "high") return "text-available";
  if (level === "medium") return "text-reserved";
  if (level === "low") return "text-ink-muted";
  return "text-ink-faint";
}

export function ImportMappingStep({
  fileName,
  totalRows,
  headerRow,
  blankSkipped,
  summarySkipped,
  sheetName,
  sheetNames,
  onSheetChange,
  headers,
  rawRows,
  initialMapping,
  mappingFields,
  initialMode,
  initialCreateMissing = true,
  onProceed,
  onBack,
}: ImportMappingStepProps) {
  const [mapping, setMapping] = React.useState<ColumnMapping>(
    initialMapping ?? EMPTY_COLUMN_MAPPING,
  );
  const [mode, setMode] = React.useState<ImportMode>(initialMode);
  const [createMissing, setCreateMissing] = React.useState(initialCreateMissing);

  const sampleRow = rawRows[0] ?? {};

  const handleSelect = (key: ImportColumnKey, val: string) => {
    setMapping((prev) => ({
      ...prev,
      [key]: val === "__none__" ? null : val,
    }));
  };

  const handleContinue = () => {
    onProceed(mapping, mode, { createMissingStructure: createMissing });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[8px] border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            Uploaded file
          </span>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-[13px] font-medium text-ink">{fileName}</span>
            <span className="text-[12px] text-ink-muted">({totalRows} data rows)</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-muted">
            Header row {headerRow ?? 1}
            {blankSkipped ? ` · ${blankSkipped} blank skipped` : ""}
            {summarySkipped ? ` · ${summarySkipped} summary skipped` : ""}
          </p>
        </div>

        {sheetNames && sheetNames.length > 1 ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              Sheet
            </span>
            <Select value={sheetName} onValueChange={(val) => onSheetChange?.(val)}>
              <SelectTrigger className="w-[220px]" aria-label="Spreadsheet sheet">
                <SelectValue placeholder="Select sheet" />
              </SelectTrigger>
              <SelectContent>
                {sheetNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            Import mode
          </span>
          <div className="inline-flex rounded-[6px] border border-line bg-subtle p-0.5">
            {(
              [
                ["CREATE_ONLY", "Create only"],
                ["CREATE_AND_UPDATE", "Create + update"],
                ["UPSERT", "Upsert by unit code"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-[4px] px-3 py-1 text-[12px] font-medium transition-colors ${
                  mode === value
                    ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px] text-ink">
        <Checkbox
          checked={createMissing}
          onCheckedChange={(checked) => setCreateMissing(Boolean(checked))}
          aria-label="Auto-create missing floors and categories"
        />
        Auto-create missing floors and categories
      </label>

      <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
        <div className="border-b border-line bg-subtle/30 px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-ink">Column Mapping</h2>
          <p className="text-[11px] text-ink-muted">
            Review auto-detected headers, confidence, and sample values.
          </p>
        </div>

        <div className="divide-y divide-line">
          {FIELDS.map((field) => {
            const currentSelected = mapping[field.key] ?? "__none__";
            const sampleValue =
              currentSelected !== "__none__" && sampleRow[currentSelected] !== undefined
                ? String(sampleRow[currentSelected])
                : (mappingFields?.[field.key]?.sample ?? null);
            const confidence = mappingFields?.[field.key]?.confidence ?? "none";

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
                    <span
                      className={`text-[10px] font-medium tracking-wide uppercase ${confidenceClass(confidence)}`}
                    >
                      {confidence}
                    </span>
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
