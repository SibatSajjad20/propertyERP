import {
  getClientProfileWithBookings,
  getDueThisWeekInstallments,
} from "@/features/installments/queries";
import { InstallmentsScreen } from "@/features/installments/components/installments-screen";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Installments & Collections — Sardar's Mall ERP",
};

export default async function InstallmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "installments.read");

  const raw = await searchParams;
  const clientId = typeof raw.clientId === "string" ? raw.clientId : undefined;
  const q = typeof raw.q === "string" ? raw.q : undefined;

  const [initialSummary, initialProfile] = await Promise.all([
    getDueThisWeekInstallments(),
    clientId ? getClientProfileWithBookings(clientId) : Promise.resolve(null),
  ]);

  return (
    <InstallmentsScreen
      initialSummary={initialSummary}
      initialProfile={initialProfile}
      initialQuery={q}
      userRole={session.user.role}
    />
  );
}
