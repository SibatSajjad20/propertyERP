import { notFound } from "next/navigation";
import { getReservationDetail } from "@/features/sales/queries";
import { ReservationDetailScreen } from "@/features/sales/components/reservation-detail-screen";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getReservationDetail(id);
  if (!data) return { title: "Reservation Not Found" };
  return {
    title: `Reservation ${data.reservation.unitCode}`,
  };
}

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "reservations.read");

  const { id } = await params;
  const data = await getReservationDetail(id);
  if (!data) notFound();

  return <ReservationDetailScreen data={data} role={session.user.role} />;
}
