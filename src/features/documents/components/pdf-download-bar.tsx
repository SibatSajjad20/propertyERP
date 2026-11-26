"use client";

import * as React from "react";
import { DownloadSimple, Printer } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export function PdfDownloadBar({
  href,
  printLabel = "Print",
  onPrint,
}: {
  href: string;
  printLabel?: string;
  onPrint?: () => void;
}) {
  const [appendix, setAppendix] = React.useState(true);
  const viewUrl = `${href}?appendix=${appendix ? "1" : "0"}`;
  const downloadUrl = `${href}?appendix=${appendix ? "1" : "0"}&download=1`;

  return (
    <>
      {onPrint ? (
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onPrint}
          className="h-9 gap-1.5 text-[13px] font-medium"
        >
          <Printer weight="light" className="size-4" />
          {printLabel}
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="md"
          asChild
          className="h-9 gap-1.5 text-[13px] font-medium"
        >
          <a href={viewUrl} target="_blank" rel="noopener noreferrer">
            <Printer weight="light" className="size-4" />
            {printLabel}
          </a>
        </Button>
      )}

      <Button
        variant="secondary"
        size="md"
        asChild
        className="h-9 gap-1.5 text-[13px] font-medium"
      >
        <a href={downloadUrl} download>
          <DownloadSimple weight="light" className="size-4" />
          Download PDF
        </a>
      </Button>

      <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[8px] border border-border bg-surface px-3 text-[12px] font-medium text-ink-muted shadow-xs transition-colors select-none hover:bg-bg hover:text-ink">
        <Checkbox
          checked={appendix}
          onCheckedChange={(value) => setAppendix(value === true)}
        />
        <span>Include CNIC appendix</span>
      </label>
    </>
  );
}
