import { redirect } from "next/navigation";
import { listAuditLog } from "@/features/audit/queries";
import { AuditScreen } from "@/features/audit/components/audit-screen";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Audit Log",
};

export default async function AuditPage() {
  const session = await requireSession();
  if (!can(session.user.role, "audit.read")) {
    redirect("/inventory");
  }
  const rows = await listAuditLog();

  return <AuditScreen initialRows={rows} />;
}
