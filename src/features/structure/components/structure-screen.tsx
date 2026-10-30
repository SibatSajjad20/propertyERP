"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  DotsThree,
  PencilSimple,
  Plus,
  Trash,
  TreeStructure,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import {
  archiveBlock,
  archiveFloor,
  archiveProperty,
  createBlock,
  createFloor,
  createProperty,
  updateBlock,
  updateFloor,
  updateProperty,
} from "../actions";
import type { ArchiveResult } from "../archive-guard";
import type { StructureScreenData } from "../queries";
import { StructurePanel, type StructurePanelState } from "./structure-panel";

function isArchiveResult(value: unknown): value is ArchiveResult {
  if (!value || typeof value !== "object" || !("ok" in value)) {
    return false;
  }
  return value.ok === true || value.ok === false;
}

interface StructureScreenProps extends StructureScreenData {
  canManage: boolean;
}

function hrefFor(propertyId: string, blockId?: string): Route {
  const params = new URLSearchParams({ propertyId });
  if (blockId) {
    params.set("blockId", blockId);
  }
  return `/structure?${params.toString()}` as Route;
}

interface ConfirmArchiveState {
  kind: "property" | "block" | "floor";
  id: string;
  name: string;
}

export function StructureScreen({
  properties,
  selectedProperty,
  blocks,
  selectedBlock,
  floors,
  canManage,
}: StructureScreenProps) {
  const router = useRouter();
  const [panel, setPanel] = useState<StructurePanelState | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<ConfirmArchiveState | null>(null);
  const [archivePending, setArchivePending] = useState(false);

  async function run(task: () => Promise<unknown>, successMsg?: string) {
    try {
      const result = await task();
      if (isArchiveResult(result) && !result.ok) {
        throw new Error(result.error);
      }
      setPanel(null);
      setConfirmArchive(null);
      if (successMsg) {
        toast.success(successMsg);
      }
      router.refresh();
    } catch (error) {
      const message = errorMessage(error);
      toast.error(message);
      throw error;
    }
  }

  async function handleSubmit(values: { name: string; level?: number }) {
    if (!panel) return;
    if (panel.kind === "property" && panel.mode === "create") {
      await run(() => createProperty({ name: values.name }), "Property created");
      return;
    }
    if (panel.kind === "property" && panel.mode === "edit") {
      await run(
        () => updateProperty({ id: panel.id, name: values.name }),
        "Property updated",
      );
      return;
    }
    if (panel.kind === "block" && panel.mode === "create") {
      if (!selectedProperty) throw new Error("Select a property first");
      await run(
        () => createBlock({ propertyId: selectedProperty.id, name: values.name }),
        "Block created",
      );
      return;
    }
    if (panel.kind === "block" && panel.mode === "edit") {
      await run(() => updateBlock({ id: panel.id, name: values.name }), "Block updated");
      return;
    }
    if (panel.kind === "floor" && panel.mode === "create") {
      if (!selectedBlock) throw new Error("Select a block first");
      await run(
        () =>
          createFloor({
            blockId: selectedBlock.id,
            level: values.level ?? 0,
            name: values.name.trim() ? values.name : undefined,
          }),
        "Floor created",
      );
      return;
    }
    if (panel.kind === "floor" && panel.mode === "edit") {
      await run(
        () =>
          updateFloor({
            id: panel.id,
            level: values.level ?? panel.level,
            name: values.name,
          }),
        "Floor updated",
      );
    }
  }

  async function handleArchiveTarget(kind: "property" | "block" | "floor", id: string) {
    setArchivePending(true);
    try {
      if (kind === "property") {
        await run(() => archiveProperty({ id }), "Property archived");
      } else if (kind === "block") {
        await run(() => archiveBlock({ id }), "Block archived");
      } else {
        await run(() => archiveFloor({ id }), "Floor archived");
      }
    } finally {
      setArchivePending(false);
    }
  }

  async function handleArchiveFromPanel() {
    if (!panel || panel.mode !== "edit") return;
    await handleArchiveTarget(panel.kind, panel.id);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink">Structure</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Configure properties, architectural blocks, and vertical levels.
          </p>
        </div>

        {/* Property Selector & Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          {properties.length > 0 && (
            <div className="relative">
              <select
                aria-label="Property"
                className="h-8 min-w-[200px] cursor-pointer appearance-none rounded-[6px] border border-line bg-surface px-3 pr-8 text-[13px] font-medium text-ink outline-none hover:border-line-strong focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                value={selectedProperty?.id ?? ""}
                onChange={(event) => router.push(hrefFor(event.target.value))}
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {canManage ? (
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setPanel({ kind: "property", mode: "create" })}
              >
                <Plus weight="light" className="mr-1 size-3.5" />
                New property
              </Button>
              {selectedProperty && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() =>
                    setPanel({
                      kind: "property",
                      mode: "edit",
                      id: selectedProperty.id,
                      name: selectedProperty.name,
                    })
                  }
                >
                  <PencilSimple weight="light" className="mr-1 size-3.5" />
                  Edit property
                </Button>
              )}
            </>
          ) : (
            <p className="text-[12px] text-ink-muted">
              This ledger is read-only for Sales.
            </p>
          )}
        </div>
      </div>

      {/* Two-pane layout */}
      <div className="grid min-h-[540px] flex-1 grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Pane (4 cols): Blocks List */}
        <aside className="flex flex-col justify-between rounded-[8px] border border-line bg-surface p-4 lg:col-span-4">
          <div>
            <div className="mb-3 flex h-8 items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-[13px] font-semibold text-ink">Blocks</h2>
                <p className="text-[11px] text-ink-muted">Wings &amp; sections</p>
              </div>
              {canManage && selectedProperty && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPanel({ kind: "block", mode: "create" })}
                >
                  <Plus weight="light" className="mr-1 size-3" />
                  New block
                </Button>
              )}
            </div>

            {blocks.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-ink-muted">
                No blocks in this property.
              </p>
            ) : (
              <ul className="space-y-1">
                {blocks.map((b) => {
                  const selected = b.id === selectedBlock?.id;
                  return (
                    <li
                      key={b.id}
                      className={cn(
                        "group flex h-10 items-center justify-between rounded-[6px] px-2.5 transition-colors duration-[120ms]",
                        selected
                          ? "bg-subtle font-medium text-ink"
                          : "text-ink-muted hover:bg-subtle/60 hover:text-ink",
                      )}
                    >
                      <Link
                        href={
                          selectedProperty
                            ? hrefFor(selectedProperty.id, b.id)
                            : "/structure"
                        }
                        className="flex min-w-0 flex-1 items-center gap-2 truncate text-[13px]"
                      >
                        <TreeStructure
                          weight="light"
                          className="size-4 shrink-0 text-ink-muted"
                        />
                        <span className="truncate">{b.name}</span>
                      </Link>

                      <div className="flex shrink-0 items-center gap-2">
                        <Badge tone="muted" showDot={false}>
                          {b.floorCount} {b.floorCount === 1 ? "floor" : "floors"}
                        </Badge>

                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                aria-label="Block options"
                                className="flex size-7 items-center justify-center rounded text-ink-muted opacity-70 group-hover:opacity-100 hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                              >
                                <DotsThree weight="bold" className="size-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem
                                onClick={() =>
                                  setPanel({
                                    kind: "block",
                                    mode: "edit",
                                    id: b.id,
                                    name: b.name,
                                  })
                                }
                              >
                                <PencilSimple weight="light" className="mr-2 size-3.5" />
                                Edit block
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="danger"
                                onClick={() =>
                                  setConfirmArchive({
                                    kind: "block",
                                    id: b.id,
                                    name: b.name,
                                  })
                                }
                              >
                                <Trash weight="light" className="mr-2 size-3.5" />
                                Archive block
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Right Pane (8 cols): Floors Table */}
        <section className="flex flex-col justify-between rounded-[8px] border border-line bg-surface p-4 lg:col-span-8">
          <div>
            <div className="mb-3 flex h-8 items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-[13px] font-semibold text-ink">
                  {selectedBlock ? `Floors · ${selectedBlock.name}` : "Floors"}
                </h2>
                <p className="text-[11px] text-ink-muted">
                  {selectedBlock
                    ? `${floors.length} levels configured`
                    : "Select a block to inspect floors"}
                </p>
              </div>
              {canManage && selectedBlock && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setPanel({ kind: "floor", mode: "create" })}
                >
                  <Plus weight="light" className="mr-1 size-3" />
                  New floor
                </Button>
              )}
            </div>

            {!selectedBlock ? (
              <div className="py-16 text-center">
                <p className="text-[13px] text-ink-muted">No block selected.</p>
              </div>
            ) : floors.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[13px] text-ink-muted">No floors in this block.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[6px] border border-line">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="h-8 border-b border-line-strong bg-subtle/50 text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                      <th className="w-20 px-3 text-right">Level</th>
                      <th className="px-3 text-left">Label</th>
                      <th className="w-24 px-3 text-right">Units</th>
                      {canManage && <th className="w-12 px-2 text-right" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {floors.map((f) => (
                      <tr
                        key={f.id}
                        className="group h-9 transition-colors hover:bg-subtle/50"
                      >
                        <td className="px-3 text-right font-mono text-ink-muted tabular-nums">
                          {f.level}
                        </td>
                        <td className="px-3">
                          {canManage ? (
                            <button
                              type="button"
                              className="cursor-pointer text-left font-medium text-ink transition-colors hover:text-primary"
                              onClick={() =>
                                setPanel({
                                  kind: "floor",
                                  mode: "edit",
                                  id: f.id,
                                  level: f.level,
                                  name: f.name,
                                })
                              }
                            >
                              {f.name}
                            </button>
                          ) : (
                            <span className="font-medium text-ink">{f.name}</span>
                          )}
                        </td>
                        <td className="px-3 text-right font-mono text-ink tabular-nums">
                          {f.unitCount}
                        </td>
                        {canManage && (
                          <td className="px-2 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  aria-label="Floor actions"
                                  className="flex size-7 items-center justify-center rounded text-ink-muted opacity-70 group-hover:opacity-100 hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                                >
                                  <DotsThree weight="bold" className="size-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem
                                  onClick={() =>
                                    setPanel({
                                      kind: "floor",
                                      mode: "edit",
                                      id: f.id,
                                      level: f.level,
                                      name: f.name,
                                    })
                                  }
                                >
                                  <PencilSimple
                                    weight="light"
                                    className="mr-2 size-3.5"
                                  />
                                  Edit floor
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="danger"
                                  onClick={() =>
                                    setConfirmArchive({
                                      kind: "floor",
                                      id: f.id,
                                      name: f.name,
                                    })
                                  }
                                >
                                  <Trash weight="light" className="mr-2 size-3.5" />
                                  Archive floor
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Edit / Create Panel */}
      {canManage && (
        <StructurePanel
          panel={panel}
          onClose={() => setPanel(null)}
          onSubmit={handleSubmit}
          onArchive={panel?.mode === "edit" ? handleArchiveFromPanel : undefined}
        />
      )}

      {/* Confirm Archive Dialog */}
      {confirmArchive && (
        <Dialog open={true} onOpenChange={(open) => !open && setConfirmArchive(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Archive {confirmArchive.kind}?</DialogTitle>
              <DialogDescription>
                Are you sure you want to archive &quot;{confirmArchive.name}&quot;? If any
                active units remain attached, archiving will be safely blocked.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="secondary"
                size="md"
                disabled={archivePending}
                onClick={() => setConfirmArchive(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                loading={archivePending}
                onClick={() =>
                  void handleArchiveTarget(confirmArchive.kind, confirmArchive.id)
                }
              >
                Archive {confirmArchive.kind}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
