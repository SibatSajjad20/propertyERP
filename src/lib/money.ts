const PAISA_SCALE = 100n;
const FOUR_DECIMALS = 10_000n;
const CRORE_RUPEES = 10_000_000n;
const LAKH_RUPEES = 100_000n;

export function parseDecimal(value: string): bigint {
  const trimmed = value.trim();
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  if (!/^\d+(\.\d+)?$/.test(unsigned)) {
    throw new Error(`Invalid decimal: ${value}`);
  }
  const [wholeRaw, fractionRaw = ""] = unsigned.split(".");
  const whole = BigInt(wholeRaw ?? "0");
  const fraction = (fractionRaw + "00").slice(0, 2);
  const third = fractionRaw[2];
  let paisa = whole * PAISA_SCALE + BigInt(fraction);
  if (third !== undefined && third >= "5") {
    paisa += 1n;
  }
  return negative ? -paisa : paisa;
}

export function formatDecimal(paisa: bigint): string {
  const negative = paisa < 0n;
  const absolute = negative ? -paisa : paisa;
  const whole = absolute / PAISA_SCALE;
  const fraction = (absolute % PAISA_SCALE).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${fraction}`;
}

function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  const negative = numerator < 0n !== denominator < 0n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const quotient = n / d;
  const remainder = n % d;
  const rounded = remainder * 2n >= d ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
}

function decimalsEqual(left: string, right: string): boolean {
  return parseDecimal(left) === parseDecimal(right);
}

export function moneyEquals(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  if (left == null || left.trim() === "") {
    return right == null || right.trim() === "";
  }
  if (right == null || right.trim() === "") {
    return false;
  }
  return decimalsEqual(left, right);
}

/**
 * Asking price = round(rate × net area + adjustment, 0) to whole rupees.
 * Matches the SQL view `unit_pricing`. Decimal strings only — no JS floats.
 */
export function computeTotalPrice(
  ratePerSqftPkr: string,
  netAreaSqft: string,
  priceAdjustmentPkr = "0",
): string {
  const ratePaisa = parseDecimal(ratePerSqftPkr);
  const areaPaisa = parseDecimal(netAreaSqft);
  const adjustmentPaisa = parseDecimal(priceAdjustmentPkr);
  const productFour = ratePaisa * areaPaisa;
  const adjustmentFour = adjustmentPaisa * PAISA_SCALE;
  const rupees = divRoundHalfUp(productFour + adjustmentFour, FOUR_DECIMALS);
  return formatDecimal(rupees * PAISA_SCALE);
}

function indianGroup(whole: string): string {
  return whole.replace(/(\d)(?=(\d{2})+\d$)/g, "$1,");
}

export function formatPkrLedger(amount: string): string {
  const trimmed = amount.trim();
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [wholeRaw, fractionRaw = "00"] = unsigned.split(".");
  const whole = (wholeRaw ?? "0").replace(/^0+(?=\d)/, "") || "0";
  const fraction = (fractionRaw + "00").slice(0, 2);
  const grouped = indianGroup(whole);
  const sign = negative ? "-" : "";
  const body = fraction === "00" ? grouped : `${grouped}.${fraction}`;
  return `${sign}Rs ${body}`;
}

function formatTenths(tenths: bigint): string {
  const whole = tenths / 10n;
  const frac = tenths % 10n;
  if (frac === 0n) {
    return whole.toString();
  }
  return `${whole.toString()}.${frac.toString()}`;
}

export function formatPkrCompact(amount: string): string {
  const paisa = parseDecimal(amount);
  const negative = paisa < 0n;
  const absolute = negative ? -paisa : paisa;
  const rupees = absolute / PAISA_SCALE;
  const sign = negative ? "-" : "";

  if (rupees >= CRORE_RUPEES) {
    const tenths = divRoundHalfUp(rupees * 10n, CRORE_RUPEES);
    return `${sign}${formatTenths(tenths)} Cr`;
  }
  if (rupees >= LAKH_RUPEES) {
    const tenths = divRoundHalfUp(rupees * 10n, LAKH_RUPEES);
    return `${sign}${formatTenths(tenths)} Lac`;
  }
  return formatPkrLedger(formatDecimal(negative ? -absolute : absolute));
}

export function formatPkr(amount: string): string {
  return formatPkrLedger(amount);
}
