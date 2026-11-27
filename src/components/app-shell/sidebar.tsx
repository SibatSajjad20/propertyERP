"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  CaretUpDown,
  CaretRight,
  CaretDown,
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
  FileText,
  SidebarSimple,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/db/schema/enums";
import { visibleNavGroups, type AppNavItem } from "@/lib/nav";
import { authClient } from "@/lib/auth-client";
import { signOutAction } from "@/features/auth/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { NavCounts } from "@/features/dashboard/queries";

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
  "/agreements": FileText,
  "/sold": Tag,
  "/reports": ChartPie,
  "/reports/client-ledger": ClipboardText,
};

const reportSubTabs: Array<{ href: Route; label: string }> = [
  { href: "/reports/summary" as Route, label: "Summary" },
  { href: "/reports/sold" as Route, label: "Sold" },
  { href: "/reports/booked" as Route, label: "Booked" },
  { href: "/reports/reserved" as Route, label: "Reserved" },
  { href: "/reports/installments" as Route, label: "Installment Logistics" },
  { href: "/reports/client-ledger" as Route, label: "Client ledger" },
];

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

export interface SidebarProps {
  role: UserRole;
  userName?: string;
  userEmail?: string;
  navLocked?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  countsPromise?: Promise<NavCounts>;
}

function NavCountDisplay({
  countKey,
  countsPromise,
  collapsed,
}: {
  countKey?: AppNavItem["countKey"];
  countsPromise?: Promise<NavCounts>;
  collapsed?: boolean;
}) {
  if (!countKey || !countsPromise) return null;

  return (
    <React.Suspense fallback={null}>
      <NavCountValue countKey={countKey} promise={countsPromise} collapsed={collapsed} />
    </React.Suspense>
  );
}

function NavCountValue({
  countKey,
  promise,
  collapsed,
}: {
  countKey: NonNullable<AppNavItem["countKey"]>;
  promise: Promise<NavCounts>;
  collapsed?: boolean;
}) {
  const counts = React.use(promise);
  const val = counts[countKey];

  if (val === undefined || val === null || val === 0) return null;

  if (collapsed) {
    if (countKey === "installmentsOverdue" && val > 0) {
      return (
        <span
          className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-bad ring-2 ring-sidebar-bg"
          aria-hidden="true"
        />
      );
    }
    return null;
  }

  const isAlert = countKey === "installmentsOverdue";

  return (
    <span
      className={cn(
        "ml-auto text-[11.5px] font-normal tabular-nums",
        isAlert ? "font-medium text-bad" : "text-muted",
      )}
    >
      {val.toLocaleString()}
    </span>
  );
}

