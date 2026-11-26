"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CurrencyDollar,
  DotsThree,
  PencilSimple,
  Plus,
  Trash,
  TreeStructure,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/ui/panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { FloorRatesDialog } from "./floor-rates-dialog";
import { StructurePanel, type StructurePanelState } from "./structure-panel";

function isArchiveResult(value: unknown): value is ArchiveResult {
  if (!value || typeof value !== "object" || !("ok" in value)) {
    return false;
  }
  return value.ok === true || value.ok === false;
}

interface StructureScreenProps extends StructureScreenData {
  canManage: boolean;
  canUpdateRates?: boolean;
  isAdmin?: boolean;
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
  units = [],
  canManage,
  canUpdateRates = false,
  isAdmin = false,
}: StructureScreenProps) {
  const router = useRouter();
  const [panel, setPanel] = useState<StructurePanelState | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<ConfirmArchiveState | null>(null);
  const [archivePending, setArchivePending] = useState(false);
  const [rateFloor, setRateFloor] = useState<{ id: string; name: string } | null>(null);

  // Selected floor state for unit grid
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);

  const activeFloor =
    (selectedFloorId ? floors.find((f) => f.id === selectedFloorId) : null) ?? floors[0];

  const activeFloorUnits = useMemo(() => {
    if (!activeFloor) return [];
    return units.filter((u) => u.floorId === activeFloor.id);
  }, [units, activeFloor]);

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
      <PageHeader
        title="Structure"
        description="Configure properties, architectural blocks, and vertical levels."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {properties.length > 0 && (
              <div className="w-48">
                <Select
                  value={selectedProperty?.id ?? ""}
                  onValueChange={(val) => router.push(hrefFor(val))}
                >
                  <SelectTrigger aria-label="Property" size="md">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {canManage && (
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
                {selectedBlock && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setPanel({ kind: "floor", mode: "create" })}
                  >
                    <Plus weight="light" className="mr-1 size-3.5" />
                    Add floor
                  </Button>
                )}
                <Button variant="primary" size="md" asChild>
                  <Link href="/units/new">
                    <Plus weight="light" className="mr-1.5 size-4" />
                    Add units
                  </Link>
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* 3-Panel layout */}
      <div className="grid min-h-[540px] flex-1 grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Panel 1 (3 cols): Blocks */}
        <aside className="lg:col-span-3">
          <Panel
            title="Blocks"
            hint="Wings & sections"
            actions={
              canManage && selectedProperty ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPanel({ kind: "block", mode: "create" })}
                >
                  <Plus weight="light" className="mr-1 size-3.5" />
                  New
                </Button>
              ) : null
            }
            bodyClassName="p-3"
          >
            {blocks.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-muted">
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
                          ? "bg-primary-soft font-medium text-ink"
                          : "text-muted hover:bg-subtle/60 hover:text-ink",
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
                          className="size-4 shrink-0 text-muted"
                        />
                        <span className="truncate">{b.name}</span>
                      </Link>

                      <div className="flex shrink-0 items-center gap-2">
                        <Badge tone="muted" showDot={false}>
                          {b.floorCount} {b.floorCount === 1 ? "fl" : "fls"}
                        </Badge>

                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                aria-label="Block options"
                                className="flex size-7 items-center justify-center rounded-[6px] text-muted opacity-70 group-hover:opacity-100 hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
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
          </Panel>
        </aside>

        {/* Panel 2 (4 cols): Floors List */}
        <section className="lg:col-span-4">
          <Panel
            title={selectedBlock ? `Floors · ${selectedBlock.name}` : "Floors"}
            hint={selectedBlock ? `${floors.length} levels` : "Select a block to inspect"}
            bodyClassName="p-0 overflow-hidden"
          >
            {!selectedBlock ? (
              <div className="py-16 text-center">
                <p className="text-[13px] text-muted">No block selected.</p>
              </div>
            ) : floors.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[13px] text-muted">No floors in this block.</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="h-9 border-b border-line bg-[#FAFBFC] text-[12px] font-medium text-muted">
                      <th className="w-16 px-3 text-right">Level</th>
                      <th className="px-3 text-left">Label</th>
                      <th className="w-28 px-3 text-right">Units</th>
                      {canManage && <th className="w-10 px-2 text-right" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {floors.map((f) => {
                      const isSelected = f.id === activeFloor?.id;
                      return (
                        <tr
                          key={f.id}
                          onClick={() => setSelectedFloorId(f.id)}
                          className={cn(
                            "group h-10 cursor-pointer transition-colors select-none",
                            isSelected
                              ? "bg-primary-soft font-medium text-ink"
                              : "text-ink hover:bg-subtle/50",
                          )}
                        >
                          <td className="px-3 text-right font-sans text-muted tabular-nums">
                            {f.level}
                          </td>
                          <td className="px-3">
                            <span className="font-medium">{f.name}</span>
                          </td>
                          <td className="px-3 text-right font-sans text-[12px] tabular-nums">
                            <span className="text-good font-medium">
                              {f.freeCount} free
                            </span>
                            <span className="text-subtle"> / </span>
                            <span className="text-muted">{f.unitCount}</span>
                          </td>
                          {canManage && (
                            <td
                              className="px-2 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    aria-label="Floor actions"
                                    className="flex size-7 items-center justify-center rounded-[6px] text-muted opacity-70 group-hover:opacity-100 hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                                  >
                                    <DotsThree weight="bold" className="size-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  {canUpdateRates && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setRateFloor({
                                          id: f.id,
                                          name: f.name,
                                        })
                                      }
                                    >
                                      <CurrencyDollar
                                        weight="light"
                                        className="mr-2 size-3.5 text-primary"
                                      />
                                      Update rates
                                    </DropdownMenuItem>
                                  )}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </section>

        {/* Panel 3 (5 cols): Floor Units Grid */}
        <section className="lg:col-span-5">
          <Panel
            title={activeFloor ? `Units on ${activeFloor.name}` : "Floor Units"}
            hint={activeFloor ? `${activeFloorUnits.length} total units` : undefined}
            bodyClassName="p-4 flex flex-col justify-between h-[calc(100%-50px)]"
          >
            {activeFloorUnits.length === 0 ? (
              <div className="py-20 text-center text-[12.5px] text-muted">
                No units created on this level yet.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid max-h-[380px] grid-cols-4 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-6 lg:grid-cols-8">
                  {activeFloorUnits.map((u) => {
                    const bgByStatus = {
                      AVAILABLE: "bg-[#ECFDF3] border-[#ABEFC6] text-[#067647]",
                      BOOKED: "bg-[#EFF8FF] border-[#B2DDFF] text-[#175CD3]",
                      RESERVED: "bg-[#FEF6EE] border-[#F9DBAF] text-[#B54708]",
                      SOLD: "bg-[#FEF3F2] border-[#FECDCA] text-[#B42318]",
                    }[u.status];

                    return (
                      <Link
                        key={u.id}
                        href={`/units/${u.id}`}
                        className={cn(
                          "flex h-11 flex-col items-center justify-center rounded-[6px] border p-1 text-center transition-all select-none hover:shadow-xs",
                          bgByStatus,
                        )}
                        title={`${u.unitCode} (${u.status})`}
                      >
                        <span className="w-full truncate font-sans text-[11px] font-medium text-ink">
                          {u.unitCode}
                        </span>
                        <span className="w-full truncate text-[9.5px] capitalize opacity-80">
                          {u.status.toLowerCase()}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                {/* Status Legend */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[11px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full bg-[#067647]"
                      aria-hidden="true"
                    />
                    <span>Available</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full bg-[#0B558B]"
                      aria-hidden="true"
                    />
                    <span>Booked</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full bg-[#B58500]"
                      aria-hidden="true"
                    />
                    <span>Reserved</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full bg-[#B42318]"
                      aria-hidden="true"
                    />
                    <span>Sold</span>
                  </span>
                </div>
              </div>
            )}
          </Panel>
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

      {/* Floor Rates Dialog */}
      <FloorRatesDialog
        floorId={rateFloor?.id ?? null}
        floorName={rateFloor?.name}
        open={Boolean(rateFloor)}
        onOpenChange={(open) => !open && setRateFloor(null)}
        onSuccess={() => {
          setRateFloor(null);
          router.refresh();
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
}
