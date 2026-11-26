import type { Route } from "next";
import type { UserRole } from "@/db/schema/enums";
import { can, type Action } from "./permissions";

export type AppNavItem = {
  href: Route;
  label: string;
  action: Action;
  countKey?:
    | "unitsTotal"
    | "bookingsActive"
    | "reservationsActive"
    | "soldTotal"
    | "installmentsOverdue";
};

export type NavGroup = {
  label: string;
  items: AppNavItem[];
};

export const overviewNav: AppNavItem[] = [
  { href: "/" as Route, label: "Dashboard", action: "dashboard.read" },
];

export const inventoryNav: AppNavItem[] = [
  {
    href: "/inventory" as Route,
    label: "Units",
    action: "units.read",
    countKey: "unitsTotal",
  },
  { href: "/structure" as Route, label: "Structure", action: "structure.read" },
  { href: "/import" as Route, label: "Import", action: "units.import" },
];

export const salesNav: AppNavItem[] = [
  {
    href: "/bookings" as Route,
    label: "Bookings",
    action: "bookings.read",
    countKey: "bookingsActive",
  },
  {
    href: "/reservations" as Route,
    label: "Reservations",
    action: "reservations.read",
    countKey: "reservationsActive",
  },
  {
    href: "/installments" as Route,
    label: "Installments",
    action: "installments.read",
    countKey: "installmentsOverdue",
  },
  { href: "/agreements" as Route, label: "Agreements", action: "agreements.read" },
  { href: "/sold" as Route, label: "Sold", action: "sales.read", countKey: "soldTotal" },
];

export const insightsNav: AppNavItem[] = [
  { href: "/reports" as Route, label: "Reports", action: "reports.read" },
  {
    href: "/reports/client-ledger" as Route,
    label: "Client ledger",
    action: "reports.read",
  },
];

export const reportsNav: AppNavItem[] = [
  { href: "/reports" as Route, label: "Reports", action: "reports.read" },
];

export const adminNav: AppNavItem[] = [
  { href: "/settings/users" as Route, label: "Users", action: "users.read" },
  { href: "/settings/company" as Route, label: "Company", action: "settings.manage" },
  { href: "/audit" as Route, label: "Audit log", action: "audit.read" },
];

export const navGroups: NavGroup[] = [
  { label: "Overview", items: overviewNav },
  { label: "Inventory", items: inventoryNav },
  { label: "Sales", items: salesNav },
  { label: "Insights", items: insightsNav },
  { label: "Admin", items: adminNav },
];

export const allNavItems: AppNavItem[] = [
  ...overviewNav,
  ...inventoryNav,
  ...salesNav,
  ...insightsNav,
  ...adminNav,
];

export function visibleNav(role: UserRole, items: AppNavItem[]): AppNavItem[] {
  return items.filter((item) => can(role, item.action));
}

export function visibleNavGroups(role: UserRole): NavGroup[] {
  return navGroups
    .map((group) => ({
      label: group.label,
      items: visibleNav(role, group.items),
    }))
    .filter((group) => group.items.length > 0);
}
