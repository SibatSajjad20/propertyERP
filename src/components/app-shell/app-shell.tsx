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
  children: React.ReactNode;
}

export function AppShell({ title, userName, role, children }: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <BreadcrumbProvider>
      <div className="flex min-h-screen bg-bg">
        <div className="hidden lg:block">
          <Sidebar role={role} userName={userName} />
        </div>
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent
            side="left"
            widthClass="w-[232px] max-w-[85vw]"
            hideCloseButton
            className="p-0 lg:hidden"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar
              role={role}
              userName={userName}
              onNavigate={() => setNavOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            title={title}
            userName={userName}
            role={role}
            onOpenNav={() => setNavOpen(true)}
          />
          <main
            id="main"
            className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
          >
            <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col">
              {children}
            </div>
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
