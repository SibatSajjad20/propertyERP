import { and, eq, isNull } from "drizzle-orm";
import { computeTotalPrice } from "../lib/money";
import { db } from "./index";
import { categories, floors } from "./schema/property";
import { units } from "./schema/units";
import type { UnitStatus } from "./schema/enums";

type SeedUnit = {
  unitCode: string;
  unitNumber: string;
  floorLevel: number;
  category: string;
  netAreaSqft: string;
  grossAreaSqft: string | null;
  ratePerSqftPkr: string;
  priceAdjustmentPkr?: string;
  priceAdjustmentReason?: string;
  status?: UnitStatus;
  isSellable?: boolean;
  ownershipGroup: string;
  subOwner?: string;
  bookingRef?: string;
};

/**
 * Dev-only sample inventory. Clearly marked in `notes`.
 * Codes follow the building: GF ground, nF upper floors.
 */
const DEV_SEED_UNITS: readonly SeedUnit[] = [
  {
    unitCode: "GF-S12",
    unitNumber: "S12",
    floorLevel: 0,
    category: "Shop",
    netAreaSqft: "312.50",
    grossAreaSqft: "340.00",
    ratePerSqftPkr: "25000.00",
    ownershipGroup: "Sardar Group",
    subOwner: "Ayesha Sardar",
  },
  {
    unitCode: "GF-S14",
    unitNumber: "S14",
    floorLevel: 0,
    category: "Shop",
    netAreaSqft: "280.00",
    grossAreaSqft: "305.00",
    ratePerSqftPkr: "24500.00",
    ownershipGroup: "Hashmi Associates",
  },
  {
    unitCode: "GF-S18",
    unitNumber: "S18",
    floorLevel: 0,
    category: "Shop",
    netAreaSqft: "198.00",
    grossAreaSqft: null,
    ratePerSqftPkr: "26000.00",
    ownershipGroup: "Malik Holdings",
  },
  {
    unitCode: "GF-K02",
    unitNumber: "K02",
    floorLevel: 0,
    category: "Kiosk",
    netAreaSqft: "48.00",
    grossAreaSqft: "52.00",
    ratePerSqftPkr: "32000.00",
    ownershipGroup: "Sardar Group",
  },
  {
    unitCode: "GF-FC1",
    unitNumber: "FC1",
    floorLevel: 0,
    category: "Food Court",
    netAreaSqft: "420.00",
    grossAreaSqft: "465.00",
    ratePerSqftPkr: "18500.00",
    status: "SOLD",
    ownershipGroup: "Khan Foods",
    bookingRef: "BK-2041",
  },
  {
    unitCode: "1F-PH1",
    unitNumber: "PH1",
    floorLevel: 1,
    category: "Shop",
    netAreaSqft: "640.00",
    grossAreaSqft: "710.00",
    ratePerSqftPkr: "31000.00",
    priceAdjustmentPkr: "150000.00",
    priceAdjustmentReason: "Corner premium on the atrium",
    ownershipGroup: "Sardar Group",
    subOwner: "Hamza Sardar",
  },
  {
    unitCode: "1F-S21",
    unitNumber: "S21",
    floorLevel: 1,
    category: "Shop",
    netAreaSqft: "225.00",
    grossAreaSqft: "240.00",
    ratePerSqftPkr: "24000.00",
    ownershipGroup: "Rizvi Traders",
  },
  {
    unitCode: "1F-S24",
    unitNumber: "S24",
    floorLevel: 1,
    category: "Shop",
    netAreaSqft: "210.00",
    grossAreaSqft: null,
    ratePerSqftPkr: "24000.00",
    ownershipGroup: "Hashmi Associates",
  },
  {
    unitCode: "1F-K08",
    unitNumber: "K08",
    floorLevel: 1,
    category: "Kiosk",
    netAreaSqft: "36.00",
    grossAreaSqft: "40.00",
    ratePerSqftPkr: "30000.00",
    ownershipGroup: "Sardar Group",
  },
  {
    unitCode: "2F-S31",
    unitNumber: "S31",
    floorLevel: 2,
    category: "Shop",
    netAreaSqft: "190.00",
    grossAreaSqft: "205.00",
    ratePerSqftPkr: "22000.00",
    status: "SOLD",
    ownershipGroup: "Malik Holdings",
    bookingRef: "BK-1988",
  },
  {
    unitCode: "2F-S36",
    unitNumber: "S36",
    floorLevel: 2,
    category: "Shop",
    netAreaSqft: "255.00",
    grossAreaSqft: "270.00",
    ratePerSqftPkr: "22000.00",
    ownershipGroup: "Rizvi Traders",
  },
  {
    unitCode: "2F-FC4",
    unitNumber: "FC4",
    floorLevel: 2,
    category: "Food Court",
    netAreaSqft: "380.00",
    grossAreaSqft: "410.00",
    ratePerSqftPkr: "17500.00",
    ownershipGroup: "Khan Foods",
  },
  {
    unitCode: "3F-S41",
    unitNumber: "S41",
    floorLevel: 3,
    category: "Shop",
    netAreaSqft: "175.00",
    grossAreaSqft: "190.00",
    ratePerSqftPkr: "21000.00",
    ownershipGroup: "Hashmi Associates",
  },
  {
    unitCode: "3F-S48",
    unitNumber: "S48",
    floorLevel: 3,
    category: "Shop",
    netAreaSqft: "160.00",
    grossAreaSqft: null,
    ratePerSqftPkr: "21000.00",
    ownershipGroup: "Sardar Group",
  },
  {
    unitCode: "3F-OF2",
    unitNumber: "OF2",
    floorLevel: 3,
    category: "Office",
    netAreaSqft: "520.00",
    grossAreaSqft: "580.00",
    ratePerSqftPkr: "16000.00",
    ownershipGroup: "Malik Holdings",
    subOwner: "Nida Malik",
  },
  {
    unitCode: "4F-S52",
    unitNumber: "S52",
    floorLevel: 4,
    category: "Shop",
    netAreaSqft: "205.00",
    grossAreaSqft: "220.00",
    ratePerSqftPkr: "20000.00",
    ownershipGroup: "Rizvi Traders",
  },
  {
    unitCode: "4F-MR1",
    unitNumber: "MR1",
    floorLevel: 4,
    category: "Meeting Room",
    netAreaSqft: "140.00",
    grossAreaSqft: "155.00",
    ratePerSqftPkr: "12000.00",
    isSellable: false,
    ownershipGroup: "Sardar Group",
  },
  {
    unitCode: "4F-AM1",
    unitNumber: "AM1",
    floorLevel: 4,
    category: "Amenities",
    netAreaSqft: "900.00",
    grossAreaSqft: "980.00",
    ratePerSqftPkr: "0.00",
    isSellable: false,
    ownershipGroup: "Sardar Group",
  },
  {
    unitCode: "5F-S61",
    unitNumber: "S61",
    floorLevel: 5,
    category: "Shop",
    netAreaSqft: "188.00",
    grossAreaSqft: "200.00",
    ratePerSqftPkr: "19500.00",
    status: "SOLD",
    ownershipGroup: "Hashmi Associates",
    bookingRef: "BK-2210",
  },
  {
    unitCode: "5F-S67",
    unitNumber: "S67",
    floorLevel: 5,
    category: "Shop",
    netAreaSqft: "172.00",
    grossAreaSqft: null,
    ratePerSqftPkr: "19500.00",
    ownershipGroup: "Malik Holdings",
  },
  {
    unitCode: "5F-OF6",
    unitNumber: "OF6",
    floorLevel: 5,
    category: "Office",
    netAreaSqft: "610.00",
    grossAreaSqft: "670.00",
    ratePerSqftPkr: "15500.00",
    ownershipGroup: "Rizvi Traders",
  },
  {
    unitCode: "6F-RA33",
    unitNumber: "RA33",
    floorLevel: 6,
    category: "Shop",
    netAreaSqft: "265.00",
    grossAreaSqft: "290.00",
    ratePerSqftPkr: "18500.00",
    ownershipGroup: "Sardar Group",
  },
  {
    unitCode: "6F-RA35",
    unitNumber: "RA35",
    floorLevel: 6,
    category: "Shop",
    netAreaSqft: "248.00",
    grossAreaSqft: "270.00",
    ratePerSqftPkr: "18500.00",
    priceAdjustmentPkr: "-50000.00",
    priceAdjustmentReason: "Column obstruction discount",
    ownershipGroup: "Hashmi Associates",
  },
  {
    unitCode: "6F-OF9",
    unitNumber: "OF9",
    floorLevel: 6,
    category: "Office",
    netAreaSqft: "455.00",
    grossAreaSqft: null,
    ratePerSqftPkr: "15000.00",
    ownershipGroup: "Malik Holdings",
  },
  {
    unitCode: "7F-S71",
    unitNumber: "S71",
    floorLevel: 7,
    category: "Shop",
    netAreaSqft: "156.00",
    grossAreaSqft: "168.00",
    ratePerSqftPkr: "18000.00",
    ownershipGroup: "Rizvi Traders",
  },
  {
    unitCode: "7F-S74",
    unitNumber: "S74",
    floorLevel: 7,
    category: "Shop",
    netAreaSqft: "164.00",
    grossAreaSqft: "176.00",
    ratePerSqftPkr: "18000.00",
    status: "SOLD",
    ownershipGroup: "Sardar Group",
    bookingRef: "BK-2302",
  },
  {
    unitCode: "8F-OF11",
    unitNumber: "OF11",
    floorLevel: 8,
    category: "Office",
    netAreaSqft: "720.00",
    grossAreaSqft: "800.00",
    ratePerSqftPkr: "14500.00",
    ownershipGroup: "Hashmi Associates",
  },
  {
    unitCode: "8F-MR3",
    unitNumber: "MR3",
    floorLevel: 8,
    category: "Meeting Room",
    netAreaSqft: "95.00",
    grossAreaSqft: "110.00",
    ratePerSqftPkr: "11000.00",
    isSellable: false,
    ownershipGroup: "Sardar Group",
  },
  {
    unitCode: "9F-S91",
    unitNumber: "S91",
    floorLevel: 9,
    category: "Shop",
    netAreaSqft: "142.00",
    grossAreaSqft: null,
    ratePerSqftPkr: "17000.00",
    ownershipGroup: "Malik Holdings",
  },
  {
    unitCode: "10F-PH2",
    unitNumber: "PH2",
    floorLevel: 10,
    category: "Office",
    netAreaSqft: "980.00",
    grossAreaSqft: "1080.00",
    ratePerSqftPkr: "22000.00",
    priceAdjustmentPkr: "250000.00",
    priceAdjustmentReason: "Top-floor panorama premium",
    ownershipGroup: "Sardar Group",
    subOwner: "Bilal Sardar",
  },
];

