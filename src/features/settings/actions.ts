"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { authorizedSignatories, companySettings } from "@/db/schema/sales";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { saveCompanySettingsSchema } from "./schema";
import { getCompanySettingsRow } from "@/features/documents/receipts";
import { revalidatePath } from "next/cache";

export async function saveCompanySettings(input: unknown) {
  const parsed = saveCompanySettingsSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "settings.manage");

  const settings = await getCompanySettingsRow();
  await db
    .update(companySettings)
    .set({
      bankName: parsed.bankName,
      accountTitle: parsed.accountTitle,
      iban: parsed.iban,
      updatedAt: new Date(),
    })
    .where(eq(companySettings.id, settings.id));

  const incomingIds = parsed.signatories.map((row) => row.id).filter(Boolean) as string[];
  const existing = await db
    .select({ id: authorizedSignatories.id })
    .from(authorizedSignatories);
  const incomingSet = new Set(incomingIds);

  for (const row of existing) {
    if (!incomingSet.has(row.id)) {
      await db
        .update(authorizedSignatories)
        .set({ isActive: false })
        .where(eq(authorizedSignatories.id, row.id));
    }
  }

  for (const [index, row] of parsed.signatories.entries()) {
    if (row.id) {
      await db
        .update(authorizedSignatories)
        .set({
          name: row.name,
          designation: row.designation,
          sortOrder: row.sortOrder ?? index,
          isActive: row.isActive ?? true,
        })
        .where(eq(authorizedSignatories.id, row.id));
    } else {
      await db.insert(authorizedSignatories).values({
        name: row.name,
        designation: row.designation,
        sortOrder: row.sortOrder ?? index,
        isActive: row.isActive ?? true,
      });
    }
  }

  revalidatePath("/settings/company");
  return { ok: true };
}
