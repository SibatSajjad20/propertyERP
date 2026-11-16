import { notFound } from "next/navigation";
import { listActiveSignatories } from "@/features/documents/receipts";
import { getSoldDetail, getSoldTitle } from "@/features/sales/queries";
import { SoldDetailScreen } from "@/features/sales/components/sold-detail-screen";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unitCode = await getSoldTitle(id);
  if (!unitCode) return { title: "Sale Not Found" };
  return {
    title: `Sold Unit ${unitCode}`,
  };
}

export default async function SoldDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "sales.read");

  const { id } = await params;
  const [data, signatories] = await Promise.all([
    getSoldDetail(id),
    listActiveSignatories(),
  ]);
  if (!data) notFound();

  return (
    <SoldDetailScreen data={data} role={session.user.role} signatories={signatories} />
  );
}
