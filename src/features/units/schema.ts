import { z } from "zod";
import { unitStatuses } from "@/db/schema/enums";
import { parseDecimal } from "@/lib/money";

export const STALE_UNIT_MESSAGE =
  "This unit was changed by someone else. Reload to see the latest.";

export const UNIT_CODE_PATTERN = /^[A-Z0-9-]+$/;
export const DECIMAL_PATTERN = /^-?\d+(\.\d{1,2})?$/;
export const POSITIVE_DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/;

const optionalText = z
  .string()
  .trim()
  .max(200)
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional();

const notesSchema = z
  .string()
  .trim()
  .max(2000)
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional();

const moneySchema = z
  .string()
  .trim()
  .min(1, "Required")
  .regex(DECIMAL_PATTERN, "Use rupees with up to 2 decimal places");

const areaSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .regex(POSITIVE_DECIMAL_PATTERN, "Use a positive area with up to 2 decimal places")
  .refine((value) => parseDecimal(value) > 0n, "Net area must be greater than 0");

const optionalAreaSchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional()
  .refine(
    (value) => value == null || POSITIVE_DECIMAL_PATTERN.test(value),
    "Use a positive area with up to 2 decimal places",
  );

export const unitCodeSchema = z
  .string()
  .trim()
  .min(1, "Unit code is required")
  .max(32)
  .transform((value) => value.toUpperCase())
  .refine((value) => UNIT_CODE_PATTERN.test(value), "Use letters, numbers, and hyphens");

const unitFieldsSchema = z.object({
  unitCode: unitCodeSchema,
  unitNumber: z.string().trim().min(1, "Unit number is required").max(32),
  floorId: z.uuid(),
  categoryId: z.uuid(),
  netAreaSqft: areaSchema,
  grossAreaSqft: optionalAreaSchema,
  ratePerSqftPkr: moneySchema.refine(
    (value) => parseDecimal(value) >= 0n,
    "Rate cannot be negative",
  ),
  priceAdjustmentPkr: moneySchema.optional().default("0"),
  priceAdjustmentReason: z
    .string()
    .trim()
    .max(500)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional(),
  isSellable: z.boolean().optional(),
  ownershipGroup: optionalText,
  subOwner: optionalText,
  bookingRef: optionalText,
  notes: notesSchema,
});

