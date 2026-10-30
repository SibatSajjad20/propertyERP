import type { UserRole } from "@/db/schema/enums";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

type AppShellProps = {
  title: string;
  userName: string;
  role: UserRole;
  children: React.ReactNode;
};

export function AppShell({ title, userName, role, children }: AppShellProps) {
  return (
    <div className="flex min-h-full">
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} userName={userName} role={role} />
        <main id="main" className="flex min-h-0 flex-1 flex-col p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
