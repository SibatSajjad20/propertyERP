export const inventorySectionKeys = [
  "mall-shops",
  "commercial-shops",
  "food-court",
  "kiosks",
  "corporate-offices",
  "residential-apartments",
] as const;

export type InventorySectionKey = (typeof inventorySectionKeys)[number];

export interface InventorySectionDef {
  key: InventorySectionKey;
  label: string;
  shortLabel: string;
  description: string;
  canonicalCategoryName: string;
}

export const INVENTORY_SECTIONS: readonly InventorySectionDef[] = [
  {
    key: "mall-shops",
    label: "Mall Shops",
    shortLabel: "Mall Shops",
    description: "Interior mall retail shops across upper retail levels",
    canonicalCategoryName: "Mall Shops",
  },
  {
    key: "commercial-shops",
    label: "Commercial Shops",
    shortLabel: "Commercial Shops",
    description: "Ground & boulevard-facing commercial retail shops",
    canonicalCategoryName: "Commercial Shops",
  },
  {
    key: "food-court",
    label: "Food Court",
    shortLabel: "Food Court",
    description: "Food outlets, kitchens, and dining court units",
    canonicalCategoryName: "Food Court",
  },
  {
    key: "kiosks",
    label: "Kiosks",
    shortLabel: "Kiosks",
    description: "Mall atrium and concourse kiosks",
    canonicalCategoryName: "Kiosks",
  },
  {
    key: "corporate-offices",
    label: "Corporate Offices",
    shortLabel: "Corporate Offices",
    description: "Dedicated office suites and corporate floors",
    canonicalCategoryName: "Corporate Offices",
  },
  {
    key: "residential-apartments",
    label: "Residential Apartments",
    shortLabel: "Apartments",
    description: "1-BED, 2-BED, and residential apartment suites",
    canonicalCategoryName: "Residential Apartments",
  },
] as const;

export function isInventorySectionKey(
  value: string | undefined | null,
): value is InventorySectionKey {
  if (!value) return false;
  return (inventorySectionKeys as readonly string[]).includes(value);
}

/**
 * Classifies a unit/category into one of the 6 Inventory Sections (or null for amenities).
 * Keeps legacy category names (`Shop`, `Office`, `Kiosk`, `Food Outlets`, `1-BED`, `2-BED`)
 * cleanly mapped while respecting explicit section category names.
 */
export function matchCategoryToSection(
  categoryName: string,
  floorLevel?: number,
): InventorySectionKey | null {
  const c = categoryName.trim().toLowerCase();

  if (c === "mall shops" || c === "mall shop") return "mall-shops";
  if (c === "commercial shops" || c === "commercial shop") return "commercial-shops";
  if (c === "shop" || c === "shops") {
    // Ground / basement legacy shops map to Commercial Shops; upper floor retail shops to Mall Shops
    return (floorLevel ?? 0) >= 1 ? "mall-shops" : "commercial-shops";
  }

  if (
    c === "food court" ||
    c === "food outlets" ||
    c === "food outlet" ||
    c === "cafetria" ||
    c === "cafeteria"
  ) {
    return "food-court";
  }

  if (c === "kiosk" || c === "kiosks") return "kiosks";

  if (
    c === "corporate offices" ||
    c === "corporate office" ||
    c === "office" ||
    c === "offices"
  ) {
    return "corporate-offices";
  }

  if (
    c === "residential apartments" ||
    c === "residential apartment" ||
    c === "apartment" ||
    c === "apartments" ||
    c === "1-bed" ||
    c === "2-bed" ||
    c === "3-bed" ||
    c.includes("apartment")
  ) {
    return "residential-apartments";
  }

  return null;
}

export function categoryMatchesSection(
  categoryName: string,
  section: InventorySectionKey,
): boolean {
  const c = categoryName.trim().toLowerCase();
  switch (section) {
    case "mall-shops":
      return c === "mall shops" || c === "mall shop" || c === "shop" || c === "shops";
    case "commercial-shops":
      return (
        c === "commercial shops" ||
        c === "commercial shop" ||
        c === "shop" ||
        c === "shops"
      );
    case "food-court":
      return (
        c === "food court" ||
        c === "food outlets" ||
        c === "food outlet" ||
        c === "cafetria" ||
        c === "cafeteria"
      );
    case "kiosks":
      return c === "kiosks" || c === "kiosk";
    case "corporate-offices":
      return (
        c === "corporate offices" ||
        c === "corporate office" ||
        c === "office" ||
        c === "offices"
      );
    case "residential-apartments":
      return (
        c === "residential apartments" ||
        c === "residential apartment" ||
        c === "apartment" ||
        c === "apartments" ||
        c === "1-bed" ||
        c === "2-bed" ||
        c === "3-bed" ||
        c.includes("apartment")
      );
  }
}
