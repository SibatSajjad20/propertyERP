import { redirect } from "next/navigation";
import { listAuditLog } from "@/features/audit/queries";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const metadata = {
  title: "Audit",
};

export default async function AuditPage() {
  const session = await requireSession();
  if (!can(session.user.role, "audit.read")) {
    redirect("/inventory");
  }
  const rows = await listAuditLog();

  return (
    <div>
      {rows.length === 0 ? (
        <p className="text-[13px] text-ink-muted">No audited events yet.</p>
      ) : (
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line">
              <th className="h-8 px-2 text-left text-[11px] font-medium text-ink-muted">
                When
              </th>
              <th className="h-8 px-2 text-left text-[11px] font-medium text-ink-muted">
                Action
              </th>
              <th className="h-8 px-2 text-left text-[11px] font-medium text-ink-muted">
                Entity
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line">
                <td className="h-8 px-2 tabular-nums">
                  {row.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                </td>
                <td className="h-8 px-2">{row.action}</td>
                <td className="unit-code h-8 px-2">
                  {row.entity} {row.entityId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
