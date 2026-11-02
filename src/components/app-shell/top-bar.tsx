"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { List, MagnifyingGlass, SignOut, UserCircle } from "@phosphor-icons/react";
import type { UserRole } from "@/db/schema/enums";
import { CommandMenu } from "./command-menu";
import { useBreadcrumbOverride } from "./breadcrumb-context";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  title?: string;
  userName?: string;
  role: UserRole;
  onOpenNav?: () => void;
}

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  if (!first) return "U";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1];
  if (!last) return first.slice(0, 2).toUpperCase();
  return (first[0]! + last[0]!).toUpperCase();
}

function formatRole(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "INVENTORY_MANAGER":
      return "Inventory Manager";
    case "SALES":
      return "Sales";
    default:
      return role.replaceAll("_", " ");
  }
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
  if (pathname === "/units/new") {
    return { parent: "Inventory", current: "New Unit" };
  }
  if (pathname.includes("/edit")) {
    return { parent: "Inventory", current: "Edit Unit" };
  }
  if (pathname.startsWith("/units/")) {
    return { parent: "Inventory", current: "Unit" };
  }
  if (pathname === "/structure" || pathname.startsWith("/structure")) {
    return { current: "Structure" };
  }
  if (pathname === "/import" || pathname.startsWith("/import")) {
    return { current: "Import" };
  }
  if (pathname === "/bookings") {
    return { parent: "Sales", current: "Bookings" };
  }
  if (pathname.startsWith("/bookings/new")) {
    return { parent: "Bookings", current: "New Booking" };
  }
  if (pathname.startsWith("/bookings/")) {
    return { parent: "Sales", current: "Booking Detail" };
  }
  if (pathname === "/reservations") {
    return { parent: "Sales", current: "Reservations" };
  }
  if (pathname.startsWith("/reservations/new")) {
    return { parent: "Reservations", current: "New Reservation" };
  }
  if (pathname.startsWith("/reservations/")) {
    return { parent: "Sales", current: "Reservation Detail" };
  }
  if (pathname === "/installments" || pathname.startsWith("/installments")) {
    return { parent: "Sales", current: "Installments" };
  }
  if (pathname === "/sold") {
    return { parent: "Sales", current: "Sold" };
  }
  if (pathname.startsWith("/sold/")) {
    return { parent: "Sales", current: "Sold Unit Detail" };
  }
  if (pathname === "/reports") {
    return { current: "Reports" };
  }
  if (pathname === "/reports/summary") {
    return { parent: "Reports", current: "Summary" };
  }
  if (pathname === "/reports/sold") {
    return { parent: "Reports", current: "Sold" };
  }
  if (pathname === "/reports/booked") {
    return { parent: "Reports", current: "Booked" };
  }
  if (pathname === "/reports/reserved") {
    return { parent: "Reports", current: "Reserved" };
  }
  if (pathname === "/reports/installments") {
    return { parent: "Reports", current: "Collections" };
  }
  if (pathname === "/reports/client-ledger") {
    return { parent: "Reports", current: "Client Ledger" };
  }
  if (pathname.startsWith("/settings/users") || pathname === "/users") {
    return { parent: "Administration", current: "Users" };
  }
  if (pathname.startsWith("/settings/profile")) {
    return { parent: "Account", current: "Profile" };
  }
  if (pathname === "/audit" || pathname.startsWith("/audit")) {
    return { parent: "Administration", current: "Audit log" };
  }
  if (pathname.startsWith("/dev/ui")) {
    return { parent: "Dev", current: "UI Controls" };
  }
  return { current: "Dashboard" };
}

export function TopBar({ userName = "Staff", role, onOpenNav }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
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
  const breadcrumb = override ?? getBreadcrumbName(pathname);

  async function handleSignOut() {
    await authClient.signOut();
    window.location.replace("/login");
  }

  const initials = getInitials(userName);

  return (
    <header className="sticky top-0 z-30 flex h-[52px] items-center justify-between gap-3 border-b border-line bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] px-4 backdrop-blur-md select-none lg:px-6">
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
          className="flex min-w-0 items-center gap-1.5 text-[13px] text-ink-muted"
        >
          {breadcrumb.parent ? (
            <>
              <span className="hidden text-ink-muted sm:inline">{breadcrumb.parent}</span>
              <span className="hidden text-line-strong select-none sm:inline">/</span>
              <span className="truncate font-medium text-ink">{breadcrumb.current}</span>
            </>
          ) : (
            <span className="truncate font-medium text-ink">{breadcrumb.current}</span>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="flex h-9 w-10 cursor-pointer items-center justify-center rounded-[8px] border border-line bg-surface px-2.5 text-[13px] text-ink-muted transition-colors duration-[var(--duration-hover)] ease-[var(--ease-ledger)] hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] sm:w-52 sm:justify-between lg:w-64"
          aria-label="Search or jump to page"
        >
          <div className="flex min-w-0 items-center gap-2">
            <MagnifyingGlass weight="light" className="size-4 shrink-0 text-ink-muted" />
            <span className="hidden truncate text-ink-faint sm:inline">
              Search or jump to…
            </span>
          </div>
          <kbd className="hidden rounded border border-line bg-subtle px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink-muted sm:inline-flex">
            {modKey}K
          </kbd>
        </button>

        {/* User menu dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-subtle text-[11px] font-semibold text-primary transition-colors hover:bg-subtle/80 focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="text-[12px] font-medium text-ink">{userName}</div>
              <div className="text-[11px] text-ink-muted">{formatRole(role)}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/settings/profile" as never)}
              className="cursor-pointer"
            >
              <UserCircle weight="light" className="size-4 text-ink-muted" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="danger"
              onClick={() => void handleSignOut()}
              className="cursor-pointer"
            >
              <SignOut weight="light" className="size-4 text-sold" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} role={role} />
    </header>
  );
}
