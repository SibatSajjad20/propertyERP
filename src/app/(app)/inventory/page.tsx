import { InventoryPage } from "@/features/units/components/inventory-page";
import { listInventoryRows } from "@/features/units/queries";

export const instant = false;

export const metadata = {
  title: "Inventory",
};

export default async function InventoryRoute() {
  const rows = await listInventoryRows();
  return <InventoryPage rows={rows} />;
}
