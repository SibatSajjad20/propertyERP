import { notFound } from "next/navigation";
import { getSoldDetail } from "@/features/sales/queries";
import { SoldDetailScreen } from "@/features/sales/components/sold-detail-screen";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getSoldDetail(id);
  if (!data) return { title: "Sale Not Found" };
  const unitCode =
    data.type === "DIRECT_SALE" ? data.data.unitCode : data.data.booking.unitCode;
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
  const data = await getSoldDetail(id);
  if (!data) notFound();

  return <SoldDetailScreen data={data} role={session.user.role} />;
}
