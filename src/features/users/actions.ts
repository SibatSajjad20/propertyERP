"use server";

import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { inviteUserSchema } from "./schema";

export async function inviteUser(input: unknown) {
  const parsed = inviteUserSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "users.manage");
  return {
    email: parsed.email,
    message: "User invites land in a later milestone.",
  };
}
