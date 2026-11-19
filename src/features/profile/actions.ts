"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth, clearUserFlagsCache, requireSession } from "@/lib/auth";
import { db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { user } from "@/db/schema/auth";
import { ValidationError } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";
import { changeOwnPasswordSchema, updateOwnNameSchema } from "./schema";

function asAuditJson(row: object): Record<string, unknown> {
  return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
}

export async function updateOwnName(input: unknown) {
  const parsed = updateOwnNameSchema.parse(input);
  const session = await requireSession({ allowMustChangePassword: true });
  assertCan(session.user.role, "profile.update");

  const [current] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  if (!current) {
    throw new ValidationError("Account not found.");
  }

  if (current.name === parsed.name) {
    return { name: current.name };
  }

  const [row] = await db
    .update(user)
    .set({ name: parsed.name, updatedAt: new Date() })
    .where(eq(user.id, session.user.id))
    .returning();
  if (!row) {
    throw new ValidationError("Could not update name.");
  }

  await db.insert(auditLog).values({
    actorId: session.user.id,
    entity: "user",
    entityId: row.id,
    action: "UPDATE",
    before: asAuditJson({ name: current.name, email: current.email, role: current.role }),
    after: asAuditJson({
      name: row.name,
      email: row.email,
      role: row.role,
      change: "profile_name",
    }),
  });

  clearUserFlagsCache(session.user.id);
  revalidatePath("/settings/profile");
  revalidatePath("/settings/users");
  revalidatePath("/audit");
  return { name: row.name };
}

export async function changeOwnPassword(input: unknown) {
  const parsed = changeOwnPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const session = await requireSession({ allowMustChangePassword: true });
  assertCan(session.user.role, "profile.update");

  try {
    const result = await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
    });
    if (!result) {
      return { ok: false as const, error: "Could not change password." };
    }
  } catch {
    return { ok: false as const, error: "Current password is incorrect." };
  }

  const [current] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  await db
    .update(user)
    .set({ mustChangePassword: false, updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  await db.insert(auditLog).values({
    actorId: session.user.id,
    entity: "user",
    entityId: session.user.id,
    action: "UPDATE",
    before: asAuditJson({
      email: current?.email ?? session.user.email,
      mustChangePassword: current?.mustChangePassword ?? true,
    }),
    after: asAuditJson({
      email: current?.email ?? session.user.email,
      mustChangePassword: false,
      change: "password",
    }),
  });

  clearUserFlagsCache(session.user.id);
  revalidatePath("/settings/profile");
  revalidatePath("/");
  revalidatePath("/audit");
  return { ok: true as const };
}
