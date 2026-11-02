import { z } from "zod";

export const reportPresets = [
  "this_month",
  "last_month",
  "this_quarter",
  "this_year",
  "custom",
  "all",
] as const;

export type ReportPreset = (typeof reportPresets)[number];

export const reportFiltersSchema = z.object({
  preset: z.enum(reportPresets).default("this_month"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  floorId: z.string().optional(),
  categoryId: z.string().optional(),
  blockId: z.string().optional(),
  status: z.string().optional(),
  quickFilter: z.enum(["all", "due_this_week", "due_this_month", "overdue"]).optional(),
  clientId: z.string().optional(),
  q: z.string().optional(),
});

export type ReportFilters = z.infer<typeof reportFiltersSchema>;

/**
 * Resolves standard date presets into concrete startDate and endDate strings (YYYY-MM-DD).
 */
export function resolvePresetDates(
  preset: ReportPreset = "this_month",
  customStart?: string,
  customEnd?: string,
): { startDate: Date; endDate: Date } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  if (preset === "custom" && customStart && customEnd) {
    const s = new Date(customStart + "T00:00:00");
    const e = new Date(customEnd + "T23:59:59.999");
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      return { startDate: s, endDate: e };
    }
  }

  switch (preset) {
    case "last_month": {
      const start = new Date(y, m - 1, 1, 0, 0, 0);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    case "this_quarter": {
      const qStartMonth = Math.floor(m / 3) * 3;
      const start = new Date(y, qStartMonth, 1, 0, 0, 0);
      const end = new Date(y, qStartMonth + 3, 0, 23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    case "this_year": {
      const start = new Date(y, 0, 1, 0, 0, 0);
      const end = new Date(y, 11, 31, 23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    case "all": {
      const start = new Date(2020, 0, 1, 0, 0, 0);
      const end = new Date(y + 5, 11, 31, 23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    case "this_month":
    default: {
      const start = new Date(y, m, 1, 0, 0, 0);
      const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
  }
}

export function formatDateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
