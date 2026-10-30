"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { searchUnits } from "@/features/units/actions";
import type { UnitJumpTarget } from "@/features/units/types";

const routes = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
  { href: "/structure", label: "Structure" },
  { href: "/import", label: "Import" },
  { href: "/users", label: "Users" },
  { href: "/audit", label: "Audit" },
] as const;

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [units, setUnits] = useState<UnitJumpTarget[]>([]);
  const router = useRouter();

  function close() {
    setOpen(false);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
    <div className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--ink)_24%,transparent)]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close command menu"
        onClick={close}
      />
      <div className="relative mx-auto mt-[12vh] w-full max-w-lg border border-line bg-surface">
        <Command
          label="Jump to"
          className="text-[13px]"
          shouldFilter={false}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              close();
            }
          }}
        >
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Jump to a page or unit code…"
            className="h-10 w-full border-b border-line bg-surface px-3 outline-none"
          />
          <Command.List className="max-h-72 overflow-auto p-1">
            <Command.Empty className="px-2 py-3 text-ink-muted">
              No matching page or unit.
            </Command.Empty>
            {shownUnits.length > 0 ? (
              <Command.Group
                heading="Units"
                className="px-1 py-1 text-[11px] text-ink-muted"
              >
                {shownUnits.map((unit) => (
                  <Command.Item
                    key={unit.id}
                    value={`unit-${unit.unitCode}-${unit.unitNumber}`}
                    className="flex h-8 cursor-pointer items-center gap-2 px-2 text-[13px] text-ink aria-selected:bg-[color-mix(in_srgb,var(--line)_80%,transparent)]"
                    onSelect={() => {
                      close();
                      router.push(`/units/${unit.id}`);
                    }}
                  >
                    <span className="unit-code">{unit.unitCode}</span>
                    <span className="text-ink-muted">{unit.unitNumber}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
            <Command.Group
              heading="Pages"
              className="px-1 py-1 text-[11px] text-ink-muted"
            >
              {shownRoutes.map((route) => (
                <Command.Item
                  key={route.href}
                  value={route.label}
                  className="flex h-8 cursor-pointer items-center px-2 text-[13px] text-ink aria-selected:bg-[color-mix(in_srgb,var(--line)_80%,transparent)]"
                  onSelect={() => {
                    close();
                    router.push(route.href);
                  }}
                >
                  {route.label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
