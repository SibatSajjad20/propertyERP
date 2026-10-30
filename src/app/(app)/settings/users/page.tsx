import { redirect } from "next/navigation";
import { listUsers } from "@/features/users/queries";
import { UsersScreen } from "@/features/users/components/users-screen";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Users",
};

export default async function UsersSettingsPage() {
  const session = await requireSession();
  if (!can(session.user.role, "users.read")) {
    redirect("/inventory");
  }
  const users = await listUsers();
  return <UsersScreen users={users} currentUserId={session.user.id} />;
}
