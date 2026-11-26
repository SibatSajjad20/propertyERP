import { notFound } from "next/navigation";
import { listActiveSignatories } from "@/features/documents/receipts";
import { getBookingDetail, getBookingTitle } from "@/features/sales/queries";
import { BookingDetailScreen } from "@/features/sales/components/booking-detail-screen";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bookingNo = await getBookingTitle(id);
  if (!bookingNo) return { title: "Booking Not Found" };
  return {
    title: `Booking ${bookingNo}`,
  };
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "bookings.read");

  const { id } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const [data, signatories] = await Promise.all([
    getBookingDetail(id),
    listActiveSignatories(),
  ]);
  if (!data) notFound();

  return (
    <BookingDetailScreen
      data={data}
      role={session.user.role}
      signatories={signatories}
      initialTab={sp?.tab}
    />
  );
}
