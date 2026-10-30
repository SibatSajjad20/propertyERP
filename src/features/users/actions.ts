"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { account, session as sessionTable, user } from "@/db/schema/auth";
import { requireSession } from "@/lib/auth";
import { ValidationError } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";
import {
  createUserSchema,
  resetUserPasswordSchema,
  setUserDisabledSchema,
  updateUserRoleSchema,
} from "./schema";

function asAuditJson(row: object): Record<string, unknown> {
  return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
}

async function writeAudit(
  actorId: string,
  entityId: string,
  action: "CREATE" | "UPDATE",
  before: object | null,
  after: object | null,
) {
  await db.insert(auditLog).values({
    actorId,
    entity: "user",
    entityId,
    action,
    before: before ? asAuditJson(before) : null,
    after: after ? asAuditJson(after) : null,
  });
}

async function countActiveAdmins(excludingId?: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user)
    .where(
      excludingId
        ? and(eq(user.role, "ADMIN"), eq(user.disabled, false), ne(user.id, excludingId))
        : and(eq(user.role, "ADMIN"), eq(user.disabled, false)),
    );
  return Number(row?.count ?? 0);
}

function publicUser(row: typeof user.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    disabled: row.disabled,
    mustChangePassword: row.mustChangePassword,
  };
}

export async function createUser(input: unknown) {
  const parsed = createUserSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "users.manage");

  const email = parsed.email.toLowerCase();
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (existing) {
    throw new ValidationError("A user with that email already exists.");
  }

  const userId = randomUUID();
  const passwordHash = await hashPassword(parsed.temporaryPassword);
  const [created] = await db
    .insert(user)
    .values({
      id: userId,
      name: parsed.name,
      email,
      emailVerified: true,
      role: parsed.role,
      mustChangePassword: true,
    })
    .returning();
  if (!created) {
    throw new ValidationError("Could not create user.");
  }
  await db.insert(account).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
  });
  await writeAudit(session.user.id, created.id, "CREATE", null, {
    ...publicUser(created),
    change: "created",
  });
  revalidatePath("/settings/users");
  revalidatePath("/users");
  revalidatePath("/audit");
  return publicUser(created);
}

export async function updateUserRole(input: unknown) {
  const parsed = updateUserRoleSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "users.manage");
  if (parsed.id === session.user.id) {
    throw new ValidationError("You cannot change your own role.");
  }
  const [current] = await db.select().from(user).where(eq(user.id, parsed.id)).limit(1);
  if (!current) {
    throw new ValidationError("User not found.");
  }
  if (current.role === "ADMIN" && parsed.role !== "ADMIN" && !current.disabled) {
    const remaining = await countActiveAdmins(current.id);
    if (remaining < 1) {
      throw new ValidationError("Keep at least one active administrator.");
    }
  }
  const [updated] = await db
    .update(user)
    .set({ role: parsed.role, updatedAt: new Date() })
    .where(eq(user.id, parsed.id))
    .returning();
  if (!updated) {
    throw new ValidationError("Could not update role.");
  }
  await writeAudit(session.user.id, updated.id, "UPDATE", publicUser(current), {
    ...publicUser(updated),
    change: "role",
  });
  revalidatePath("/settings/users");
  revalidatePath("/audit");
  return publicUser(updated);
}

export async function setUserDisabled(input: unknown) {
  const parsed = setUserDisabledSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "users.manage");
  if (parsed.id === session.user.id) {
    throw new ValidationError("You cannot disable your own account.");
  }
  const [current] = await db.select().from(user).where(eq(user.id, parsed.id)).limit(1);
  if (!current) {
    throw new ValidationError("User not found.");
  }
  if (parsed.disabled && current.role === "ADMIN" && !current.disabled) {
    const remaining = await countActiveAdmins(current.id);
    if (remaining < 1) {
      throw new ValidationError("Keep at least one active administrator.");
    }
  }
  const [updated] = await db
    .update(user)
    .set({ disabled: parsed.disabled, updatedAt: new Date() })
    .where(eq(user.id, parsed.id))
    .returning();
  if (!updated) {
    throw new ValidationError("Could not update user.");
  }
  if (parsed.disabled) {
    await db.delete(sessionTable).where(eq(sessionTable.userId, parsed.id));
  }
  await writeAudit(session.user.id, updated.id, "UPDATE", publicUser(current), {
    ...publicUser(updated),
    change: parsed.disabled ? "disabled" : "enabled",
  });
  revalidatePath("/settings/users");
  revalidatePath("/audit");
  return publicUser(updated);
}

export async function resetUserPassword(input: unknown) {
  const parsed = resetUserPasswordSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "users.manage");
  const [current] = await db.select().from(user).where(eq(user.id, parsed.id)).limit(1);
  if (!current) {
    throw new ValidationError("User not found.");
  }
  const passwordHash = await hashPassword(parsed.temporaryPassword);
  const [accountRow] = await db
    .select({ id: account.id })
    .from(account)
    .where(eq(account.userId, parsed.id))
    .limit(1);
  if (accountRow) {
    await db
      .update(account)
      .set({ password: passwordHash, updatedAt: new Date() })
      .where(eq(account.id, accountRow.id));
  } else {
    await db.insert(account).values({
      id: randomUUID(),
      accountId: parsed.id,
      providerId: "credential",
      userId: parsed.id,
      password: passwordHash,
    });
  }
  const [updated] = await db
    .update(user)
    .set({ mustChangePassword: true, updatedAt: new Date() })
    .where(eq(user.id, parsed.id))
    .returning();
  await db.delete(sessionTable).where(eq(sessionTable.userId, parsed.id));
  if (updated) {
    await writeAudit(session.user.id, updated.id, "UPDATE", publicUser(current), {
      ...publicUser(updated),
      change: "password_reset",
    });
  }
  revalidatePath("/settings/users");
  revalidatePath("/audit");
  return updated ? publicUser(updated) : publicUser(current);
}

export async function inviteUser(input: unknown) {
  return createUser({
    ...(typeof input === "object" && input ? input : {}),
    temporaryPassword:
      typeof input === "object" && input && "password" in input
        ? (input as { password?: string }).password
        : undefined,
  });
}
