import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const instant = false;

export default async function UsersRedirectPage() {
  const session = await requireSession();
  if (!can(session.user.role, "users.read")) {
    redirect("/inventory");
  }
  redirect("/settings/users" as never);
}
