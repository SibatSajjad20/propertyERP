"use client";

import * as React from "react";
import { ArrowUUpLeft, FileXls } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatKarachiDateTime as formatDateTime } from "@/lib/datetime";
import type { ImportBatchSummary } from "../types";

interface ImportBatchHistoryProps {
  batches: ImportBatchSummary[];
  onRollback: (batchId: string) => Promise<void>;
  rollingBack: boolean;
}

export function ImportBatchHistory({
  batches,
  onRollback,
  rollingBack,
}: ImportBatchHistoryProps) {
  const [rollbackDialogOpen, setRollbackDialogOpen] = React.useState(false);
  const [selectedBatch, setSelectedBatch] = React.useState<ImportBatchSummary | null>(
    null,
  );

  const latestActiveBatch = batches.find((b) => !b.rolledBackAt);

  const handleOpenRollback = (batch: ImportBatchSummary) => {
    setSelectedBatch(batch);
    setRollbackDialogOpen(true);
  };

  const handleConfirmRollback = async () => {
    if (!selectedBatch) return;
    try {
      await onRollback(selectedBatch.id);
      setRollbackDialogOpen(false);
      setSelectedBatch(null);
    } catch {
      // toast is triggered by parent
    }
  };

  return (
    <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line bg-subtle/30 px-5 py-3.5">
        <div>
          <h2 className="text-[13px] font-semibold text-ink">Ingested Batches</h2>
          <p className="text-[11px] text-ink-muted">
            Historical spreadsheet uploads, record verification counts, and forensic
            receipts
          </p>
        </div>
      </div>

      {batches.length === 0 ? (
        <EmptyState
          title="No import batches processed"
          description="Spreadsheets queued for upload will appear here with record verification and audit logs."
        />
      ) : (
        <div className="divide-y divide-line">
          {batches.map((batch) => {
            const isLatestActive = latestActiveBatch?.id === batch.id;
            const isRolledBack = Boolean(batch.rolledBackAt);

            return (
              <div
                key={batch.id}
                className={`flex flex-col justify-between gap-3 p-4 transition-colors sm:flex-row sm:items-center ${
                  isRolledBack ? "bg-subtle/20 opacity-70" : "hover:bg-subtle/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[4px] border border-line bg-subtle text-primary">
                    <FileXls weight="light" className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-medium text-ink">
                        {batch.originalFilePath}
                      </span>
                      {isRolledBack ? (
                        <Badge tone="muted" showDot={true}>
                          Rolled Back
                        </Badge>
                      ) : (
                        <Badge tone="available" showDot={true}>
                          Committed
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                      <span>
                        By {batch.actorName || batch.actorEmail || "Administrator"}
                      </span>
                      <span>•</span>
                      <span>{formatDateTime(batch.createdAt)}</span>
                      {batch.rolledBackAt && (
                        <>
                          <span>•</span>
                          <span className="text-sold">
                            Reverted on {formatDateTime(batch.rolledBackAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  {/* Counts pill */}
                  <div className="flex items-center gap-2 font-mono text-[12px] text-ink-muted tabular-nums">
                    <span className="text-ink">
                      <strong>{batch.rowCount}</strong> rows
                    </span>
                    <span>(</span>
                    <span className="text-available">+{batch.createdCount} new</span>
                    <span>,</span>
                    <span className="text-primary">{batch.updatedCount} updated</span>
                    {batch.skippedCount > 0 && (
                      <>
                        <span>,</span>
                        <span className="text-ink-muted">
                          {batch.skippedCount} skipped
                        </span>
                      </>
                    )}
                    <span>)</span>
                  </div>

                  {/* Rollback button */}
                  {isLatestActive && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={rollingBack}
                      leftIcon={
                        <ArrowUUpLeft weight="light" className="size-3.5 text-sold" />
                      }
                      onClick={() => handleOpenRollback(batch)}
                    >
                      Rollback
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog for Rollback */}
      <Dialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rollback latest import batch?</DialogTitle>
            <DialogDescription>
              This will soft-revert all changes made during this batch (
              <span className="font-mono font-medium text-ink">
                {selectedBatch?.originalFilePath}
              </span>
              ).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 rounded-[6px] border border-line bg-subtle/30 p-3 text-[12px] text-ink-muted">
            <p>
              • <strong>{selectedBatch?.createdCount}</strong> created units will be
              soft-archived.
            </p>
            <p>
              • <strong>{selectedBatch?.updatedCount}</strong> updated units will have
              their previous financial and status state restored from the forensic audit
              log.
            </p>
            <p>• A full rollback audit log entry will be recorded.</p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm" disabled={rollingBack}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="dangerSolid"
              size="sm"
              loading={rollingBack}
              onClick={handleConfirmRollback}
            >
              Confirm Rollback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
