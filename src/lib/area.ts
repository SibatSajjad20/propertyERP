import { formatDecimal, parseDecimal } from "./money";

export function formatSqft(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const paisaLike = parseDecimal(value);
  return `${formatDecimal(paisaLike)} sqft`;
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
