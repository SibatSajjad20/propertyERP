import { redirect } from "next/navigation";
import { listAuditLog } from "@/features/audit/queries";
import { AuditScreen } from "@/features/audit/components/audit-screen";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Audit Log",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  if (!can(session.user.role, "audit.read")) {
    redirect("/inventory");
  }

  const raw = await searchParams;
  const pageParam = typeof raw.page === "string" ? parseInt(raw.page, 10) : 1;
  const actorIdParam = typeof raw.actorId === "string" ? raw.actorId : undefined;
  const entityParam = typeof raw.entity === "string" ? raw.entity : undefined;

  const result = await listAuditLog({
    page: isNaN(pageParam) ? 1 : pageParam,
    pageSize: 50,
    actorId: actorIdParam,
    entity: entityParam,
  });

  return <AuditScreen initialResult={result} />;
}
