import { PageSkeleton } from "@/components/page-skeleton";

export default function ProfileLoading() {
  return <PageSkeleton rows={4} label="Loading profile…" />;
}
