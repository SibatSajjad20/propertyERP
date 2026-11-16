"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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
  Bank,
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
import { toast } from "sonner";
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
  "/settings/company": Bank,
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
  navLocked?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({
  role,
  userName = "Staff",
  navLocked = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  function isCurrent(href: string): boolean {
    if (href === "/") return pathname === "/" || pathname === "/dashboard";
    if (href === "/reports") return pathname.startsWith("/reports");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (pendingHref !== null && isCurrent(pendingHref)) {
    setPendingHref(null);
  }

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
        <p className="px-2 pb-1 text-[11px] font-medium tracking-[0.08em] text-ink-faint uppercase">
          {title}
        </p>
        <nav className="flex flex-col gap-0.5" aria-label={ariaLabel}>
          {items.map((item) => {
            const current = isCurrent(item.href);
            const pending = pendingHref === item.href;
            const active = pending || (current && pendingHref === null);
            const Icon = navIcons[item.href] ?? Package;
            const itemClassName = cn(
              "group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors duration-150 ease-[var(--ease-ledger)]",
              navLocked && "cursor-not-allowed opacity-50",
              active
                ? "bg-primary font-medium text-white"
                : "text-[#334155] hover:bg-primary-soft hover:text-primary",
            );
            const itemBody = (
              <>
                <Icon
                  weight="regular"
                  className={cn(
                    "size-4 shrink-0 transition-colors duration-150",
                    active ? "text-white" : "text-primary/80 group-hover:text-primary",
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </>
            );
            if (navLocked) {
              return (
                <button
                  key={item.href}
                  type="button"
                  className={itemClassName}
                  onClick={() => {
                    toast.error("Set a new password before using the ledger.");
                  }}
                >
                  {itemBody}
                </button>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={(event) => {
                  if (
                    event.defaultPrevented ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0
                  ) {
                    return;
                  }
                  setPendingHref(item.href);
                  onNavigate?.();
                }}
                className={itemClassName}
              >
                {itemBody}
              </Link>
            );
          })}
        </nav>
      </div>
    );
  };

  return (
    <aside className="sticky top-0 z-40 flex h-screen w-[232px] shrink-0 flex-col justify-between overflow-hidden border-r border-[#E3E7EC] bg-surface select-none">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex h-[56px] shrink-0 items-center px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/5 p-1">
              <Image
                src="/images/logo-mark.png"
                alt="Sardar's Mall logo"
                width={32}
                height={32}
                className="size-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="wordmark text-[15px] leading-tight font-semibold tracking-tight text-[#0F172A]">
                Sardar&apos;s Mall
              </span>
              <span className="text-[10px] font-medium tracking-wide text-ink-faint uppercase">
                Property ERP
              </span>
            </div>
          </div>
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
      <div className="mt-auto shrink-0 border-t border-[#E3E7EC] bg-surface p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md p-1.5 text-left transition-colors duration-150 ease-[var(--ease-ledger)] hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white">
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
                className="size-4 shrink-0 text-ink-faint"
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
