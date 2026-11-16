import { getReservationDetail, getSelectableUnits } from "@/features/sales/queries";
import { getCachedInventoryFilterOptions } from "@/features/units/queries";
import { BookingWizard } from "@/features/sales/components/booking-wizard";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

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
    unitId ? getSelectableUnits({ unitId, clientId }) : Promise.resolve([]),
    getCachedInventoryFilterOptions(),
    reservationId ? getReservationDetail(reservationId) : null,
  ]);

  const initialClient = resData?.reservation
    ? {
        fullName: resData.reservation.clientName,
        relationPrefix:
          resData.reservation.clientRelationPrefix === "W/O"
            ? ("W/O" as const)
            : ("S/O" as const),
        relationName: resData.reservation.clientRelationName,
        cnic: resData.reservation.clientCnic,
        phone: resData.reservation.clientPhone,
        phoneOffice: resData.reservation.clientPhoneOffice ?? "",
        phoneRes: resData.reservation.clientPhoneRes ?? "",
        mobile2: resData.reservation.clientMobile2 ?? "",
        email: resData.reservation.clientEmail ?? "",
        homeAddress: resData.reservation.homeAddress,
        postalAddress: resData.reservation.postalAddress,
      }
    : undefined;

  const initialNextOfKin = resData?.nextOfKin
    ? {
        name: resData.nextOfKin.name,
        relationPrefix: ((): "S/O" | "D/O" | "W/O" => {
          const prefix = resData.nextOfKin.relationPrefix;
          if (prefix === "D/O" || prefix === "W/O" || prefix === "S/O") return prefix;
          return "S/O";
        })(),
        relationName: resData.nextOfKin.relationName,
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
