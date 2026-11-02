import type { Route } from "next";
import type { UserRole } from "@/db/schema/enums";
import { can, type Action } from "./permissions";

export type AppNavItem = {
  href: Route;
  label: string;
  action: Action;
};

export const inventoryNav: AppNavItem[] = [
  { href: "/" as Route, label: "Dashboard", action: "dashboard.read" },
  { href: "/inventory" as Route, label: "Inventory", action: "units.read" },
  { href: "/structure" as Route, label: "Structure", action: "structure.read" },
  { href: "/import" as Route, label: "Import", action: "units.import" },
];

export const salesNav: AppNavItem[] = [
  { href: "/bookings" as Route, label: "Bookings", action: "bookings.read" },
  { href: "/reservations" as Route, label: "Reservations", action: "reservations.read" },
  { href: "/installments" as Route, label: "Installments", action: "installments.read" },
  { href: "/sold" as Route, label: "Sold", action: "sales.read" },
];

export const reportsNav: AppNavItem[] = [
  { href: "/reports" as Route, label: "Reports", action: "reports.read" },
];

export const adminNav: AppNavItem[] = [
  { href: "/settings/users" as Route, label: "Users", action: "users.read" },
  { href: "/audit" as Route, label: "Audit log", action: "audit.read" },
];

export const allNavItems: AppNavItem[] = [
  ...inventoryNav,
  ...salesNav,
  ...reportsNav,
  ...adminNav,
];

export function visibleNav(role: UserRole, items: AppNavItem[]): AppNavItem[] {
  return items.filter((item) => can(role, item.action));
}
