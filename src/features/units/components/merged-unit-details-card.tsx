import { ArrowSquareOut, FileText, GitMerge } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { effectivePricingArea, formatSqft, formatUnitDisplayCode } from "@/lib/area";
import { formatPkrLedger } from "@/lib/money";
import type { UnitMergeInfo } from "../merge-queries";

interface MergedUnitDetailsCardProps {
  mergeInfo: UnitMergeInfo;
  className?: string;
}

export function MergedUnitDetailsCard({
  mergeInfo,
  className,
}: MergedUnitDetailsCardProps) {
  return (
    <div className={cn("card space-y-4 border-primary/25 p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <GitMerge weight="light" className="size-4 text-primary" />
            <h3 className="text-[14px] font-semibold text-ink">Merged Unit Details</h3>
            <Badge tone="primary">Combined from {mergeInfo.sources.length} Units</Badge>
          </div>
          <p className="mt-1 text-[12px] text-ink-muted">
            Reason: <span className="text-ink">{mergeInfo.reason}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            Requested by {mergeInfo.requestedByName ?? "Staff"} · Approved by{" "}
            {mergeInfo.approvedByName ?? "Admin"}
            {mergeInfo.approvedAt
              ? ` on ${new Date(mergeInfo.approvedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}`
              : ""}
          </p>
        </div>

        {mergeInfo.proofUrl && (
          <Button variant="secondary" size="sm" asChild>
            <a href={mergeInfo.proofUrl} target="_blank" rel="noopener noreferrer">
              <FileText weight="light" className="mr-1.5 size-3.5" />
              {mergeInfo.proofFileName || "View Merge Proof"}
              <ArrowSquareOut weight="light" className="ml-1.5 size-3.5" />
            </a>
          </Button>
        )}
      </div>

      {/* Separate details of all original source units */}
      <div>
        <p className="mb-2 text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
          Original Source Units Breakdown
        </p>
        <div className="overflow-x-auto rounded-[8px] border border-line">
          <table className="w-full text-left text-[12px]">
            <thead className="border-b border-line bg-[#F4F6F8] text-[11.5px] font-medium text-ink-muted">
              <tr>
                <th className="px-3.5 py-2.5 font-medium">Unit Code</th>
                <th className="px-3.5 py-2.5 font-medium">Unit Number</th>
                <th className="px-3.5 py-2.5 font-medium">Floor</th>
                <th className="px-3.5 py-2.5 font-medium">Category</th>
                <th className="px-3.5 py-2.5 text-right font-medium">Net Area</th>
                <th className="px-3.5 py-2.5 text-right font-medium">Gross Area</th>
                <th className="px-3.5 py-2.5 text-right font-medium">Rate / sq ft</th>
                <th className="px-3.5 py-2.5 text-right font-medium">Original Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {mergeInfo.sources.map((src) => (
                <tr key={src.id} className="bg-surface hover:bg-[#FAFBFC]">
                  <td className="unit-code px-3.5 py-2.5 font-mono font-medium text-primary tabular-nums">
                    {formatUnitDisplayCode(src.unitCode, src.categoryName)}
                  </td>
                  <td className="px-3.5 py-2.5 text-ink">{src.unitNumber}</td>
                  <td className="px-3.5 py-2.5 text-ink-muted">{src.floorName}</td>
                  <td className="px-3.5 py-2.5 text-ink-muted">{src.categoryName}</td>
                  <td className="px-3.5 py-2.5 text-right tabular-nums">
                    {formatSqft(src.netAreaSqft)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right tabular-nums">
                    {formatSqft(effectivePricingArea(src.grossAreaSqft, src.netAreaSqft))}
                  </td>
                  <td className="px-3.5 py-2.5 text-right tabular-nums">
                    {formatPkrLedger(src.ratePerSqftPkr)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-ink tabular-nums">
                    {formatPkrLedger(src.computedPricePkr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
