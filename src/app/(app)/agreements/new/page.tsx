import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { listAgreementCandidates } from "@/features/agreements/queries";
import { NewAgreementScreen } from "@/features/agreements/components/new-agreement-screen";

export const metadata: Metadata = {
  title: "New Agreement — Sardar's Mall ERP",
};

export default async function NewAgreementPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "agreements.manage");

  const params = await searchParams;
  const bookingId = typeof params.bookingId === "string" ? params.bookingId : undefined;
  const saleId = typeof params.saleId === "string" ? params.saleId : undefined;

  const candidates = await listAgreementCandidates();

  return (
    <NewAgreementScreen
      candidates={candidates}
      preselectedBookingId={bookingId}
      preselectedSaleId={saleId}
    />
  );
}