export async function seedDevUnits(propertyId: string, blockId: string) {
  if (process.env.NODE_ENV === "production") {
    return 0;
  }

  const floorRows = await db.select().from(floors).where(eq(floors.blockId, blockId));
  const floorsByLevel = new Map(floorRows.map((row) => [row.level, row]));

  const categoryRows = await db
    .select()
    .from(categories)
    .where(eq(categories.propertyId, propertyId));
  const categoriesByName = new Map(categoryRows.map((row) => [row.name, row]));

  const existing = await db
    .select({ unitCode: units.unitCode })
    .from(units)
    .where(and(eq(units.propertyId, propertyId), isNull(units.archivedAt)));
  const existingCodes = new Set(existing.map((row) => row.unitCode));

  const toInsert = DEV_SEED_UNITS.flatMap((item) => {
    if (existingCodes.has(item.unitCode)) {
      return [];
    }
    const floor = floorsByLevel.get(item.floorLevel);
    const category = categoriesByName.get(item.category);
    if (!floor || !category) {
      throw new Error(
        `Dev seed is missing floor level ${item.floorLevel} or category ${item.category}`,
      );
    }
    const adjustment = item.priceAdjustmentPkr ?? "0";
    const status = item.status ?? "AVAILABLE";
    const soldPricePkr =
      status === "SOLD"
        ? computeTotalPrice(item.ratePerSqftPkr, item.netAreaSqft, adjustment)
        : null;
    return [
      {
        propertyId,
        unitCode: item.unitCode,
        unitNumber: item.unitNumber,
        floorId: floor.id,
        categoryId: category.id,
        netAreaSqft: item.netAreaSqft,
        grossAreaSqft: item.grossAreaSqft,
        ratePerSqftPkr: item.ratePerSqftPkr,
        priceAdjustmentPkr: adjustment,
        priceAdjustmentReason: item.priceAdjustmentReason ?? null,
        soldPricePkr,
        status,
        isSellable: item.isSellable ?? category.isSellableDefault,
        ownershipGroup: item.ownershipGroup,
        subOwner: item.subOwner ?? null,
        bookingRef: item.bookingRef ?? null,
        notes: "[dev seed] Sample Sardar's Mall unit for local development.",
      },
    ];
  });

  if (toInsert.length > 0) {
    await db.insert(units).values(toInsert);
  }
  return toInsert.length;
}
