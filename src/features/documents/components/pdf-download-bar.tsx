"use client";

import * as React from "react";
import { DownloadSimple, Printer } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export function PdfDownloadBar({
  href,
  printLabel,
  onPrint,
}: {
  href: string;
  printLabel: string;
  onPrint: () => void;
}) {
  const [appendix, setAppendix] = React.useState(true);
  const url = appendix ? `${href}?appendix=1` : `${href}?appendix=0`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="md" onClick={onPrint} className="gap-1.5">
        <Printer weight="light" className="size-4" />
        {printLabel}
      </Button>
      <Button variant="primary" size="md" asChild>
        <a href={url} className="gap-1.5">
          <DownloadSimple weight="light" className="size-4" />
          Download PDF
        </a>
      </Button>
      <label className="flex items-center gap-1.5 text-[12px] text-ink-muted">
        <Checkbox
          checked={appendix}
          onCheckedChange={(value) => setAppendix(value === true)}
        />
        Include CNIC appendix
      </label>
    </div>
  );
}
