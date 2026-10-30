import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { getSession } from "@/lib/auth";
import type { UserRole } from "@/db/schema/enums";

export const instant = false;

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell
      title="Ledger"
      userName={session.user.name}
      role={session.user.role as UserRole}
    >
      {children}
    </AppShell>
  );
}
