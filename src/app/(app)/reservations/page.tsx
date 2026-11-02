import { listReservations } from "@/features/sales/queries";
import { ReservationsScreen } from "@/features/sales/components/reservations-screen";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Reservations",
};

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "reservations.read");

  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;

  const data = await listReservations({ status, q });

  return <ReservationsScreen initialData={data} />;
}
