import { listBookings } from "@/features/sales/queries";
import { BookingsScreen } from "@/features/sales/components/bookings-screen";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Bookings",
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "bookings.read");

  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;

  const data = await listBookings({ status, q });

  return <BookingsScreen initialData={data} />;
}
