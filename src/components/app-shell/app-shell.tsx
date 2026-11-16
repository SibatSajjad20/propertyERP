"use client";

import { useState } from "react";
import type { UserRole } from "@/db/schema/enums";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { BreadcrumbProvider } from "./breadcrumb-context";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export interface AppShellProps {
  title?: string;
  userName: string;
  role: UserRole;
  navLocked?: boolean;
  children: React.ReactNode;
}

export function AppShell({
  title,
  userName,
  role,
  navLocked = false,
  children,
}: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <BreadcrumbProvider>
      <div className="flex min-h-screen bg-bg">
        {/* Desktop Sidebar: sticky top-0 h-screen, user footer pinned at bottom, no blank strip */}
        <div className="hidden shrink-0 lg:flex">
          <Sidebar role={role} userName={userName} navLocked={navLocked} />
        </div>
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent
            side="left"
            widthClass="w-[232px] max-w-[85vw]"
            hideCloseButton
            className="border-[#E3E7EC] bg-surface p-0 lg:hidden"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar
              role={role}
              userName={userName}
              navLocked={navLocked}
              onNavigate={() => setNavOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            title={title}
            userName={userName}
            role={role}
            navLocked={navLocked}
            onOpenNav={() => setNavOpen(true)}
          />
          {/* Main Content: max-w-[1440px] mx-auto px-6 py-6 (page padding 24) */}
          <main id="main" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
