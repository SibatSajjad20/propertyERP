import { getSelectableUnits } from "@/features/sales/queries";
import { getInventoryFilterOptions } from "@/features/units/queries";
import { ReservationWizard } from "@/features/sales/components/reservation-wizard";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "New Reservation",
};

export default async function NewReservationPage() {
  const session = await requireSession();
  assertCan(session.user.role, "reservations.create");

  const [units, options] = await Promise.all([
    getSelectableUnits({}),
    getInventoryFilterOptions(),
  ]);

  return (
    <ReservationWizard
      units={units}
      floors={options.floors}
      categories={options.categories}
    />
  );
}
