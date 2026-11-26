"use client";

import * as React from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type SignatoryOption = {
  id: string;
  name: string;
  designation: string;
};

export function DownPaymentReceiptButton({
  href,
  signatories,
  hasPayments,
}: {
  href: string;
  signatories: SignatoryOption[];
  hasPayments: boolean;
}) {
  const defaultId = signatories[0]?.id ?? "";
  const [open, setOpen] = React.useState(false);
  const [signatoryId, setSignatoryId] = React.useState(defaultId);

  const downloadHref = `${href}?signatory=${encodeURIComponent(signatoryId || defaultId)}`;

  const trigger = (
    <Button
      type="button"
      variant="secondary"
      size="md"
      disabled={!hasPayments || signatories.length === 0}
      onClick={() => hasPayments && setOpen(true)}
      className="h-9 gap-1.5 text-[13px] font-medium"
    >
      <DownloadSimple weight="light" className="size-4" />
      Down payment receipt
    </Button>
  );

  return (
    <>
      {hasPayments ? (
        trigger
      ) : (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center">{trigger}</span>
            </TooltipTrigger>
            <TooltipContent>Record a down payment first</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[16px]">
          <DialogHeader>
            <DialogTitle>Download down payment receipt</DialogTitle>
          </DialogHeader>
          <div>
            <Label className="mb-1 block text-[12px]">Authorized signatory</Label>
            <Select value={signatoryId} onValueChange={setSignatoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select signatory" />
              </SelectTrigger>
              <SelectContent>
                {signatories.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name} — {row.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" asChild>
              <a href={downloadHref}>
                <DownloadSimple weight="light" className="size-4" />
                Download PDF
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
