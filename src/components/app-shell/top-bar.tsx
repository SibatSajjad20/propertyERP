"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { List, MagnifyingGlass } from "@phosphor-icons/react";
import type { UserRole } from "@/db/schema/enums";
import { CommandMenu } from "./command-menu";
import { useBreadcrumbOverride } from "./breadcrumb-context";

interface TopBarProps {
  title?: string;
  userName?: string;
  role: UserRole;
  onOpenNav?: () => void;
}

function getBreadcrumbName(pathname: string): { parent?: string; current: string } {
  if (
    pathname === "/" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard")
  ) {
    return { current: "Dashboard" };
  }
  if (pathname === "/inventory") {
    return { current: "Inventory" };
  }
  if (pathname.startsWith("/units")) {
    return { parent: "Inventory", current: "Unit" };
  }
  if (pathname === "/structure" || pathname.startsWith("/structure")) {
    return { current: "Structure" };
  }
  if (pathname === "/import" || pathname.startsWith("/import")) {
    return { current: "Import" };
  }
  if (pathname.startsWith("/settings/users") || pathname === "/users") {
    return { current: "Users" };
  }
  if (pathname.startsWith("/settings/profile")) {
    return { current: "Profile" };
  }
  if (pathname === "/audit" || pathname.startsWith("/audit")) {
    return { current: "Audit log" };
  }
  return { current: "Dashboard" };
}

export function TopBar({ title, role, onOpenNav }: TopBarProps) {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = useState(false);
  const [modKey] = useState(() => {
    if (typeof navigator === "undefined") {
      return "Ctrl";
    }
    const mac =
      /Mac|iPhone|iPad/.test(navigator.platform) || navigator.userAgent.includes("Mac");
    return mac ? "⌘" : "Ctrl";
  });
  const { override } = useBreadcrumbOverride();
  const fromPath =
    title && title !== "Ledger" ? { current: title } : getBreadcrumbName(pathname);
  const breadcrumb = override ?? fromPath;

  return (
    <header className="sticky top-0 z-30 flex h-[52px] items-center justify-between gap-3 border-b border-line bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] px-4 backdrop-blur-md select-none lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        {onOpenNav ? (
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-[6px] border border-line bg-surface text-ink-muted focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] lg:hidden"
            aria-label="Open navigation"
            onClick={onOpenNav}
          >
            <List weight="light" className="size-4" />
          </button>
        ) : null}
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-2 text-[13px]"
        >
          {breadcrumb.parent ? (
            <>
              <span className="hidden text-ink-muted sm:inline">{breadcrumb.parent}</span>
              <span className="hidden text-line-strong select-none sm:inline">/</span>
              <span className="truncate font-semibold text-ink">
                {breadcrumb.current}
              </span>
            </>
          ) : (
            <span className="truncate text-[15px] font-semibold tracking-tight text-ink">
              {breadcrumb.current}
            </span>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="flex h-8 w-10 cursor-pointer items-center justify-center rounded-[6px] border border-line bg-surface px-2.5 text-[12px] text-ink-muted transition-colors duration-[var(--duration-hover)] ease-[var(--ease-ledger)] hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] sm:w-52 sm:justify-between lg:w-64"
          aria-label="Search or jump to page"
        >
          <div className="flex min-w-0 items-center gap-2">
            <MagnifyingGlass
              weight="light"
              className="size-3.5 shrink-0 text-ink-muted"
            />
            <span className="hidden truncate text-ink-faint sm:inline">
              Search or jump to…
            </span>
          </div>
          <kbd className="hidden rounded border border-line bg-subtle px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink-muted sm:inline-flex">
            {modKey}K
          </kbd>
        </button>
      </div>

      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} role={role} />
    </header>
  );
}
