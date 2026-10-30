"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MagnifyingGlass,
  Buildings,
  Package,
  TreeStructure,
  Users,
  ClipboardText,
  UploadSimple,
} from "@phosphor-icons/react";
import type { Route } from "next";
import { searchUnits } from "@/features/units/actions";
import type { UnitJumpTarget } from "@/features/units/types";
import type { UserRole } from "@/db/schema/enums";
import { allNavItems, visibleNav } from "@/lib/nav";

const icons: Record<
  string,
  React.ComponentType<{ weight?: "light" | "regular" | "bold"; className?: string }>
> = {
  "/": Buildings,
  "/dashboard": Buildings,
  "/inventory": Package,
  "/structure": TreeStructure,
  "/import": UploadSimple,
  "/settings/users": Users,
  "/audit": ClipboardText,
};

export function CommandMenu({
  open: externalOpen,
  onOpenChange,
  role,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  role: UserRole;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [query, setQuery] = useState("");
  const [units, setUnits] = useState<UnitJumpTarget[]>([]);
  const router = useRouter();

  const routes = visibleNav(role, allNavItems);

  function close() {
    setOpen(false);
    setQuery("");
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length === 0) {
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void searchUnits({ q: trimmed })
        .then((rows) => {
          if (!cancelled) {
            setUnits(rows);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setUnits([]);
          }
        });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [open, query]);

  if (!open) {
    return null;
  }

  const shownUnits = query.trim() ? units : [];
  const shownRoutes = routes.filter((route) =>
    query.trim() ? route.label.toLowerCase().includes(query.trim().toLowerCase()) : true,
  );

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center bg-[color-mix(in_srgb,var(--ink)_28%,transparent)] px-3 pt-[12vh] backdrop-blur-[2px]">
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        aria-label="Close command menu"
        onClick={close}
      />
      <div className="shadow-floating animate-scale-in relative w-full max-w-lg overflow-hidden rounded-[8px] border border-line bg-surface">
        <Command
          label="Jump to"
          className="bg-surface text-[13px]"
          shouldFilter={false}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              close();
            }
          }}
        >
          <div className="flex items-center border-b border-line px-3">
            <MagnifyingGlass
              weight="light"
              className="mr-2 size-4 shrink-0 text-ink-muted"
            />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search units, codes, or jump to page…"
              className="h-11 w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-1.5">
            <Command.Empty className="px-3 py-6 text-left text-[12px] text-ink-muted">
              No matching unit or page.
            </Command.Empty>

            {shownUnits.length > 0 && (
              <Command.Group
                heading="Units"
                className="px-2 py-1 text-[11px] font-medium tracking-wide text-ink-muted uppercase"
              >
                {shownUnits.map((unit) => (
                  <Command.Item
                    key={unit.id}
                    value={`unit-${unit.unitCode}-${unit.unitNumber}`}
                    className="flex h-8 cursor-pointer items-center justify-between rounded-[4px] px-2 text-[13px] text-ink transition-colors hover:bg-subtle aria-selected:bg-subtle"
                    onSelect={() => {
                      close();
                      router.push(`/units/${unit.id}` as Route);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="unit-code font-mono text-[12px] font-semibold text-primary">
                        {unit.unitCode}
                      </span>
                      <span className="text-[12px] text-ink-muted">
                        Unit {unit.unitNumber}
                      </span>
                    </div>
                    <span className="text-[11px] text-ink-faint">Jump</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group
              heading="Pages"
              className="px-2 py-1 text-[11px] font-medium tracking-wide text-ink-muted uppercase"
            >
              {shownRoutes.map((route) => {
                const Icon = icons[route.href as keyof typeof icons] ?? Package;
                return (
                  <Command.Item
                    key={route.href}
                    value={route.label}
                    className="flex h-8 cursor-pointer items-center gap-2.5 rounded-[4px] px-2 text-[13px] text-ink transition-colors hover:bg-subtle aria-selected:bg-subtle"
                    onSelect={() => {
                      close();
                      router.push(route.href);
                    }}
                  >
                    <Icon weight="light" className="size-4 text-ink-muted" />
                    <span>{route.label}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
