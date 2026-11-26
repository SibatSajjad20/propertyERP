import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { auth, getSession } from "@/lib/auth";
import type { UserRole } from "@/db/schema/enums";
import { MustChangePasswordGate } from "./must-change-password-gate";
import { getNavCounts } from "@/features/dashboard/queries";

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
  const pathname = (await headers()).get("x-pathname");
  if (mustChangePassword && pathname && pathname !== "/settings/profile") {
    redirect("/settings/profile");
  }

  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar")?.value;
  const initialCollapsed = sidebarCookie === "collapsed";

  const navCountsPromise = getNavCounts();

  return (
    <AppShell
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role as UserRole}
      navLocked={mustChangePassword}
      initialCollapsed={initialCollapsed}
      navCountsPromise={navCountsPromise}
    >
      <MustChangePasswordGate mustChangePassword={mustChangePassword}>
        {children}
      </MustChangePasswordGate>
    </AppShell>
  );
}
