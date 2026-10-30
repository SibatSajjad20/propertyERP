import "server-only";

import { db } from "@/db";
import { user } from "@/db/schema/auth";

export async function listUsers() {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user);
}
