"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const router = useRouter();

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

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--ink)_24%,transparent)]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close command menu"
        onClick={() => setOpen(false)}
      />
      <div className="relative mx-auto mt-[12vh] w-full max-w-lg border border-line bg-surface">
        <Command
          label="Jump to"
          className="text-[13px]"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        >
          <Command.Input
            autoFocus
            placeholder="Jump to…"
            className="h-10 w-full border-b border-line bg-surface px-3 outline-none"
          />
          <Command.List className="max-h-72 overflow-auto p-1">
            <Command.Empty className="px-2 py-3 text-ink-muted">
              No matching page.
            </Command.Empty>
            {routes.map((route) => (
              <Command.Item
                key={route.href}
                value={route.label}
                className="flex h-8 cursor-pointer items-center px-2 aria-selected:bg-[color-mix(in_srgb,var(--line)_80%,transparent)]"
                onSelect={() => {
                  setOpen(false);
                  router.push(route.href);
                }}
              >
                {route.label}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
