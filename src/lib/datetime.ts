const KARACHI = "Asia/Karachi";

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((item) => item.type === type)?.value ?? "";
}

export function formatKarachiDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KARACHI,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const dayPeriod = part(parts, "dayPeriod").replaceAll(".", "").toUpperCase();
  return `${part(parts, "day")} ${part(parts, "month")} ${part(parts, "year")}, ${part(parts, "hour")}:${part(parts, "minute")} ${dayPeriod}`;
}

export function formatKarachiDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: KARACHI,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
