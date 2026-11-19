import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { listAgreementCandidates, listAgreements } from "@/features/agreements/queries";
import { AgreementsScreen } from "@/features/agreements/components/agreements-screen";

export const maxDuration = 30;

export const metadata: Metadata = {
  title: "Agreements",
};

export default async function AgreementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "agreements.read");

  const params = await searchParams;
  const bookingId = typeof params.bookingId === "string" ? params.bookingId : undefined;
  const saleId = typeof params.saleId === "string" ? params.saleId : undefined;

  const agreements = await listAgreements();
  const candidates = await listAgreementCandidates();

  return (
    <AgreementsScreen
      agreements={agreements}
      candidates={candidates}
      preselectedBookingId={bookingId}
      preselectedSaleId={saleId}
    />
  );
}
