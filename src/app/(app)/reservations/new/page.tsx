import { getCachedInventoryFilterOptions } from "@/features/units/queries";
import { getSelectableUnits } from "@/features/sales/queries";
import { ReservationWizard } from "@/features/sales/components/reservation-wizard";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const metadata = {
  title: "New Reservation",
};

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "reservations.create");

  const params = await searchParams;
  const unitId = typeof params.unitId === "string" ? params.unitId : undefined;

  const [options, units] = await Promise.all([
    getCachedInventoryFilterOptions(),
    unitId ? getSelectableUnits({ unitId }) : Promise.resolve([]),
  ]);

  return (
    <ReservationWizard
      units={units}
      floors={options.floors}
      categories={options.categories}
      preselectedUnitId={unitId}
    />
  );
}
