import { redirect } from "next/navigation";
import { listUsers } from "@/features/users/queries";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Users",
};

export default async function UsersPage() {
  const session = await requireSession();
  if (!can(session.user.role, "users.read")) {
    redirect("/inventory");
  }
  const users = await listUsers();

  return (
    <div>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line">
            <th className="h-8 px-2 text-left text-[11px] font-medium text-ink-muted">
              Name
            </th>
            <th className="h-8 px-2 text-left text-[11px] font-medium text-ink-muted">
              Email
            </th>
            <th className="h-8 px-2 text-left text-[11px] font-medium text-ink-muted">
              Role
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((row) => (
            <tr key={row.id} className="border-b border-line">
              <td className="h-8 px-2">{row.name}</td>
              <td className="h-8 px-2">{row.email}</td>
              <td className="h-8 px-2">{row.role.replaceAll("_", " ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
