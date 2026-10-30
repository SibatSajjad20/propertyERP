const PAISA_SCALE = 100n;

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

/**
 * Total price = round(rate × net area, 2) + adjustment.
 * Matches the SQL view `unit_pricing`.
 */
export function computeTotalPrice(
  ratePerSqftPkr: string,
  netAreaSqft: string,
  priceAdjustmentPkr = "0",
): string {
  const ratePaisa = parseDecimal(ratePerSqftPkr);
  const areaPaisa = parseDecimal(netAreaSqft);
  const adjustmentPaisa = parseDecimal(priceAdjustmentPkr);
  const productPaisa = divRoundHalfUp(ratePaisa * areaPaisa, PAISA_SCALE);
  return formatDecimal(productPaisa + adjustmentPaisa);
}

export function formatPkrLedger(amount: string): string {
  const negative = amount.trim().startsWith("-");
  const unsigned = negative ? amount.trim().slice(1) : amount.trim();
  const [wholeRaw, fraction = "00"] = unsigned.split(".");
  const whole = (wholeRaw ?? "0").replace(/^0+(?=\d)/, "") || "0";
  const withSeparators = whole.replace(/(\d)(?=(\d{2})+\d$)/g, "$1,");
  const sign = negative ? "-" : "";
  return `${sign}${withSeparators}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

export function formatPkrCompact(amount: string): string {
  const paisa = parseDecimal(amount);
  const negative = paisa < 0n;
  const absolute = negative ? -paisa : paisa;
  const rupees = Number(absolute / PAISA_SCALE);
  const sign = negative ? "-" : "";

  if (rupees >= 10_000_000) {
    const crore = rupees / 10_000_000;
    return `${sign}${crore.toFixed(2)} crore`;
  }
  if (rupees >= 100_000) {
    const lakh = rupees / 100_000;
    return `${sign}${lakh.toFixed(2)} lakh`;
  }
  return `${sign}${formatPkrLedger(formatDecimal(absolute))}`;
}

export function formatPkr(amount: string): string {
  return `PKR ${formatPkrCompact(amount)}`;
}
