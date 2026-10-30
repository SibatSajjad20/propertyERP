"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { errorMessage } from "@/lib/errors";
import { floorLabelForLevel } from "../floor-labels";

export type StructurePanelState =
  | { kind: "property"; mode: "create" }
  | { kind: "property"; mode: "edit"; id: string; name: string }
  | { kind: "block"; mode: "create" }
  | { kind: "block"; mode: "edit"; id: string; name: string }
  | { kind: "floor"; mode: "create" }
  | { kind: "floor"; mode: "edit"; id: string; level: number; name: string };

interface StructurePanelProps {
  panel: StructurePanelState | null;
  onClose: () => void;
  onSubmit: (values: { name: string; level?: number }) => Promise<void>;
  onArchive?: () => Promise<void>;
}

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
      <SheetHeader>
        <SheetTitle>{titleFor(panel)}</SheetTitle>
      </SheetHeader>
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {panel.kind === "floor" ? (
            <div className="space-y-1.5">
              <Label
                htmlFor="floor-level"
                className="text-[12px] font-medium text-ink-muted"
              >
                Level
              </Label>
              <Input
                id="floor-level"
                type="number"
                min={0}
                max={200}
                className="font-mono tabular-nums"
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                required
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label
              htmlFor="structure-name"
              className="text-[12px] font-medium text-ink-muted"
            >
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
              <p className="text-[11px] text-ink-muted">
                Blank default uses &quot;{suggested}&quot;.
              </p>
            ) : null}
          </div>
          {error ? (
            <p
              className="rounded-[4px] border border-sold/30 bg-sold/5 p-2.5 text-[12px] text-sold"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex h-[56px] shrink-0 items-center justify-between border-t border-line bg-surface px-5">
          {panel.mode === "edit" && onArchive ? (
            <Button
              type="button"
              variant="danger"
              size="md"
              disabled={pending}
              onClick={() => void handleArchive()}
            >
              Archive {panel.kind}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={pending}>
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
    <Sheet open={panel !== null} onOpenChange={(next) => !next && onClose()}>
      <SheetContent widthClass="w-full max-w-[400px]">
        {panel ? (
          <StructurePanelForm
            key={panelKey(panel)}
            panel={panel}
            onClose={onClose}
            onSubmit={onSubmit}
            onArchive={onArchive}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
