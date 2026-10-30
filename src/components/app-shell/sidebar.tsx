"use client";

import {
  BuildingsIcon,
  ClipboardTextIcon,
  PackageIcon,
  SquaresFourIcon,
  TreeStructureIcon,
  UploadSimpleIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/db/schema/enums";
import { can } from "@/lib/permissions";

const items = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: SquaresFourIcon,
    action: "dashboard.read",
  },
  { href: "/inventory", label: "Inventory", icon: PackageIcon, action: "units.read" },
  {
    href: "/structure",
    label: "Structure",
    icon: TreeStructureIcon,
    action: "structure.read",
  },
  { href: "/import", label: "Import", icon: UploadSimpleIcon, action: "units.import" },
  { href: "/users", label: "Users", icon: UsersIcon, action: "users.read" },
  { href: "/audit", label: "Audit", icon: ClipboardTextIcon, action: "audit.read" },
] as const;

type SidebarProps = {
  role: UserRole;
};

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const visible = items.filter((item) => can(role, item.action));

  return (
    <aside className="flex h-full w-[var(--sidebar-width)] shrink-0 flex-col border-r border-line bg-bg">
      <div className="flex h-[var(--topbar-height)] items-center gap-2 border-b border-line px-4">
        <BuildingsIcon
          weight="light"
          className="size-5 text-primary"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="font-display text-[15px] leading-none text-ink">
            Sardar&apos;s Mall
          </p>
          <p className="mt-1 text-[11px] tracking-wide text-ink-muted">Ledger</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Primary">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-8 items-center gap-2 rounded-sm px-2 text-[13px] transition-colors duration-[var(--duration)] ease-[var(--ease-ledger)]",
                active
                  ? "bg-primary text-surface"
                  : "text-ink hover:bg-[color-mix(in_srgb,var(--line)_70%,transparent)]",
              )}
            >
              <Icon weight="light" className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
