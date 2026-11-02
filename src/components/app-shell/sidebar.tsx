"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardText,
  Package,
  SignOut,
  SquaresFour,
  TreeStructure,
  UploadSimple,
  Users,
  UserCircle,
  DotsThreeVertical,
  Receipt,
  ClockCountdown,
  Tag,
  CalendarDots,
  ChartPie,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/db/schema/enums";
import { adminNav, inventoryNav, reportsNav, salesNav, visibleNav } from "@/lib/nav";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navIcons: Record<
  string,
  React.ComponentType<{ weight?: "light" | "regular" | "bold"; className?: string }>
> = {
  "/": SquaresFour,
  "/dashboard": SquaresFour,
  "/inventory": Package,
  "/structure": TreeStructure,
  "/import": UploadSimple,
  "/settings/users": Users,
  "/audit": ClipboardText,
  "/bookings": Receipt,
  "/reservations": ClockCountdown,
  "/installments": CalendarDots,
  "/sold": Tag,
  "/reports": ChartPie,
};

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

export interface SidebarProps {
  role: UserRole;
  userName?: string;
  onNavigate?: () => void;
}

export function Sidebar({ role, userName = "Staff", onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const visibleInventory = visibleNav(role, inventoryNav);
  const visibleSales = visibleNav(role, salesNav);
  const visibleReports = visibleNav(role, reportsNav);
  const visibleAdmin = visibleNav(role, adminNav);

  async function handleSignOut() {
    await authClient.signOut();
    window.location.replace("/login");
  }

  const initials = getInitials(userName);

  const renderNavGroup = (
    title: string,
    items: typeof inventoryNav,
    ariaLabel: string,
  ) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className="px-2 pb-1 text-[11px] font-medium tracking-wide text-ink-muted uppercase">
          {title}
        </p>
        <nav className="flex flex-col gap-0.5" aria-label={ariaLabel}>
          {items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/" || pathname === "/dashboard"
                : item.href === "/reports"
                  ? pathname.startsWith("/reports")
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = navIcons[item.href] ?? Package;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex h-8 items-center gap-2.5 rounded-[6px] px-2.5 text-[13px] transition-colors duration-[var(--duration-hover)] ease-[var(--ease-ledger)]",
                  active
                    ? "bg-subtle font-medium text-ink"
                    : "text-ink-muted hover:bg-subtle/60 hover:text-ink",
                )}
              >
                {active && (
                  <span
                    className="absolute top-1.5 bottom-1.5 left-0 w-[2.5px] rounded-r bg-accent"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  weight="light"
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    active ? "text-primary" : "text-ink-muted group-hover:text-ink",
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  };

  return (
    <aside className="sticky top-0 z-40 flex h-screen w-[232px] shrink-0 flex-col justify-between overflow-hidden border-r border-line bg-surface select-none">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Top: serif wordmark + small brass mark */}
        <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-line px-4">
          <div className="flex items-center gap-2.5">
            <span
              className="size-2 rounded-[2px] bg-accent"
              aria-hidden="true"
              title="Sardar's Mall Hallmark"
            />
            <span className="wordmark text-[16px] font-semibold tracking-tight text-ink">
              Sardar&apos;s Mall
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-widest text-ink-muted uppercase">
            ERP
          </span>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-5 p-3">
          {renderNavGroup("Inventory", visibleInventory, "Inventory Navigation")}
          {renderNavGroup("Sales", visibleSales, "Sales Navigation")}
          {renderNavGroup("Reports", visibleReports, "Reports Navigation")}
          {renderNavGroup("Administration", visibleAdmin, "Administration Navigation")}
        </div>
      </div>

      {/* Bottom: user footer pinned at the bottom (mt-auto), no blank strip below */}
      <div className="mt-auto shrink-0 border-t border-line bg-surface p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[6px] p-1.5 text-left transition-colors duration-[var(--duration-hover)] ease-[var(--ease-ledger)] hover:bg-subtle focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line-strong bg-subtle text-[11px] font-semibold text-primary">
                  {initials}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="truncate text-[12px] leading-tight font-medium text-ink">
                    {userName}
                  </p>
                  <p className="truncate text-[11px] leading-tight text-ink-muted">
                    {formatRole(role)}
                  </p>
                </div>
              </div>
              <DotsThreeVertical
                weight="light"
                className="size-4 shrink-0 text-ink-muted"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
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
    </aside>
  );
}
