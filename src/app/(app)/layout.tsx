import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { auth, getSession } from "@/lib/auth";
import type { UserRole } from "@/db/schema/enums";
import { MustChangePasswordGate } from "./must-change-password-gate";

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

  const disabled = Boolean((session.user as { disabled?: boolean }).disabled);
  if (disabled) {
    await auth.api.signOut({ headers: await headers() });
    redirect("/login");
  }

  const mustChangePassword = Boolean(
    (session.user as { mustChangePassword?: boolean }).mustChangePassword,
  );

  return (
    <AppShell userName={session.user.name} role={session.user.role as UserRole}>
      <MustChangePasswordGate mustChangePassword={mustChangePassword}>
        {children}
      </MustChangePasswordGate>
    </AppShell>
  );
}
