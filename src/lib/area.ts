import { formatDecimal, parseDecimal } from "./money";

export function formatSqft(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const paisaLike = parseDecimal(value);
  return `${formatDecimal(paisaLike)} sq ft`;
}

export function isGrossLessThanNet(
  grossAreaSqft: string | null | undefined,
  netAreaSqft: string,
): boolean {
  if (!grossAreaSqft) {
    return false;
  }
  return parseDecimal(grossAreaSqft) < parseDecimal(netAreaSqft);
}

/**
 * Returns the effective area used for unit pricing:
 * Gross Square Feet (per formula: Gross Sq. Ft. × Rate per Sq. Ft. = Total Unit Price),
 * falling back to Net Area only when a legacy record has no gross area stored.
 */
export function effectivePricingArea(
  grossAreaSqft: string | null | undefined,
  netAreaSqft: string,
): string {
  if (grossAreaSqft && grossAreaSqft.trim() !== "") {
    try {
      if (parseDecimal(grossAreaSqft) > 0n) {
        return grossAreaSqft;
      }
    } catch {
      // fall through
    }
  }
  return netAreaSqft;
}

export function isResidentialApartment(
  unitCode?: string | null,
  categoryName?: string | null,
): boolean {
  const cat = (categoryName ?? "").trim().toLowerCase();
  if (
    cat.includes("apartment") ||
    cat === "1-bed" ||
    cat === "2-bed" ||
    cat === "3-bed" ||
    cat.includes("residential")
  ) {
    return true;
  }
  if (unitCode && /-ra\d+/i.test(unitCode.trim())) {
    return true;
  }
  return false;
}

/**
 * Formats an apartment label strictly in the required format:
 * e.g., unit code `10F-RA1` -> `Apartment No. 10F-RA1`
 */
export function formatUnitDisplayCode(
  unitCode: string,
  categoryName?: string | null,
): string {
  const code = unitCode.trim();
  if (isResidentialApartment(code, categoryName)) {
    return `Apartment No. ${code}`;
  }
  return code;
}

export function formatUnitNumberLabel(
  unitCode: string,
  unitNumber?: string | null,
  categoryName?: string | null,
): string {
  const code = unitCode.trim();
  if (isResidentialApartment(code, categoryName)) {
    return `Apartment No. ${code}`;
  }
  return unitNumber?.trim() || code;
}
