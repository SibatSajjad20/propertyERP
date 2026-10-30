"use server";

import { db } from "@/db";
import { blocks } from "@/db/schema/property";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { createBlockSchema } from "./schema";

export async function createBlock(input: unknown) {
  const parsed = createBlockSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "structure.manage");
  const [created] = await db.insert(blocks).values(parsed).returning();
  if (!created) {
    throw new Error("Failed to create block");
  }
  return created;
}
