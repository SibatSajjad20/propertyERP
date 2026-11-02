import { getReservationDetail, getSelectableUnits } from "@/features/sales/queries";
import { getInventoryFilterOptions } from "@/features/units/queries";
import { BookingWizard } from "@/features/sales/components/booking-wizard";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "New Booking",
};

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "bookings.create");

  const params = await searchParams;
  const unitId = typeof params.unitId === "string" ? params.unitId : undefined;
  const clientId = typeof params.clientId === "string" ? params.clientId : undefined;
  const reservationId =
    typeof params.reservationId === "string" ? params.reservationId : undefined;

  const [units, options, resData] = await Promise.all([
    getSelectableUnits({ clientId }),
    getInventoryFilterOptions(),
    reservationId ? getReservationDetail(reservationId) : null,
  ]);

  const initialClient = resData?.reservation
    ? {
        fullName: resData.reservation.clientName,
        cnic: resData.reservation.clientCnic,
        phone: resData.reservation.clientPhone,
        email: resData.reservation.clientEmail ?? "",
        homeAddress: resData.reservation.homeAddress,
        postalAddress: resData.reservation.postalAddress,
      }
    : undefined;

  const initialNextOfKin = resData?.nextOfKin
    ? {
        name: resData.nextOfKin.name,
        relation: resData.nextOfKin.relation,
        cnic: resData.nextOfKin.cnic ?? "",
        phone: resData.nextOfKin.phone,
        address: resData.nextOfKin.address ?? "",
      }
    : undefined;

  return (
    <BookingWizard
      units={units}
      floors={options.floors}
      categories={options.categories}
      role={session.user.role}
      preselectedUnitId={unitId}
      preselectedClientId={clientId}
      reservationId={reservationId}
      initialClient={initialClient}
      initialNextOfKin={initialNextOfKin}
    />
  );
}
