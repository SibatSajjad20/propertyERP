"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "@/db/schema/enums";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { BreadcrumbProvider } from "./breadcrumb-context";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import type { NavCounts } from "@/features/dashboard/queries";

export interface AppShellProps {
  title?: string;
  userName: string;
  userEmail?: string;
  role: UserRole;
  navLocked?: boolean;
  initialCollapsed?: boolean;
  navCountsPromise?: Promise<NavCounts>;
  children: React.ReactNode;
}

export function AppShell({
  title,
  userName,
  userEmail,
  role,
  navLocked = false,
  initialCollapsed = false,
  navCountsPromise,
  children,
}: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      document.cookie = `sidebar=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; SameSite=Lax`;
      return next;
    });
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "[" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === "INPUT" ||
            activeEl.tagName === "TEXTAREA" ||
            activeEl.tagName === "SELECT" ||
            (activeEl as HTMLElement).isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        toggleCollapsed();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <BreadcrumbProvider>
      <div className="flex min-h-screen bg-bg print:bg-white">
        {/* Desktop Sidebar: sticky top-0 h-screen */}
        <div className="sticky top-0 hidden h-screen shrink-0 lg:flex print:hidden">
          <Sidebar
            role={role}
            userName={userName}
            userEmail={userEmail}
            navLocked={navLocked}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapsed}
            countsPromise={navCountsPromise}
          />
        </div>

        {/* Mobile Sheet */}
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent
            side="left"
            widthClass="w-[248px] max-w-[85vw]"
            hideCloseButton
            className="border-border bg-sidebar-bg p-0 lg:hidden print:hidden"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar
              role={role}
              userName={userName}
              userEmail={userEmail}
              navLocked={navLocked}
              collapsed={false}
              onNavigate={() => setNavOpen(false)}
              countsPromise={navCountsPromise}
            />
          </SheetContent>
        </Sheet>

        {/* Main layout */}
        <div className="flex min-w-0 flex-1 flex-col print:w-full print:min-w-full">
          <div className="print:hidden">
            <TopBar
              title={title}
              role={role}
              navLocked={navLocked}
              collapsed={collapsed}
              onToggleSidebar={toggleCollapsed}
              onOpenNav={() => setNavOpen(true)}
            />
          </div>

          <main
            id="main"
            className="flex min-h-0 flex-1 flex-col overflow-y-auto print:overflow-visible print:p-0"
          >
            <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-7 pt-6 pb-7 print:max-w-none print:p-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
