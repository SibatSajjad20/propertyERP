"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth, requireSession } from "@/lib/auth";
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

  revalidatePath("/settings/profile");
  revalidatePath("/settings/users");
  revalidatePath("/audit");
  return { name: row.name };
}

export async function changeOwnPassword(input: unknown) {
  const parsed = changeOwnPasswordSchema.parse(input);
  const session = await requireSession({ allowMustChangePassword: true });
  assertCan(session.user.role, "profile.update");

  if (parsed.currentPassword === parsed.newPassword) {
    throw new ValidationError(
      "Choose a new password that is different from the current one.",
    );
  }

  try {
    const result = await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: parsed.currentPassword,
        newPassword: parsed.newPassword,
        revokeOtherSessions: true,
      },
    });
    if (!result) {
      throw new ValidationError("Could not change password.");
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError("Current password is incorrect.");
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

  revalidatePath("/settings/profile");
  revalidatePath("/audit");
  return { ok: true as const };
}
