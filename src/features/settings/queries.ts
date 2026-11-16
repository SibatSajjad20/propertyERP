import "server-only";

import { asc } from "drizzle-orm";
import { db } from "@/db";
import { authorizedSignatories } from "@/db/schema/sales";
import { getCompanySettingsRow } from "@/features/documents/receipts";

export async function getCompanySettingsPage() {
  const [settings, signatories] = await Promise.all([
    getCompanySettingsRow(),
    db
      .select()
      .from(authorizedSignatories)
      .orderBy(asc(authorizedSignatories.sortOrder), asc(authorizedSignatories.name)),
  ]);
  return { settings, signatories };
}
