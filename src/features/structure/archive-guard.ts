export type ArchiveKind = "property" | "block" | "floor";

export type ArchiveResult = { ok: true } | { ok: false; error: string };

export function activeUnitsArchiveMessage(kind: ArchiveKind, count: number): string {
  const noun = count === 1 ? "unit" : "units";
  const verb = count === 1 ? "exists" : "exist";
  return `Cannot archive this ${kind}: ${count} active ${noun} still ${verb}. Archive or move them first.`;
}

export function assertNoActiveUnits(kind: ArchiveKind, count: number): ArchiveResult {
  if (count > 0) {
    return { ok: false, error: activeUnitsArchiveMessage(kind, count) };
  }
  return { ok: true };
}
