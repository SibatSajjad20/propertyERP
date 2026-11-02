import { notFound } from "next/navigation";
import { getBookingDetail } from "@/features/sales/queries";
import { BookingDetailScreen } from "@/features/sales/components/booking-detail-screen";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getBookingDetail(id);
  if (!data) return { title: "Booking Not Found" };
  return {
    title: `Booking ${data.booking.bookingNo}`,
  };
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "bookings.read");

  const { id } = await params;
  const data = await getBookingDetail(id);
  if (!data) notFound();

  return <BookingDetailScreen data={data} role={session.user.role} />;
}