export function Sidebar({
  role,
  userName = "Staff",
  userEmail,
  navLocked = false,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  countsPromise,
}: SidebarProps) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  const isReportsPage = pathname === "/reports" || pathname.startsWith("/reports/");
  const [prevIsReportsPage, setPrevIsReportsPage] = React.useState(isReportsPage);
  const [reportsOpen, setReportsOpen] = React.useState(isReportsPage);

  if (isReportsPage !== prevIsReportsPage) {
    setPrevIsReportsPage(isReportsPage);
    if (isReportsPage) {
      setReportsOpen(true);
    }
  }

  function isCurrent(href: string): boolean {
    if (href === "/") return pathname === "/" || pathname === "/dashboard";
    if (href === "/reports") {
      return pathname === "/reports" || pathname.startsWith("/reports/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (pendingHref !== null && isCurrent(pendingHref)) {
    setPendingHref(null);
  }

  const groups = visibleNavGroups(role);
  const initials = getInitials(userName);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.replace("/login");
          },
        },
      });
    } catch (clientError) {
      console.warn(
        "Client sign out failed, invoking server sign out fallback:",
        clientError,
      );
      try {
        await signOutAction();
      } catch (serverError) {
        console.warn("Server sign out fallback failed:", serverError);
      }
    } finally {
      window.location.replace("/login");
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "flex h-full flex-col border-r border-border bg-sidebar-bg transition-[width] duration-[var(--duration-panel)] ease-[var(--ease-ledger)] select-none motion-reduce:transition-none",
          collapsed ? "w-[68px]" : "w-[248px]",
        )}
      >
        {/* Brand block */}
        <div className="shrink-0 p-3 pb-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-[48px] w-full cursor-pointer items-center gap-2.5 rounded-[10px] border border-transparent p-2 transition-colors hover:border-border",
                  collapsed && "justify-center p-0",
                )}
                aria-label="Organization menu"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                  <Image
                    src="/images/logo-mark.png"
                    alt="Logo"
                    width={22}
                    height={22}
                    className="size-[22px] object-contain"
                  />
                </div>
                {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="truncate text-[13.5px] leading-tight font-semibold tracking-[-0.01em] text-ink">
                        Sardar&apos;s Mall
                      </div>
                      <div className="truncate text-[11.5px] leading-tight text-muted">
                        Property ERP
                      </div>
                    </div>
                    <CaretUpDown
                      weight="regular"
                      className="size-3.5 shrink-0 text-subtle"
                    />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={6} className="w-52">
              <DropdownMenuLabel className="font-semibold text-ink">
                Sardar&apos;s Mall ERP
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {role === "ADMIN" && (
                <DropdownMenuItem asChild>
                  <Link href="/settings/company" className="cursor-pointer">
                    <Bank weight="regular" className="mr-2 size-4 text-muted" />
                    Company Settings
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/settings/profile" className="cursor-pointer">
                  <UserCircle weight="regular" className="mr-2 size-4 text-muted" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="cursor-pointer text-bad focus:text-bad disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SignOut weight="regular" className="mr-2 size-4 text-bad" />
                {isSigningOut ? "Signing out…" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation list */}
        <nav
          className={cn(
            "flex flex-1 flex-col gap-4.5 overflow-y-auto px-3 py-2",
            collapsed && "items-center gap-2.5 px-2",
          )}
          aria-label="Main navigation"
        >
          {groups.map((group, groupIdx) => (
            <div
              key={group.label}
              className={cn("w-full", collapsed && "flex flex-col items-center")}
            >
              {collapsed ? (
                groupIdx > 0 ? (
                  <div className="my-1.5 h-[1px] w-8 bg-line" aria-hidden="true" />
                ) : null
              ) : (
                <p className="px-2.5 pb-1.5 text-[11px] font-medium tracking-[0.01em] text-subtle">
                  {group.label}
                </p>
              )}

              <div className="flex w-full flex-col gap-1">
                {group.items.map((item) => {
                  const current = isCurrent(item.href);
                  const pending = pendingHref === item.href;
                  const active = pending || (current && pendingHref === null);
                  const Icon = navIcons[item.href] ?? Package;

                  if (item.href === "/reports") {
                    if (collapsed) {
                      return (
                        <DropdownMenu key={item.href}>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Reports menu"
                              className={cn(
                                "group relative mx-auto flex h-[36px] w-[42px] cursor-pointer items-center justify-center rounded-[7px] transition-colors duration-150",
                                active
                                  ? "border border-border bg-surface font-medium text-ink shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                                  : "border border-transparent text-text-secondary hover:bg-[#F1F3F6]",
                              )}
                            >
                              <Icon
                                weight="regular"
                                className={cn(
                                  "size-4 shrink-0 transition-colors",
                                  active
                                    ? "text-primary"
                                    : "text-[#8391A2] group-hover:text-ink",
                                )}
                              />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="right"
                            align="start"
                            sideOffset={12}
                            className="w-48 py-1"
                          >
                            <DropdownMenuLabel className="px-2.5 py-1 text-[11px] font-semibold tracking-wider text-subtle uppercase">
                              Reports
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {reportSubTabs.map((subTab) => {
                              const isSubActive =
                                pathname === subTab.href ||
                                (subTab.href === "/reports/summary" &&
                                  pathname === "/reports");
                              return (
                                <DropdownMenuItem key={subTab.href} asChild>
                                  <Link
                                    href={subTab.href}
                                    onClick={() => onNavigate?.()}
                                    className={cn(
                                      "cursor-pointer px-2.5 py-1.5 text-[12.5px]",
                                      isSubActive &&
                                        "bg-primary-soft font-semibold text-primary",
                                    )}
                                  >
                                    {subTab.label}
                                  </Link>
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    }

                    return (
                      <div key={item.href} className="flex flex-col">
                        <div
                          className={cn(
                            "group relative flex h-[32px] w-full cursor-pointer items-center justify-between rounded-[7px] px-2.5 text-[13px] transition-colors duration-150",
                            navLocked && "cursor-not-allowed opacity-50",
                            active
                              ? "border border-border bg-surface font-medium text-ink shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                              : "border border-transparent text-text-secondary hover:bg-[#F1F3F6]",
                          )}
                        >
                          <Link
                            href={navLocked ? "#" : "/reports/summary"}
                            aria-current={active ? "page" : undefined}
                            onClick={(e) => {
                              if (navLocked) {
                                e.preventDefault();
                                return;
                              }
                              setReportsOpen(true);
                              onNavigate?.();
                            }}
                            className="flex min-w-0 flex-1 items-center gap-2.5"
                          >
                            <Icon
                              weight="regular"
                              className={cn(
                                "size-4 shrink-0 transition-colors",
                                active
                                  ? "text-primary"
                                  : "text-[#8391A2] group-hover:text-ink",
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setReportsOpen((prev) => !prev);
                            }}
                            aria-label={
                              reportsOpen
                                ? "Collapse reports sub-menu"
                                : "Expand reports sub-menu"
                            }
                            className="hover:bg-wash/60 flex size-5 items-center justify-center rounded text-[#8391A2] transition-colors hover:text-ink"
                          >
                            {reportsOpen ? (
                              <CaretDown weight="bold" className="size-3" />
                            ) : (
                              <CaretRight weight="bold" className="size-3" />
                            )}
                          </button>
                        </div>

                        {reportsOpen && (
                          <div className="mt-1 ml-4 flex flex-col gap-0.5 border-l border-border/80 pl-3">
                            {reportSubTabs.map((subTab) => {
                              const isSubActive =
                                pathname === subTab.href ||
                                (subTab.href === "/reports/summary" &&
                                  pathname === "/reports");
                              return (
                                <Link
                                  key={subTab.href}
                                  href={navLocked ? "#" : subTab.href}
                                  onClick={() => onNavigate?.()}
                                  className={cn(
                                    "flex h-[28px] items-center rounded-[6px] px-2 text-[12px] transition-colors",
                                    isSubActive
                                      ? "bg-primary-soft font-semibold text-primary"
                                      : "text-muted hover:bg-[#F1F3F6] hover:text-ink",
                                  )}
                                >
                                  <span className="truncate">{subTab.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  const navItemContent = (
                    <Link
                      href={navLocked ? "#" : item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={(e) => {
                        if (navLocked) {
                          e.preventDefault();
                          return;
                        }
                        if (current) return;
                        setPendingHref(item.href);
                        onNavigate?.();
                      }}
                      className={cn(
                        "group relative flex cursor-pointer items-center transition-colors duration-150",
                        collapsed
                          ? "mx-auto h-[36px] w-[42px] justify-center rounded-[7px]"
                          : "h-[32px] w-full gap-2.5 rounded-[7px] px-2.5 text-[13px]",
                        navLocked && "cursor-not-allowed opacity-50",
                        active
                          ? "border border-border bg-surface font-medium text-ink shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                          : "border border-transparent text-text-secondary hover:bg-[#F1F3F6]",
                      )}
                    >
                      <Icon
                        weight="regular"
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          active ? "text-primary" : "text-[#8391A2] group-hover:text-ink",
                        )}
                      />

                      {!collapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          <NavCountDisplay
                            countKey={item.countKey}
                            countsPromise={countsPromise}
                            collapsed={false}
                          />
                        </>
                      )}

                      {collapsed && (
                        <NavCountDisplay
                          countKey={item.countKey}
                          countsPromise={countsPromise}
                          collapsed={true}
                        />
                      )}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{navItemContent}</TooltipTrigger>
                        <TooltipContent side="right">
                          <span>{item.label}</span>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <React.Fragment key={item.href}>{navItemContent}</React.Fragment>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto shrink-0 border-t border-border p-3 pt-2.5">
          {/* Collapse button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={cn(
                "mb-1.5 flex h-[30px] w-full cursor-pointer items-center gap-2.5 rounded-[7px] text-[12.5px] text-muted transition-colors hover:bg-[#F1F3F6] hover:text-ink",
                collapsed ? "mx-auto w-[42px] justify-center px-0" : "px-2.5",
              )}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <SidebarSimple weight="regular" className="size-4 text-[#8391A2]" />
              {!collapsed && (
                <>
                  <span>Collapse</span>
                  <kbd className="ml-auto rounded border border-border bg-white px-1.5 font-sans text-[11px] text-subtle">
                    [
                  </kbd>
                </>
              )}
            </button>
          )}

          {/* User profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] p-1.5 transition-colors hover:bg-[#F1F3F6]",
                  collapsed && "mx-auto w-[42px] justify-center p-1",
                )}
                aria-label="User account menu"
              >
                <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold tracking-[0.02em] text-white">
                  {initials}
                </div>
                {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="truncate text-[12.5px] leading-tight font-medium text-ink">
                        {userName}
                      </div>
                      <div className="truncate text-[11.5px] leading-tight text-muted">
                        {userEmail || "staff@sardarsmall.com"}
                      </div>
                    </div>
                    <DotsThreeVertical
                      weight="bold"
                      className="ml-auto size-4 shrink-0 text-subtle"
                    />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className="w-56">
              <DropdownMenuLabel>
                <div className="text-[13px] font-medium text-ink">{userName}</div>
                {userEmail && (
                  <div className="text-[12px] font-normal text-muted">{userEmail}</div>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/profile" className="cursor-pointer">
                  <UserCircle weight="regular" className="mr-2 size-4 text-muted" />
                  Profile settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="cursor-pointer text-bad focus:text-bad disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SignOut weight="regular" className="mr-2 size-4 text-bad" />
                {isSigningOut ? "Signing out…" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}
