import type { UnitStatus } from "@/db/schema/enums";
import type { units } from "@/db/schema/units";

export type InventoryRow = {
  id: string;
  unitCode: string;
  unitNumber: string;
  floorId: string;
  floorName: string;
  floorLevel: number;
  categoryId: string;
  categoryName: string;
  netAreaSqft: string;
  grossAreaSqft: string | null;
  ratePerSqftPkr: string;
  priceAdjustmentPkr: string;
  priceAdjustmentReason: string | null;
  computedPricePkr: string;
  soldPricePkr: string | null;
  bookPricePkr: string;
  status: UnitStatus;
  isSellable: boolean;
  ownershipGroup: string | null;
  subOwner: string | null;
  bookingRef: string | null;
  notes: string | null;
  version: number;
};

export type InventoryTotals = {
  count: number;
  netAreaSqft: string;
  valuePkr: string;
};

export type InventoryFilterOption = {
  id: string;
  name: string;
};

export type InventoryFilterOptions = {
  floors: InventoryFilterOption[];
  categories: Array<InventoryFilterOption & { isSellableDefault: boolean }>;
};

export type UnitDetail = {
  unit: typeof units.$inferSelect;
  floorName: string;
  floorLevel: number;
  categoryName: string;
  categoryIsSellableDefault: boolean;
  computedPricePkr: string;
  bookPricePkr: string;
};

export type UnitJumpTarget = {
  id: string;
  unitCode: string;
  unitNumber: string;
};
