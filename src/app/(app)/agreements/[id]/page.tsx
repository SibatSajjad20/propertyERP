import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { getAgreementDetail } from "@/features/agreements/queries";
import { AgreementDetailScreen } from "@/features/agreements/components/agreement-detail-screen";

export const maxDuration = 30;

export const metadata: Metadata = {
  title: "Agreement Detail",
};

export default async function AgreementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "agreements.read");

  const { id } = await params;
  const data = await getAgreementDetail(id);
  if (!data) notFound();

  return <AgreementDetailScreen data={data} />;
}
