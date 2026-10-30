"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import type { StructureScreenData } from "../queries";
import { StructurePanel, type StructurePanelState } from "./structure-panel";

type StructureScreenProps = StructureScreenData & {
  canManage: boolean;
};

function hrefFor(propertyId: string, blockId?: string): Route {
  const params = new URLSearchParams({ propertyId });
  if (blockId) {
    params.set("blockId", blockId);
  }
  return `/structure?${params.toString()}` as Route;
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

  async function run(task: () => Promise<unknown>) {
    try {
      await task();
      setPanel(null);
      router.refresh();
    } catch (error) {
      const message = errorMessage(error);
      toast.error(message);
      throw error;
    }
  }

  async function handleSubmit(values: { name: string; level?: number }) {
    if (!panel) {
      return;
    }
    if (panel.kind === "property" && panel.mode === "create") {
      await run(() => createProperty({ name: values.name }));
      return;
    }
    if (panel.kind === "property" && panel.mode === "edit") {
      await run(() => updateProperty({ id: panel.id, name: values.name }));
      return;
    }
    if (panel.kind === "block" && panel.mode === "create") {
      if (!selectedProperty) {
        throw new Error("Select a property first");
      }
      await run(() =>
        createBlock({ propertyId: selectedProperty.id, name: values.name }),
      );
      return;
    }
    if (panel.kind === "block" && panel.mode === "edit") {
      await run(() => updateBlock({ id: panel.id, name: values.name }));
      return;
    }
    if (panel.kind === "floor" && panel.mode === "create") {
      if (!selectedBlock) {
        throw new Error("Select a block first");
      }
      await run(() =>
        createFloor({
          blockId: selectedBlock.id,
          level: values.level ?? 0,
          name: values.name.trim() ? values.name : undefined,
        }),
      );
      return;
    }
    if (panel.kind === "floor" && panel.mode === "edit") {
      await run(() =>
        updateFloor({
          id: panel.id,
          level: values.level ?? panel.level,
          name: values.name,
        }),
      );
    }
  }

  async function handleArchive() {
    if (!panel || panel.mode !== "edit") {
      return;
    }
    if (panel.kind === "property") {
      await run(() => archiveProperty({ id: panel.id }));
      return;
    }
    if (panel.kind === "block") {
      await run(() => archiveBlock({ id: panel.id }));
      return;
    }
    await run(() => archiveFloor({ id: panel.id }));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
        <div className="max-w-xs min-w-0 flex-1 space-y-1.5">
          <p className="text-[11px] font-medium tracking-wide text-ink-muted">Property</p>
          {properties.length === 0 ? (
            <p className="text-[13px] text-ink-muted">No properties yet.</p>
          ) : (
            <select
              aria-label="Property"
              className="h-8 w-full min-w-[220px] rounded-sm border border-line bg-surface px-2.5 text-[13px] text-ink"
              value={selectedProperty?.id ?? ""}
              onChange={(event) => {
                router.push(hrefFor(event.target.value));
              }}
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManage ? (
            <>
              <Button
                variant="outline"
                onClick={() => setPanel({ kind: "property", mode: "create" })}
              >
                New property
              </Button>
              {selectedProperty ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    setPanel({
                      kind: "property",
                      mode: "edit",
                      id: selectedProperty.id,
                      name: selectedProperty.name,
                    })
                  }
                >
                  Edit property
                </Button>
              ) : null}
            </>
          ) : (
            <p className="text-[12px] text-ink-muted">
              This ledger is read-only for Sales.
            </p>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-56 shrink-0 border-r border-line pr-3">
          <div className="mb-2 flex h-8 items-center justify-between">
            <p className="text-[11px] font-medium tracking-wide text-ink-muted">Blocks</p>
            {canManage && selectedProperty ? (
              <Button
                variant="ghost"
                className="px-2"
                onClick={() => setPanel({ kind: "block", mode: "create" })}
              >
                New block
              </Button>
            ) : null}
          </div>
          {blocks.length === 0 ? (
            <p className="text-[13px] text-ink-muted">No blocks in this property.</p>
          ) : (
            <ul>
              {blocks.map((block) => {
                const selected = block.id === selectedBlock?.id;
                return (
                  <li key={block.id} className="border-b border-line">
                    <div className="flex h-8 items-center gap-1">
                      <Link
                        href={
                          selectedProperty
                            ? hrefFor(selectedProperty.id, block.id)
                            : "/structure"
                        }
                        className={cn(
                          "flex h-8 min-w-0 flex-1 items-center px-2 text-[13px]",
                          selected
                            ? "border-l-2 border-primary text-ink"
                            : "border-l-2 border-transparent text-ink-muted hover:text-ink",
                        )}
                      >
                        <span className="truncate">{block.name}</span>
                      </Link>
                      <span className="text-[11px] text-ink-muted tabular-nums">
                        {block.floorCount}
                      </span>
                      {canManage ? (
                        <Button
                          variant="ghost"
                          className="px-2"
                          onClick={() =>
                            setPanel({
                              kind: "block",
                              mode: "edit",
                              id: block.id,
                              name: block.name,
                            })
                          }
                        >
                          Edit
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="min-w-0 flex-1 pl-4">
          <div className="mb-2 flex h-8 max-w-xl items-center gap-3">
            <p className="min-w-0 truncate text-[13px] text-ink-muted">
              {selectedBlock
                ? `Floors · ${selectedBlock.name}`
                : "Select a block to list floors"}
            </p>
            {canManage && selectedBlock ? (
              <Button
                className="shrink-0"
                onClick={() => setPanel({ kind: "floor", mode: "create" })}
              >
                New floor
              </Button>
            ) : null}
          </div>
          {!selectedBlock ? (
            <p className="text-[13px] text-ink-muted">No block selected.</p>
          ) : floors.length === 0 ? (
            <p className="text-[13px] text-ink-muted">No floors in this block.</p>
          ) : (
            <table className="w-full max-w-xl border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="h-8 w-16 px-2 text-right text-[11px] font-medium text-ink-muted">
                    Level
                  </th>
                  <th className="h-8 px-2 text-left text-[11px] font-medium text-ink-muted">
                    Label
                  </th>
                  <th className="h-8 w-20 px-2 text-right text-[11px] font-medium text-ink-muted">
                    Units
                  </th>
                </tr>
              </thead>
              <tbody>
                {floors.map((floor) => (
                  <tr key={floor.id} className="border-b border-line">
                    <td className="h-8 px-2 text-right tabular-nums">{floor.level}</td>
                    <td className="h-8 px-2">
                      {canManage ? (
                        <button
                          type="button"
                          className="text-left text-ink hover:text-primary"
                          onClick={() =>
                            setPanel({
                              kind: "floor",
                              mode: "edit",
                              id: floor.id,
                              level: floor.level,
                              name: floor.name,
                            })
                          }
                        >
                          {floor.name}
                        </button>
                      ) : (
                        floor.name
                      )}
                    </td>
                    <td className="h-8 px-2 text-right tabular-nums">
                      {floor.unitCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {canManage ? (
        <StructurePanel
          panel={panel}
          onClose={() => setPanel(null)}
          onSubmit={handleSubmit}
          onArchive={panel?.mode === "edit" ? handleArchive : undefined}
        />
      ) : null}
    </div>
  );
}
