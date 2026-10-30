import "server-only";

import { desc } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import type { UserRole } from "@/db/schema/enums";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  disabled: boolean;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export async function listUsers(): Promise<UserRow[]> {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      disabled: user.disabled,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));
}
