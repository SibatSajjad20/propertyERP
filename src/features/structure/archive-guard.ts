import { ValidationError } from "@/lib/errors";

export type ArchiveKind = "property" | "block" | "floor";

export function activeUnitsArchiveMessage(kind: ArchiveKind, count: number): string {
  const noun = count === 1 ? "unit" : "units";
  const verb = count === 1 ? "exists" : "exist";
  return `Cannot archive this ${kind}: ${count} active ${noun} still ${verb}. Archive or move them first.`;
}

export function assertNoActiveUnits(kind: ArchiveKind, count: number): void {
  if (count > 0) {
    throw new ValidationError(activeUnitsArchiveMessage(kind, count));
  }
}
