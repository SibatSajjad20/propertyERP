import { PageSkeleton } from "@/components/page-skeleton";

export default function UsersLoading() {
  return <PageSkeleton rows={6} label="Loading users…" />;
}
