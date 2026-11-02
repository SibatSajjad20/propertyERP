import { PageSkeleton } from "@/components/page-skeleton";

export default function AuditLoading() {
  return <PageSkeleton rows={10} label="Loading audit log…" />;
}