function refineAdjustmentReason(
  value: {
    priceAdjustmentPkr?: string;
    priceAdjustmentReason?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  const adjustment = parseDecimal(value.priceAdjustmentPkr ?? "0");
  if (adjustment !== 0n && !value.priceAdjustmentReason) {
    ctx.addIssue({
      code: "custom",
      path: ["priceAdjustmentReason"],
      message: "A reason is required when the price is adjusted.",
    });
  }
}

export const createUnitSchema = unitFieldsSchema.superRefine(refineAdjustmentReason);

export const updateUnitSchema = unitFieldsSchema
  .extend({
    id: z.uuid(),
    version: z.number().int().positive(),
    rateChangeReason: z
      .string()
      .trim()
      .max(500)
      .transform((value) => (value.length === 0 ? null : value))
      .nullable()
      .optional(),
  })
  .superRefine(refineAdjustmentReason);

export type UnitFormValues = {
  unitCode: string;
  unitNumber: string;
  floorId: string;
  categoryId: string;
  netAreaSqft: string;
  grossAreaSqft: string;
  ratePerSqftPkr: string;
  priceAdjustmentPkr: string;
  priceAdjustmentReason: string;
  isSellable: boolean;
  ownershipGroup: string;
  subOwner: string;
  bookingRef: string;
  notes: string;
  rateChangeReason: string;
};

export const archiveUnitSchema = z.object({
  id: z.uuid(),
  version: z.number().int().positive(),
});

export const changeUnitStatusSchema = z.object({
  unitId: z.uuid(),
  expectedVersion: z.number().int().positive(),
  toStatus: z.enum(unitStatuses),
  reason: z.string().trim().min(1).max(500).optional(),
});

export const searchUnitsSchema = z.object({
  q: z.string().trim().min(1).max(40),
});

export const inventorySortFields = [
  "unitCode",
  "unitNumber",
  "floor",
  "category",
  "netAreaSqft",
  "grossAreaSqft",
  "ratePerSqftPkr",
  "totalPrice",
  "status",
  "ownershipGroup",
] as const;

export type InventorySortField = (typeof inventorySortFields)[number];

export const inventoryQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  floor: z.string().uuid().optional().or(z.literal("")),
  category: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(unitStatuses).optional().or(z.literal("")),
  sellable: z.enum(["yes", "no"]).optional().or(z.literal("")),
  missingGross: z.enum(["1", "true", "yes"]).optional().or(z.literal("")),
  sort: z.enum(inventorySortFields).optional(),
  dir: z.enum(["asc", "desc"]).optional(),
  unit: z.string().uuid().optional().or(z.literal("")),
  mode: z.enum(["view", "edit", "create"]).optional(),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type ArchiveUnitInput = z.infer<typeof archiveUnitSchema>;
export type ChangeUnitStatusInput = z.infer<typeof changeUnitStatusSchema>;
export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>;

export type InventoryQuery = {
  q?: string;
  floorId?: string;
  categoryId?: string;
  status?: (typeof unitStatuses)[number];
  sellable?: boolean;
  missingGross: boolean;
  sort: InventorySortField;
  dir: "asc" | "desc";
  unitId?: string;
  mode: "view" | "edit" | "create";
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

const defaultInventoryQuery: InventoryQuery = {
  missingGross: false,
  sort: "unitCode",
  dir: "asc",
  mode: "view",
};

export function parseInventorySearchParams(
  raw: Record<string, string | string[] | undefined>,
): InventoryQuery {
  const parsed = inventoryQuerySchema.safeParse({
    q: firstParam(raw.q),
    floor: firstParam(raw.floor),
    category: firstParam(raw.category),
    status: firstParam(raw.status),
    sellable: firstParam(raw.sellable),
    missingGross: firstParam(raw.missingGross),
    sort: firstParam(raw.sort),
    dir: firstParam(raw.dir),
    unit: firstParam(raw.unit),
    mode: firstParam(raw.mode),
  });
  if (!parsed.success) {
    return defaultInventoryQuery;
  }
  const value = parsed.data;

  return {
    q: value.q || undefined,
    floorId: value.floor || undefined,
    categoryId: value.category || undefined,
    status: value.status || undefined,
    sellable:
      value.sellable === "yes" ? true : value.sellable === "no" ? false : undefined,
    missingGross: Boolean(value.missingGross),
    sort: value.sort ?? "unitCode",
    dir: value.dir ?? "asc",
    unitId: value.unit || undefined,
    mode: value.mode ?? "view",
  };
}

export function inventoryQueryString(
  query: InventoryQuery,
  overrides: Partial<InventoryQuery> = {},
): string {
  const next = { ...query, ...overrides };
  const params = new URLSearchParams();
  if (next.q) {
    params.set("q", next.q);
  }
  if (next.floorId) {
    params.set("floor", next.floorId);
  }
  if (next.categoryId) {
    params.set("category", next.categoryId);
  }
  if (next.status) {
    params.set("status", next.status);
  }
  if (next.sellable === true) {
    params.set("sellable", "yes");
  }
  if (next.sellable === false) {
    params.set("sellable", "no");
  }
  if (next.missingGross) {
    params.set("missingGross", "1");
  }
  if (next.sort !== "unitCode") {
    params.set("sort", next.sort);
  }
  if (next.dir !== "asc") {
    params.set("dir", next.dir);
  }
  if (next.mode === "create") {
    params.set("mode", "create");
  } else if (next.unitId) {
    params.set("unit", next.unitId);
    if (next.mode === "edit") {
      params.set("mode", "edit");
    }
  }
  return params.toString();
}
