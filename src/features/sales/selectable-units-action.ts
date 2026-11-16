"use server";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { assertCan, can } from "@/lib/permissions";
import { ValidationError } from "@/lib/errors";
import { getSelectableUnits } from "./queries";

const listSchema = z.object({
  floorId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  search: z.string().trim().max(40).optional(),
});

export async function listSelectableUnitsAction(input: unknown) {
  const parsed = listSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid filters");
  }
  const session = await requireSession();
  if (
    !can(session.user.role, "bookings.create") &&
    !can(session.user.role, "sales.create") &&
    !can(session.user.role, "reservations.create")
  ) {
    assertCan(session.user.role, "bookings.create");
  }
  return getSelectableUnits(parsed.data);
}
