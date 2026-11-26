"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { List, MagnifyingGlass, SidebarSimple } from "@phosphor-icons/react";
import type { UserRole } from "@/db/schema/enums";
import { CommandMenu } from "./command-menu";
import { useBreadcrumbOverride } from "./breadcrumb-context";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

export interface TopBarProps {
  title?: string;
  role: UserRole;
  navLocked?: boolean;
  collapsed?: boolean;
  onToggleSidebar?: () => void;
  onOpenNav?: () => void;
}

function getBreadcrumbSegments(pathname: string): { parents: string[]; current: string } {
  if (
    pathname === "/" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard")
  ) {
    return { parents: [], current: "Dashboard" };
  }
  if (pathname === "/inventory") {
    return { parents: [], current: "Units" };
  }
  if (pathname.startsWith("/inventory/merges")) {
    return { parents: ["Units"], current: "Merge Requests" };
  }
  if (pathname === "/units/new") {
    return { parents: ["Units"], current: "New Unit" };
  }
  if (pathname.includes("/edit")) {
    return { parents: ["Units"], current: "Edit Unit" };
  }
  if (pathname.startsWith("/units/")) {
    return { parents: ["Units"], current: "Unit" };
  }
  if (pathname === "/structure" || pathname.startsWith("/structure")) {
    return { parents: [], current: "Structure" };
  }
  if (pathname === "/import" || pathname.startsWith("/import")) {
    return { parents: [], current: "Import" };
  }
  if (pathname === "/bookings") {
    return { parents: ["Sales"], current: "Bookings" };
  }
  if (pathname.startsWith("/bookings/new")) {
    return { parents: ["Sales", "Bookings"], current: "New Booking" };
  }
  if (pathname.startsWith("/bookings/")) {
    return { parents: ["Sales", "Bookings"], current: "Booking Detail" };
  }
  if (pathname === "/reservations") {
    return { parents: ["Sales"], current: "Reservations" };
  }
  if (pathname.startsWith("/reservations/new")) {
    return { parents: ["Sales", "Reservations"], current: "New Reservation" };
  }
  if (pathname.startsWith("/reservations/")) {
    return { parents: ["Sales", "Reservations"], current: "Reservation Detail" };
  }
  if (pathname === "/installments" || pathname.startsWith("/installments")) {
    return { parents: ["Sales"], current: "Installments" };
  }
  if (pathname === "/agreements") {
    return { parents: ["Sales"], current: "Agreements" };
  }
  if (pathname.startsWith("/agreements/")) {
    return { parents: ["Sales", "Agreements"], current: "Agreement Detail" };
  }
  if (pathname === "/sold") {
    return { parents: ["Sales"], current: "Sold" };
  }
  if (pathname.startsWith("/sold/")) {
    return { parents: ["Sales", "Sold"], current: "Sold Unit Detail" };
  }
  if (pathname === "/reports" || pathname === "/reports/summary") {
    return { parents: ["Reports"], current: "Summary" };
  }
  if (pathname === "/reports/sold") {
    return { parents: ["Reports"], current: "Sold" };
  }
  if (pathname === "/reports/booked") {
    return { parents: ["Reports"], current: "Booked" };
  }
  if (pathname === "/reports/reserved") {
    return { parents: ["Reports"], current: "Reserved" };
  }
  if (pathname === "/reports/installments") {
    return { parents: ["Reports"], current: "Installments" };
  }
  if (pathname === "/reports/collections") {
    return { parents: ["Reports"], current: "Collections" };
  }
  if (pathname === "/reports/client-ledger") {
    return { parents: ["Reports"], current: "Client Ledger" };
  }
  if (pathname.startsWith("/settings/users") || pathname === "/users") {
    return { parents: ["Admin"], current: "Users" };
  }
  if (pathname.startsWith("/settings/company")) {
    return { parents: ["Admin"], current: "Company" };
  }
  if (pathname.startsWith("/settings/profile")) {
    return { parents: ["Account"], current: "Profile" };
  }
  if (pathname === "/audit" || pathname.startsWith("/audit")) {
    return { parents: ["Admin"], current: "Audit log" };
  }
  if (pathname.startsWith("/dev/ui")) {
    return { parents: ["Dev"], current: "UI Controls" };
  }
  return { parents: [], current: "Dashboard" };
}

export function TopBar({
  role,
  navLocked = false,
  collapsed = false,
  onToggleSidebar,
  onOpenNav,
}: TopBarProps) {
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

  let parents: string[] = [];
  let currentTitle = "Dashboard";

  if (override) {
    if (Array.isArray(override.parent)) {
      parents = override.parent;
    } else if (override.parent) {
      parents = [override.parent];
    }
    currentTitle = override.current;
  } else {
    const auto = getBreadcrumbSegments(pathname);
    parents = auto.parents;
    currentTitle = auto.current;
  }

  // Normalize any old "Inventory" root to "Units"
  parents = parents.map((p) => (p === "Inventory" ? "Units" : p));

  return (
    <header className="sticky top-0 z-30 flex h-[56px] shrink-0 items-center justify-between border-b border-border bg-surface px-5 select-none sm:px-7">
      <div className="flex min-w-0 items-center gap-2">
        {onOpenNav && (
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-[6px] border border-border bg-surface text-muted hover:text-ink lg:hidden"
            aria-label="Open navigation"
            onClick={onOpenNav}
          >
            <List weight="regular" className="size-4" />
          </button>
        )}

        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="mr-2 hidden size-7 cursor-pointer items-center justify-center rounded-[6px] border border-border bg-surface text-subtle transition-colors hover:border-line-strong hover:text-ink lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <SidebarSimple weight="regular" className="size-3.5" />
          </button>
        )}

        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-2 text-[13px] text-muted"
        >
          {parents.map((p, idx) => (
            <span key={idx} className="flex shrink-0 items-center gap-2">
              <span className="transition-colors hover:text-ink">{p}</span>
              <span className="text-[#CBD2DA] select-none" aria-hidden="true">
                /
              </span>
            </span>
          ))}
          <span className="truncate font-medium text-ink">{currentTitle}</span>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (navLocked) {
              toast.error("Set a new password before using the ledger.");
              return;
            }
            setCommandOpen(true);
          }}
          className={cn(
            "flex h-[34px] w-10 cursor-pointer items-center justify-center rounded-[8px] border border-border bg-sidebar-bg px-2.5 text-[13px] text-subtle transition-colors duration-[var(--duration-hover)] ease-[var(--ease-ledger)] hover:border-line-strong focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] sm:w-[280px] sm:justify-between md:w-[340px]",
          )}
          aria-label="Search units, clients, bookings"
        >
          <div className="flex min-w-0 items-center gap-2">
            <MagnifyingGlass weight="regular" className="size-3.5 shrink-0 text-subtle" />
            <span className="hidden truncate text-subtle sm:inline">
              Search units, clients, bookings…
            </span>
          </div>
          <kbd className="hidden rounded border border-border bg-white px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted shadow-2xs sm:inline-flex">
            {modKey}K
          </kbd>
        </button>
      </div>

      <CommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        role={role}
        navLocked={navLocked}
      />
    </header>
  );
}
