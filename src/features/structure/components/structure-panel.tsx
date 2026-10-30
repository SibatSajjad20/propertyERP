"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/errors";
import { floorLabelForLevel } from "../floor-labels";

export type StructurePanelState =
  | { kind: "property"; mode: "create" }
  | { kind: "property"; mode: "edit"; id: string; name: string }
  | { kind: "block"; mode: "create" }
  | { kind: "block"; mode: "edit"; id: string; name: string }
  | { kind: "floor"; mode: "create" }
  | { kind: "floor"; mode: "edit"; id: string; level: number; name: string };

type StructurePanelProps = {
  panel: StructurePanelState | null;
  onClose: () => void;
  onSubmit: (values: { name: string; level?: number }) => Promise<void>;
  onArchive?: () => Promise<void>;
};

function titleFor(panel: StructurePanelState): string {
  const verb = panel.mode === "create" ? "New" : "Edit";
  if (panel.kind === "property") {
    return `${verb} property`;
  }
  if (panel.kind === "block") {
    return `${verb} block`;
  }
  return `${verb} floor`;
}

function panelKey(panel: StructurePanelState): string {
  if (panel.mode === "create") {
    return `${panel.kind}-create`;
  }
  return `${panel.kind}-edit-${panel.id}`;
}

function initialName(panel: StructurePanelState): string {
  return panel.mode === "edit" ? panel.name : "";
}

function initialLevel(panel: StructurePanelState): string {
  return panel.kind === "floor" && panel.mode === "edit" ? String(panel.level) : "0";
}

function StructurePanelForm({
  panel,
  onClose,
  onSubmit,
  onArchive,
}: {
  panel: StructurePanelState;
  onClose: () => void;
  onSubmit: (values: { name: string; level?: number }) => Promise<void>;
  onArchive?: () => Promise<void>;
}) {
  const [name, setName] = useState(initialName(panel));
  const [level, setLevel] = useState(initialLevel(panel));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (panel.kind === "floor") {
        await onSubmit({ name, level: Number(level) });
      } else {
        await onSubmit({ name });
      }
    } catch (caught) {
      setError(errorMessage(caught));
      setPending(false);
    }
  }

  async function handleArchive() {
    if (!onArchive) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onArchive();
    } catch (caught) {
      setError(errorMessage(caught));
      setPending(false);
    }
  }

  const suggested = floorLabelForLevel(Number(level) || 0);

  return (
    <>
      <div className="flex h-[var(--topbar-height)] items-center justify-between border-b border-line px-4">
        <Dialog.Title className="font-display text-[18px] text-ink">
          {titleFor(panel)}
        </Dialog.Title>
        <Dialog.Close asChild>
          <Button variant="ghost">Close</Button>
        </Dialog.Close>
      </div>
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
          {panel.kind === "floor" ? (
            <div className="space-y-1.5">
              <Label htmlFor="floor-level">Level</Label>
              <Input
                id="floor-level"
                type="number"
                min={0}
                max={200}
                className="tabular-nums"
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                required
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="structure-name">
              {panel.kind === "floor" ? "Label" : "Name"}
            </Label>
            <Input
              id="structure-name"
              value={name}
              placeholder={panel.kind === "floor" ? suggested : undefined}
              onChange={(event) => setName(event.target.value)}
              required={panel.kind !== "floor"}
            />
            {panel.kind === "floor" && !name.trim() ? (
              <p className="text-[12px] text-ink-muted">Blank uses {suggested}.</p>
            ) : null}
          </div>
          {error ? (
            <p className="text-[12px] text-sold" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
          {panel.mode === "edit" && onArchive ? (
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={() => void handleArchive()}
            >
              Archive {panel.kind}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : `Save ${panel.kind}`}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

export function StructurePanel({
  panel,
  onClose,
  onSubmit,
  onArchive,
}: StructurePanelProps) {
  return (
    <Dialog.Root open={panel !== null} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[color-mix(in_srgb,var(--ink)_24%,transparent)] duration-[var(--duration)] ease-[var(--ease-ledger)]" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,360px)] flex-col border-l border-line bg-surface duration-[var(--duration)] ease-[var(--ease-ledger)]"
          aria-describedby={undefined}
        >
          {panel ? (
            <StructurePanelForm
              key={panelKey(panel)}
              panel={panel}
              onClose={onClose}
              onSubmit={onSubmit}
              onArchive={onArchive}
            />
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
