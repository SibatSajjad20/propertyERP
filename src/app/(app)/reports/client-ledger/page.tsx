import { searchInstallmentsClients } from "@/features/installments/queries";
import { ClientLedgerScreen } from "@/features/reports/components/client-ledger-screen";
import { getClientLedgerReport } from "@/features/reports/queries";
import { reportFiltersSchema } from "@/features/reports/schema";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Client Ledger & Statement — Sardar's Mall ERP",
};

export default async function ClientLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "reports.read");

  const raw = await searchParams;
  const stringified: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") stringified[k] = v;
  }

  const filters = reportFiltersSchema.parse(stringified);
  const q = filters.q;
  const clientId = filters.clientId;

  let searchedClients: Array<{
    id: string;
    fullName: string;
    cnic: string;
    phone: string;
  }> = [];
  if (q) {
    const clients = await searchInstallmentsClients(q);
    searchedClients = clients.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      cnic: c.cnic,
      phone: c.phone,
    }));
  }

  const ledgerData = clientId ? await getClientLedgerReport(clientId, filters) : null;

  return (
    <ClientLedgerScreen
      ledgerData={ledgerData}
      searchedClients={searchedClients}
      currentClientId={clientId}
    />
  );
}
